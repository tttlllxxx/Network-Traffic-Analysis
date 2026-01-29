from optparse import Option
from turtle import forward
from typing import Optional, Tuple, List, Union
import torch
from torch._dynamo.external_utils import FakeBackwardCFunction
from transformers.modeling_outputs import CausalLMOutputWithPast
from transformers import PreTrainedModel, GenerationMixin, PretrainedConfig
from transformers.activations import ACT2FN
import torch.nn.functional as F
import torch.nn as nn
import math

# huggingface的类


class MiniMindConfig(PretrainedConfig):
    model_type = "minimind"

    def __init__(
        self,
        dropout: float = 0.0,
        bos_token_id: int = 1,
        eos_token_id: int = 2,
        hidden_act: str = "silu",
        hidden_size: int = 512,
        intermediate_size: int = None,
        max_position_embeddings: int = 32768,
        num_attention_heads: int = 8,
        num_hidden_layers: int = 8,
        num_key_value_heads: int = 2,
        vocab_size: int = 6400,
        rms_norm_eps: float = 1e-05,
        rope_theta: int = 1000000,
        inference_rope_scaling: bool = False,
        flash_attention: bool = True,

        ############ MoE ############
        use_moe: bool = False,
        num_experts_per_tok: int = 2,
        n_routed_experts: int = 4,
        n_shared_experts: int = 1,
        aux_loss_alpha: float = 0.1,
        seq_aux: bool = True,
        norm_topk_prob: bool = True,
        **kwargs,
    ):
        super().__init__(**kwargs)

        self.dropout = dropout
        self.bos_token_id = bos_token_id
        self.eos_token_id = eos_token_id
        self.hidden_act = hidden_act
        self.hidden_size = hidden_size
        self.intermediate_size = intermediate_size
        self.max_position_embeddings = max_position_embeddings
        self.num_attention_heads = num_attention_heads
        self.num_hidden_layers = num_hidden_layers
        self.num_key_value_heads = num_key_value_heads
        self.vocab_size = vocab_size
        self.rms_norm_eps = rms_norm_eps
        self.rope_theta = rope_theta
        self.inference_rope_scaling = inference_rope_scaling
        self.flash_attention = flash_attention
        self.use_moe = use_moe
        self.num_experts_per_tok = num_experts_per_tok
        self.n_routed_experts = n_routed_experts
        self.n_shared_experts = n_shared_experts
        self.seq_aux = seq_aux
        self.norm_topk_prob = norm_topk_prob
        self.aux_loss_alpha = aux_loss_alpha
        self.scoring_func = scoring_func

        self.rope_scaling = (
            {
                "beta_fast": 4,
                "beta_slow": 1,
                "factor": 4,
                "original_max_position_embeddings": 2048,
                "type": "yarn",
            }
            if self.inference_rope_scaling
            else None
        )


class RMSNorm(nn.module):
    # __init__初始化
    def __init__(self, dim: int, eps: float = 1e-5):
        super().__init__()
        self.dim = dim
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))  # 定义一个可学习的缩放参数向量
# _norm

    def _norm(self, x):
        return x*torch.sqrt(x.pow(2).mean(-1, keepdim=True)+self.eps)
# forward

    def forward(self, x):
        return self.weight*self._norm(x.float()).type_as(x)


def precomput_freqs_cis(
    dim: int,
    end: int = int(32*1024),
    rope_base: float = 1e6,
    rope_scaling: Optional[dict] = None
):
    # 写出最初RoPE式子
    freqs = 1.0/(rope_base**(torch.arrange(0, dim, 2)[:dim//2].float()/dim))

    # 从配置中读取 RoPE 扩展参数，用来把原本训练时的 RoPE 最大长度（如 2048）扩展到更长的上下文（如 8k、16k），并控制不同维度的频率扩展速度。
    if rope_scaling is not None:
        orig_max, factor, beta_fast, beta_slow = (
            rope_scaling.get("original_max_position_embeddings", 2048),  # 原始模型训练时的最大序列长度
            rope_scaling.get("factor", 4),  # 表示希望把序列长度扩展多少倍
            rope_scaling.get("beta_fast", 4),  # 快频率（高频）拉伸 4 倍
            rope_scaling.get("beta_slow", 1),  # 慢频率（低频）1 倍（基本不变）
        )
        if end/orig_max > 1.0:
            # 计算corr_dim
            # next(iterator, default_value)
            # 如果 iterator 还能取到值 → 返回下一个值
            # 如果已经没有值了 → 返回 default_value（不报错）
            corr_dim = next((i for i in range(dim//2) if 2*math.pi/freqs[i] > orig_max), dim//2)
            # 计算power
            power = torch.arrange(0, dim//2, device=freqs.device).float()/(max(dim//2-1, 1))
            # 计算beta
            beta = beta_slow+(beta_fast-beta_slow)*power
            # 计算scale
            scale = torch.where(
                torch.arrange(dim//2, device=freqs.device) < corr_dim,  # condition
                (beta*factor-beta+1)/(beta*factor),
                1.0/factor
            )
            # 应用scale
            freqs = freqs*scale

    # 生成位置索引，与频率相乘
    t = torch.arrange(end, device=freqs.device)
    freqs = torch.outer(t, freqs).float()  # [end,dim//2]  pos*ω

    # 返回一个cos和sin
    freqs_cos = torch.cat([torch.cos(freqs), torch.cos(freqs)], dim=-1)  # [end,dim]
    freqs_sin = torch.cat([torch.sin(freqs), torch.sin(freqs)], dim=-1)
    return freqs_cos, freqs_sin


def apply_rotary_pos_emb(q, k, cos, sin, unsqueeze_dim=1):
    # [a,b] -> [-b,a]
    def rotate_half(x):
        # x.shape[-1]取最后一个维度的中点
        # x[...,x.shape[-1]//2:]取后半部分
        # x[...,:x.shape[-1]//2]取前半部分
        return torch.cat([-x[..., x.shape[-1]//2:], x[..., :x.shape[-1]//2]], dim=-1)
    # 应用旋转位置编码
    # x_rotated=x*cos+rotate_half(x)*sin
    q_embed = (q*cos.unsqueeze(unsqueeze_dim)+rotate_half(q)*sin.unsqueeze(unsqueeze_dim))
    k_embed = (k*cos.unsqueeze(unsqueeze_dim)+rotate_half(k)*sin.unsqueeze(unsqueeze_dim))
    return q_embed, k_embed


def repeat_kv(x: torch.Tensor, n_rep: int) -> torch.Tensor:
    bs, slen, num_key_value_heads, head_dim = x.shape
    # bs: batch_size;
    # slen: 序列长度;
    # num_key_value_heads: K/V 的 head 数（通常小于 Q（num_heads））;
    # head_dim: head 的维度
    if n_rep == 1:
        return x
    return (
        x[:, :, :, None, :]
        .expand(bs, slen, num_key_value_heads, n_rep, head_dim)
        .reshape(bs, slen, num_key_value_heads*n_rep, head_dim)
    )


class Attention(nn.Module):
    def __init__(self, args: MiniMindConfig):
        super().__init__()

        self.num_key_value_heads = (
            args.nums_attention_heads
            if args.num_key_value_heads is None
            else args.nums_attention_heads
        )

        assert args.nums_attention_heads % self.num_key_value_heads == 0, \
            "num_attention_heads must be divisible by num_key_value_heads"

        self.n_local_heads = args.nums_attention_heads
        self.n_rep = self.n_local_heads//self.n_local_kv_heads
        self.head_dim = args.hidden_size//args.num_attention_head

        # QKV投影
        self.q_proj = nn.Linear(
            args.hidden_size,
            args.num_attention_head*self.head_dim,  # Q的头数*一个头的维度
            bias=False
        )
        self.k_proj = nn.Linear(
            args.hidden_size,
            self.n_local_kv_heads*self.head_dim,
            bias=False
        )
        self.v_proj = nn.Linear(
            args.hidden_size,
            self.n_local_kv_heads*self.head_dim,
            bias=False
        )
        self.o_proj = nn.Linear(  # output
            args.num_attention_head*self.head_dim,
            args.hidden_size,
            bias=False
        )

        self.attn_dropout = nn.Dropout(args.dropout)
        self.resid_dropout = nn.Dropout(args.dropout)
        self.dropout = args.dropout

        self.flash = hasattr(torch.nn.functional, 'scaled_dot_product_attention') and args.flash_attention

    def forward(
        self,
        x: torch.Tensor,
        position_embedding: Tuple[torch.Tensor, torch.Tensor],
        past_key_value: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
        use_cache=False,
        attention_mask: Optional[torch.Tensor] = None,  # 外部传进来的约束信息
    ) -> torch.Tensor:

        # 投影，计算qkv
        bsz, seq_len, _ = x.shape
        xq, xk, xv = self.q_proj(x), self.k_proj(x), self.v_proj(x)
        # 把输入拆分成多个头，用view
        xq = xq.view(bsz, seq_len, self.n_local_heads, self.head_dim)
        xk = xk.view(bsz, seq_len, self.num_key_value_heads, self.head_dim)
        xv = xv.view(bsz, seq_len, self.num_key_value_heads, self.head_dim)
        # q和k，使用RoPE
        cos, sin = position_embedding
        xq, xk = apply_rotary_pos_emb(xq, xk, cos[:seq_len], sin[:seq_len])
        # 对于k和v，使用repeat（注意kv 缓存（cache））
        if past_key_value is not None:
            xk = torch.cat([past_key_value[0], xk], dim=1)
            xv = torch.cat([past_key_value[1], xv], dim=1)
        past_kv = (xk, xv) if use_cache else None

        xq, xk, xv = (
            xq.transpose(1, 2),
            # [bsz,seq_len,n_local_heads,head_dim]->
            # [bsz,n_local_heads,seq_len,head_dim] head是批次，不参与计算
            repeat_kv(xk, self.n_rep).transpose(1, 2),
            repeat_kv(xv, self.n_rep).transpose(1, 2),
        )
        # 进行attention计算，q@k^T/sqrt(d)
        if (
            self.flash
            and seq_len > 1
            and (
                attention_mask is None
                or torch.all(attention_mask == 1)
            )  # 只有在「没有padding干扰」时，才安全地使用FlashAttention
        ):
            # 在满足条件时，用 FlashAttention 加速；否则回退到普通 Attention。
            attn_mask = (
                None  # 完全不使用 mask
                if attention_mask is None
                else attention_mask
                .view(bsz, 1, 1, -1)
                .expand(bsz, self.n_local_heads, seq_len, -1)
                .bool()
            )
            output = F.scaled_dot_product_attention(
                xq,  # [bsz, n_heads, seq_len, head_dim]
                xk,
                xv,
                attn_mask=attn_mask,
                # 训练时->使用 dropout
                # 推理时->关闭 dropout
                dropout_p=self.dropout if self.training else 0.0,
                is_causal=True  # 强制使用因果掩码（下三角）
            )
        else:
            # scores->[bsz,n_heads,seq_len,seq_len]
            # scores[i,h,q,k] = 第h个头中，第q个token对第k个token 的相似度
            scores = (xq@xk.transpose(-2, -1))/math.sqrt(self.head_dim)
            # 当前位置i不能看到未来j>i的token
            scores = scores+torch.triu(
                torch.full(
                    (seq_len, seq_len),
                    float('-inf'),
                    device=scores.device
                ),
                diagonal=1,
            ).unsqueeze(0).unsqueeze(0)
            # [1,1,seq_len,seq_len]->[bsz,n_heads,seq_len,seq_len]
            # 最后拼接头，输出投影，返回
            if attention_mask is not None:
                # attention_mask.shape=[bsz,seq_len]
                # 1 = 有效 token
                # 0 = PAD
                extended_attention_mask = attention_mask.unsqueeze(1).unsqueeze(2)
                # [bsz,seq_len]->[bsz,1,1,seq_len] 这里的seq_len对应的是k_len
                # 对所有query，屏蔽同一批key

                extended_attention_mask = (1.0-extended_attention_mask)*-1e9
                scores = scores+extended_attention_mask  # PAD位置的score→-∞
                # scores: [bsz, n_heads, q_len, k_len]
                # mask:   [bsz, 1,      1,     k_len]
            scores = F.softmax(scores.float(), dim=-1).type_as(xq)
            scores = self.attn_dropout(scores)
            output = scores @ xv
            # scores: [bsz, n_heads, q_len, k_len]
            # xv:     [bsz, n_heads, k_len, head_dim]
            # output: [bsz, n_heads, q_len, head_dim]
        output = output.transpose(1, 2).reshape(bsz, seq_len, -1)
        # 在训练态 self-attention 中：q_len == seq_len
        # [bsz, n_heads, q_len, head_dim]->[bsz, seq_len, n_heads,  head_dim]
        output = self.resid_dropout(self.o_proj(output))
        return output, past_kv


class FeedForward(nn.Module):
    # 初始化
    # 升维
    # 降维
    # 门控
    # dropout
    # 激活函数
    def __inf__(self, args: MiniMindConfig):
        super().__init__()
        if args.intermediate_size is None:
            intermediate_size = int(args.hidden_size*8/3)
            args.intermediate_size = 64+((intermediate_size+64-1)//64)

        self.up_proj = nn.Linear(
            args.hidden_size,
            args.intermediate_size,
            bias=False
        )
        self.down_proj = nn.Linear(
            args.intermediate_size,
            args.hidden_size,
            bias=False
        )
        self.gate_proj = nn.Linear(
            args.hidden_size,
            args.intermediate_size,
            bias=False
        )
        self.dropout = nn.Dropout(args.dropout)
        self.act_fn = ACT2FN[args.hidden_act]

    def forward(self, x):
        gated = self.act_fn(self.gate_proj(x))*self.up_proj(x)
        return self.dropout(self.down_proj(gated))


class MiniMindBlock(nn.Module):
    def __init__(self, layer_id: int, config: MiniMindConfig):
        super().__init__()
        self.num_attention_heads = config.num_attention_heads
        self.hidden_size = config.hidden_size
        self.head_dim = self.hidden_size//self.num_attention_heads
        self.self_attn = Attention(config)

        self.layer_id = layer_id
        self.input_layernorm = RMSNorm(
            config.hidden_size,
            eps=config.rms_norm_eps
        )
        self.post_attention_layernorm = RMSNorm(
            config.hidden_size,
            eps=config.rms_norm_eps
        )
        self.mlp = FeedForward(config)

    def forward(
        self,
        hidden_states,
        # 输入的隐藏状态，通常是经过上一层处理后的特征表示（例如，来自前一层的输出）。
        position_embeddings,
        past_key_value=None,
        use_cache=False,
        attention_mask=None
    ):
        residual = hidden_states
        hidden_states, present_key_value = self.self_attn(  # 自注意力机制GQA
            self.input_layernorm(hidden_states),  # 来自上一层的隐藏状态
            position_embeddings,  # 位置编码
            past_key_value,
            use_cache,
            attention_mask,
        )  # 自注意力计算
        hidden_states = hidden_states+residual  # 残差连接
        hidden_states = hidden_states+self.mlp(  # FFN
            self.post_attention_layernorm(hidden_states)
        )
        return hidden_states, present_key_value


class MinimindModel(nn.Module):
    def __init__(self, config: MiniMindConfig):
        super().__init__()
        self.config = config
        self.vocab_size, self.num_hidden_layer = (
            config.vocab_size,  # 词表大小
            config.num_hidden_layers,  # Transform block层数
        )
        # token id:[batch, seq_len] -> hidden_states:[batch, seq_len, hidden_size]
        self.embed_tokens = nn.Embedding(config.vocab_size, config.hidden_size)

        self.dropout = nn.Dropout(config.dropout)

        self.layers = nn.ModuleList(
            [MiniMindBlock(i, config) for i in range(self.num_hidden_layer)]
        )

        # RoPe预计算
        freqs_cos, freqs_sin = precomput_freqs_cis(
            dim=config.hidden_size//config.num_attention_heads,
            end=config.max_position_embeddings,
            rope_base=config.rope_theta,
            rope_scaling=config.rope_scaling,
        )

        self.register_buffer("freqs_cos", freqs_cos, persistent=False)
        self.register_buffer("freqs_sin", freqs_sin, persistent=False)

    def forward(
        self,
        input_ids: Optional[torch.Tensor] = None,
        attention_mask: Optional[torch.Tensor] = None,
        past_key_value: Optional[Tuple[Tuple[torch.Tensor]]] = None,
        use_cache: bool = False,
        **kwargs,
    ):
        batch_size, seq_len = input_ids.shape

        if hasattr(past_key_values, 'layers'):
            past_key_values = None

        past_key_values = past_key_values or [None]*len(self.layers)

        start_pos = (  # 起始位置
            past_key_values[0][0].shape[1] if past_key_values[0] is not None else 0
        )

        hidden_states = self.dropout(self.embed_tokens(input_ids))

        position_embeddings = (
            self.freqs_cos[start_pos:start_pos+seq_len],
            self.freqs_sin[start_pos:start_pos+seq_len],
        )

        presents = []  # 用来存每一层新的KV cache

        for layer_idx, (layer, past_key_value) in enumerate(
            zip(self.layers, past_key_values)
        ):
            hidden_states, present = layer(
                hidden_states,
                position_embeddings,
                past_key_value=past_key_value,
                use_cache=use_cache,
                attention_mask=attention_mask,
            )

            presents.append(present)

        # 归一化
        hidden_states = self.norm(hidden_states)

        return hidden_states, presents


class MiniMindForCasualLM(PreTrainedModel, GenerationMixin):
    config_class = MiniMindConfig

    def __init__(self, config: MiniMindConfig):
        self.config = config

        super().__init__(config)

        self.model = MinimindModel(config)

        self.lm_head = nn.Linear(
            self.config.hidden_size, self.config.vocab_size, bias=False
        )

        # 权重共享
        # 输出层的权重和嵌入层的权重共享
        self.model.embed_tokens.weight = self.lm_head.weight

    def forward(
        self,
        input_ids: Optional[torch.Tensor] = None,
        attention_mask: Optional[torch.Tensor] = None,
        past_key_values: Optional[Tuple[Tuple[torch.Tensor]]] = None,
        use_cache: bool = False,
        Logits_to_keep: Union[int, torch.Tensor] = 0,
        **args
    ):
        hidden_states, past_key_values = self.model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            past_key_values=past_key_values,
            use_cache=use_cache,
            **args,
        )
        # logits to keep 是整数，那就保留最后n个位置
        # 生成的时候只需要最后的logits来预测下一个token
        slice_indices = (
            slice(-Logits_to_keep, None)
            if isinstance(Logits_to_keep, int)
            else Logits_to_keep
        )
        # 通过lm_head将hidden states投影到词表logits
        logits = self.lm_head(hidden_states[:, slice_indices, :])

        return CausalLMOutputWithPast(
            logits=logits,
            past_key_values=past_key_values,
            hidden_states=hidden_states,
        )
