# 项目目录结构（评价驱动 GNN 闭环系统）

```
apt_gnn_system/
├── data/
│   ├── raw_logs/               # 原始日志（CSV、PCAP等）
│   ├── structured/             # 结构化日志（带标签、时间窗分片）
│   └── graphs/                 # 构建的图数据（.pt）
│
├── models/
│   ├── gcn_model.py            # 基础GNN模型（GCN/GAT）
│   └── wrapper.py              # 训练/推理封装
│
├── utils/
│   ├── parser.py               # 日志解析为结构化事件
│   ├── graph_builder.py        # 构建PyG图结构
│   ├── metrics.py              # 多维度评价指标
│   ├── feedback.py             # 闭环反馈调整机制
│   └── explain.py              # 可解释性模块（GNN权重、路径）
│
├── runner/
│   ├── train.py                # 训练主程序
│   ├── evaluate.py             # 指标评估 + 图结构对比
│   └── pipeline.py             # 全流程自动化运行主控
│
├── config.yaml                 # 配置文件
├── main.py                     # 命令行入口（调用pipeline）
└── README.md

```
---

# 系统流程图（评价驱动 GNN 闭环系统）

```
[原始日志 CSV/PCAP]
        │
        ▼
[parser.py] → [结构化事件序列]
        │
        ▼
[graph_builder.py] → [行为图Data对象]
        │
        ▼
[models/gcn_model.py] → GNN推理APT攻击
        │
        ▼
[metrics.py] → 分类性能 + 图一致性 + 阶段识别评价
        │
        ▼
[feedback.py]   ←───┐
        │           │
        ▼           │
  结构优化 / 特征增强 ┘
        │
        ▼
  下一轮训练 / 图构建迭代

```

---

# 评价维度设计（utils/metrics.py）

|维度|指标|数据来源|
|---|---|---|
|分类性能|Precision, Recall, F1|节点真实标签 vs 预测标签|
|攻击阶段识别能力|阶段F1、混淆矩阵|标签中阶段字段|
|图结构一致性|Jaccard/Path overlap|构建图 vs Groundtruth子图|
|节点影响解释性|Attention 权重排名|GAT/注意力机制输出|
|决策置信度|Softmax最大概率 / 投票一致率|GNN输出 logits|

---

# 闭环反馈策略设计（utils/feedback.py）

```python
def adjust_graph_structure(metrics, graph: Data) -> Data:
    """
    根据多维指标反馈调整图结构：
    - 若结构一致性低：增加真实路径边，弱化误边
    - 若阶段F1低：节点加入阶段嵌入向量（one-hot）
    - 若可解释性弱：采样高注意力节点作为额外连接中心
    """
    return modified_graph
```

---

# 示例模型（models/gcn_model.py）
```python
class APTGCN(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim):
        super().__init__()
        self.conv1 = GCNConv(in_dim, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, out_dim)

    def forward(self, data):
        x, edge_index = data.x, data.edge_index
        x = F.relu(self.conv1(x, edge_index))
        x = self.conv2(x, edge_index)
        return F.log_softmax(x, dim=1)

```
---

# 自动化运行主控（runner/pipeline.py）

```python
def run_pipeline(config):
    # Step 1: 日志解析与图构建
    logs = parse_logs(config["log_path"])
    graph = build_graph_from_logs(logs, config["window_size"])

    # Step 2: 模型训练与推理
    model = load_model(config["model"])
    pred = train_and_predict(model, graph)

    # Step 3: 指标计算与反馈
    metrics = evaluate_prediction(graph.y, pred)
    updated_graph = adjust_graph_structure(metrics, graph)

    # Step 4: 可解释性输出
    explain_node_importance(model, graph)

```
---

# 配置文件示例（config.yaml）

```yaml
log_path: "data/raw_logs/sample.csv"
window_size: 10
model:
  type: GCN
  hidden_dim: 64
  out_dim: 4
train:
  epochs: 100
  lr: 0.001
evaluation:
  metrics: ["f1", "graph_sim", "explain"]
feedback:
  enabled: true
  f1_threshold: 0.85
  sim_threshold: 0.75
```

---

## 示例输出

- 识别结果（APT攻击节点/阶段）
    
- 多维度指标（F1=0.88, PathSim=0.72）
    
- 可视化图结构（高权重节点红色突出）
    

## 模块说明

- `models/`: GCN、GAT模型结构
    
- `utils/`: 数据处理 + 指标计算 + 反馈优化
    
- `runner/`: 训练-评价-反馈完整流程