神经网络由对数据执行操作的层/模块组成。[torch.nn](https://pytorch.org/docs/stable/nn.html)提供了构建自己的神经网络所需的所有构建块。PyTorch 中的每个模块都是[nn.Module](https://pytorch.org/docs/stable/generated/torch.nn.Module.html)的子类。神经网络本身就是一个由其他模块（层）组成的模块。这种嵌套结构允许轻松构建和管理复杂的架构。

构建一个神经网络来对 FashionMNIST 数据集中的图像进行分类。

```Python
import os
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
```

## 获取训练设备
***

在CUDA、MPS、MTIA 或 XPU 等[加速器](https://pytorch.org/docs/stable/torch.html#accelerators)上训练的模型。如果当前加速器可用，将使用它。否则，将使用 CPU。

```Python
device = torch.accelerator.current_accelerator().type if torch.accelerator.is_available() else "cpu"
print(f"Using {device} device")
```

```Out
Using cuda device
```

## 定义类
***

通过子类化来定义神经网络`nn.Module`，并在`__init__`中初始化神经网络层。每个`nn.Module`子类都在方法中实现对输入数据的操作`forward`。

```Python
class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()  # 初始化父类，对于所有自定义神经网络类都是必需的。
        self.flatten = nn.Flatten()  # 将输入的图像展平为一维张量。
        self.linear_relu_stack = nn.Sequential(  
        # 一个包含多个层的神经网络结构，采用 nn.Sequential来按顺序构建。
            nn.Linear(28*28, 512),  # 全连接层，将输入从28*28=784映射到512维。
            nn.ReLU(),  
            # 激活函数，对每个元素应用ReLU（Rectified Linear Unit），使其非负。
            nn.Linear(512, 512),  # 另一个全连接层，将输入从512维映射到512维。
            nn.ReLU(),  # 再次应用ReLU
            nn.Linear(512, 10),  
            # 最终的全连接层，将输入从512维映射到10维。（FashionMNIST 有 10 个类别）
        )

    def forward(self, x):  # forward方法定义了数据在网络中前向传播途径。x是输入数据。
        x = self.flatten(x)  # x被展平，从28*28的二维图像转为一维向量784。
        logits = self.linear_relu_stack(x)  
        # 通过堆叠的线性层和激活函数进行计算，得到 logits。logits是一个未经归一化的预测值，表示每个类别的得分。
        return logits  
        # 返回模型的输出，即每个类别的logits，它们将用于计算损失（例如通过交叉熵损失函数）并进行分类。
```

创建 的一个实例`NeuralNetwork`，并将其移动到`device`，并打印其结构。

```Python
model = NeuralNetwork().to(device)
print(model)
```

```Out
NeuralNetwork(
  (flatten): Flatten(start_dim=1, end_dim=-1)
  (linear_relu_stack): Sequential(
    (0): Linear(in_features=784, out_features=512, bias=True)
    (1): ReLU()
    (2): Linear(in_features=512, out_features=512, bias=True)
    (3): ReLU()
    (4): Linear(in_features=512, out_features=10, bias=True)
  )
)
```

>[!Note] 模型结构
>输入层：将输入图像展平为一维向量。
>隐藏层：两个，每个包含512个神经元，使用ReLU激活函数。
>输出层：最后的全连接层有10个输出节点，对应10个类别。

要使用模型，需要将输入数据传递给它。这将执行模型的`forward`以及一些[后台操作](https://github.com/pytorch/pytorch/blob/270111b7b611d174967ed204776985cefca9c144/torch/nn/modules/module.py#L866)。`model.forward()`不能直接调用！

在输入上调用模型会返回一个二维张量，其中 dim=0 对应于每个类的 10 个原始预测值的每个输出，dim=1 对应于每个输出的单个值。我们通过将其传递给模块的一个实例来获得预测概率`nn.Softmax`。

```Python
X = torch.rand(1, 28, 28, device=device)  
# 模拟一个单张图像（批次大小为 1）。每个元素的值是从均匀分布[0, 1)中随机生成的。
logits = model(X)  # 对于每个输入图像，模型会输出一个10维向量，每个值对应一个类别的得分。
pred_probab = nn.Softmax(dim=1)(logits)  # Softmax函数将logits转换为概率分布，使得每个类别的得分都在[0, 1]范围内，并且所有类别的概率和为 1。
y_pred = pred_probab.argmax(1)  # argmax(1)：返回概率最大的类别的索引，即预测的类别。
print(f"Predicted class: {y_pred}")
```

```Out
Predicted class: tensor([7], device='cuda:0')
```

## 模型层
***

取 3 张大小为 28x28 的图像作为样本小批量，并观察它在通过网络时会发生什么。

```Python
input_image = torch.rand(3,28,28)
print(input_image.size())
```

```Out
torch.Size([3, 28, 28])
```

[torch.nn](https://pytorch.org/docs/stable/nn.html)
### `nn.Flatten`

初始化[nn.Flatten](https://pytorch.org/docs/stable/generated/torch.nn.Flatten.html)层以将每个28x28的2D图像转换为 784 个像素值的连续数组（保持小批量维度（在 dim=0 时））。

```Python
flatten = nn.Flatten()
flat_image = flatten(input_image)
print(flat_image.size())
```

```Out
torch.Size([3, 784]) 
```

### nn.Linear

nn.Linear是一个使用其存储的权重和偏差对输入应用线性变换的模块。

假设：

- 输入是一个 $d_{\text{in}}​$ 维的向量 $x\in \mathbb{R}^{d_{\text{in}}}$。
- 线性层的权重矩阵 $W$ 大小为 $d_{\text{out}} \times d_{\text{in}}$ 。
- 线性层的偏置 $b$ 大小为 $d_{\text{out}}$ 维的向量。

那么，线性变换的计算过程如下：

$$y = Wx + b$$

其中：

- $W$ 控制输入到输出的映射关系，决定了输入如何转换成不同维度。
- $b$ 是一个偏置项，用于调整输出。

- **`weight`（权重，`torch.Tensor`）**  
    该层的**可学习权重**，形状为 `(out_features, in_features)`。  
    权重的初始值从**均匀分布**
    $$\mathcal{U}(-\sqrt{k}, \sqrt{k})$$
    
    进行采样，其中：
    $$k = \frac{1}{\text{in\_features}}$$
    
- **`bias`（偏置，`torch.Tensor`）**  
    该层的**可学习偏置**，形状为 `(out_features)`。
    
    - 如果 `bias=True`，则偏置的初始值同样从均匀分布
        $$\mathcal{U}(-\sqrt{k}, \sqrt{k})$$
        
        进行采样，其中：
        $$k = \frac{1}{\text{in\_features}}$$

```Python
layer1 = nn.Linear(in_features=28*28, out_features=20)
hidden1 = layer1(flat_image)
print(hidden1.size())
```

```Out
torch.Size([3, 20])
```

### nn.ReLU

实现了 **ReLU（Rectified Linear Unit，修正线性单元）** 激活函数，定义如下：

$$ReLU(x) = \max(0, x)$$

非线性激活函数在模型的输入和输出之间创建了复杂的映射。它们在线性变换之后应用以引入*非线性*，帮助神经网络学习各种各样的现象。

```Python
print(f"Before ReLU: {hidden1}\n\n")
hidden1 = nn.ReLU()(hidden1)
print(f"After ReLU: {hidden1}")
```

```Out
Before ReLU: tensor([[ 0.4158, -0.0130, -0.1144,  0.3960,  0.1476, -0.0690, -0.0269,  0.2690,
          0.1353,  0.1975,  0.4484,  0.0753,  0.4455,  0.5321, -0.1692,  0.4504,
          0.2476, -0.1787, -0.2754,  0.2462],
        [ 0.2326,  0.0623, -0.2984,  0.2878,  0.2767, -0.5434, -0.5051,  0.4339,
          0.0302,  0.1634,  0.5649, -0.0055,  0.2025,  0.4473, -0.2333,  0.6611,
          0.1883, -0.1250,  0.0820,  0.2778],
        [ 0.3325,  0.2654,  0.1091,  0.0651,  0.3425, -0.3880, -0.0152,  0.2298,
          0.3872,  0.0342,  0.8503,  0.0937,  0.1796,  0.5007, -0.1897,  0.4030,
          0.1189, -0.3237,  0.2048,  0.4343]], grad_fn=<AddmmBackward0>)


After ReLU: tensor([[0.4158, 0.0000, 0.0000, 0.3960, 0.1476, 0.0000, 0.0000, 0.2690, 0.1353,
         0.1975, 0.4484, 0.0753, 0.4455, 0.5321, 0.0000, 0.4504, 0.2476, 0.0000,
         0.0000, 0.2462],
        [0.2326, 0.0623, 0.0000, 0.2878, 0.2767, 0.0000, 0.0000, 0.4339, 0.0302,
         0.1634, 0.5649, 0.0000, 0.2025, 0.4473, 0.0000, 0.6611, 0.1883, 0.0000,
         0.0820, 0.2778],
        [0.3325, 0.2654, 0.1091, 0.0651, 0.3425, 0.0000, 0.0000, 0.2298, 0.3872,
         0.0342, 0.8503, 0.0937, 0.1796, 0.5007, 0.0000, 0.4030, 0.1189, 0.0000,
         0.2048, 0.4343]], grad_fn=<ReluBackward0>)
```

### nn.Sequential

[nn.Sequential](https://pytorch.org/docs/stable/generated/torch.nn.Sequential.html)是模块的有序容器。数据按照定义的顺序传递到所有模块。可以使用顺序容器来快速组合网络，例如`seq_modules`。

```Python
seq_modules = nn.Sequential(
    flatten,       # 展平输入
    layer1,        # 全连接层 (784 -> 20)
    nn.ReLU(),     # ReLU 激活
    nn.Linear(20, 10)  # 输出层 (20 -> 10)
)
input_image = torch.rand(3,28,28)
logits = seq_modules(input_image)
```

最终输出是一个 `(3,10)` 的张量（3 个样本，每个样本有 10 个类别的 **logits**）。

### nn.Softmax

神经网络的最后一层线性层返回logits([-infty, infty] 中的原始值)将其传递给 [nn.Softmax](https://pytorch.org/docs/stable/generated/torch.nn.Softmax.html)模块。logits 被缩放到 [0, 1] 的值，表示模型对每个类的预测概率。`dim`参数表示值必须总和为 1 的维度。

```Python
softmax = nn.Softmax(dim=1)
pred_probab = softmax(logits)
```

Softmax 计算方式如下：
$$P(y_i) = \frac{e^{x_i}}{\sum_{j} e^{x_j}}$$
其中：

- $x_i$是第$i$个类别的 `logits`
- 分子 $e^(x_i)$ 代表该类别的指数值
- 分母是所有 `logits` 指数值的总和
  
## 模型参数
***

神经网络中的许多层都是*参数化的*，即具有在训练期间优化的相关权重和偏差。子类化`nn.Module`会自动跟踪模型对象中定义的所有字段，并使所有参数都可使用模型`parameters()`或`named_parameters()`方法访问。

迭代每个参数，并打印它的大小和它的值的预览。

```Python
print(f"Model structure: {model}\n\n")

for name, param in model.named_parameters():
    print(f"Layer: {name} | Size: {param.size()} | Values : {param[:2]} \n")
```

```Out
Model structure: NeuralNetwork(
  (flatten): Flatten(start_dim=1, end_dim=-1)
  (linear_relu_stack): Sequential(
    (0): Linear(in_features=784, out_features=512, bias=True)
    (1): ReLU()
    (2): Linear(in_features=512, out_features=512, bias=True)
    (3): ReLU()
    (4): Linear(in_features=512, out_features=10, bias=True)
  )
)


Layer: linear_relu_stack.0.weight | Size: torch.Size([512, 784]) | Values : tensor([[ 0.0273,  0.0296, -0.0084,  ..., -0.0142,  0.0093,  0.0135],
        [-0.0188, -0.0354,  0.0187,  ..., -0.0106, -0.0001,  0.0115]],
       device='cuda:0', grad_fn=<SliceBackward0>)

Layer: linear_relu_stack.0.bias | Size: torch.Size([512]) | Values : tensor([-0.0155, -0.0327], device='cuda:0', grad_fn=<SliceBackward0>)

Layer: linear_relu_stack.2.weight | Size: torch.Size([512, 512]) | Values : tensor([[ 0.0116,  0.0293, -0.0280,  ...,  0.0334, -0.0078,  0.0298],
        [ 0.0095,  0.0038,  0.0009,  ..., -0.0365, -0.0011, -0.0221]],
       device='cuda:0', grad_fn=<SliceBackward0>)

Layer: linear_relu_stack.2.bias | Size: torch.Size([512]) | Values : tensor([ 0.0148, -0.0256], device='cuda:0', grad_fn=<SliceBackward0>)

Layer: linear_relu_stack.4.weight | Size: torch.Size([10, 512]) | Values : tensor([[-0.0147, -0.0229,  0.0180,  ..., -0.0013,  0.0177,  0.0070],
        [-0.0202, -0.0417, -0.0279,  ..., -0.0441,  0.0185, -0.0268]],
       device='cuda:0', grad_fn=<SliceBackward0>)

Layer: linear_relu_stack.4.bias | Size: torch.Size([10]) | Values : tensor([ 0.0070, -0.0411], device='cuda:0', grad_fn=<SliceBackward0>)
```