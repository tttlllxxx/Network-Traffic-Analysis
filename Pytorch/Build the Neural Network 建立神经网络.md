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
        super().__init__()  #初始化父类，对于所有自定义神经网络类都是必需的。
        self.flatten = nn.Flatten()  #将输入的图像展平为一维张量。
        self.linear_relu_stack = nn.Sequential(  #一个包含多个层的神经网络结构，采用 nn.Sequential来按顺序构建。
            nn.Linear(28*28, 512),  #全连接层，将输入从28*28=784映射到512维。
            nn.ReLU(),  #激活函数，对每个元素应用ReLU（Rectified Linear Unit），使其非负。
            nn.Linear(512, 512),  #另一个全连接层，将输入从512维映射到512维。
            nn.ReLU(),  #再次应用ReLU
            nn.Linear(512, 10),  #最终的全连接层，将输入从512维映射到10维。（FashionMNIST 有 10 个类别）
        )

    def forward(self, x):  #forward方法定义了数据在网络中前向传播途径。x是输入数据。
        x = self.flatten(x)  #x被展平，从28*28的二维图像转为一维向量784。
        logits = self.linear_relu_stack(x)  #通过堆叠的线性层和激活函数进行计算，得到 logits。logits是一个未经归一化的预测值，表示每个类别的得分。
        return logits  #返回模型的输出，即每个类别的logits，它们将用于计算损失（例如通过交叉熵损失函数）并进行分类。
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

要使用模型，需要将输入数据传递给它。这将执行模型的`forward`以及一些[后台操作](https://github.com/pytorch/pytorch/blob/270111b7b611d174967ed204776985cefca9c144/torch/nn/modules/module.py#L866)。`model.forward()`不不能直接调用！

在输入上调用模型会返回一个二维张量，其中 dim=0 对应于每个类的 10 个原始预测值的每个输出，dim=1 对应于每个输出的单个值。我们通过将其传递给模块的一个实例来获得预测概率`nn.Softmax`。

```Python
X = torch.rand(1, 28, 28, device=device)  #模拟一个单张图像（批次大小为 1）。每个元素的值是从均匀分布[0, 1)中随机生成的。
logits = model(X)  #对于每个输入图像，模型会输出一个10维向量，每个值对应一个类别的得分。
pred_probab = nn.Softmax(dim=1)(logits)  #Softmax函数将logits转换为概率分布，使得每个类别的得分都在[0, 1]范围内，并且所有类别的概率和为 1。
y_pred = pred_probab.argmax(1)  #argmax(1)：返回概率最大的类别的索引，即预测的类别。
print(f"Predicted class: {y_pred}")
```

```Out
Predicted class: tensor([7], device='cuda:0')
```

## 模型层
***

