数据并不总是以训练机器学习算法所需的最终处理形式出现。使用`transform`来对数据进行一些操作，使其适合训练。

所有`TorchVision`数据集都有两个参数 `transform` 修改特征和 `target_transform`修改标签。它们接受包含转换逻辑的可调用函数。torchvision.transforms[模块](https://pytorch.org/vision/stable/transforms.html)提供了几种常用的`transforms`。

FashionMNIST 特征采用 PIL 图像格式，标签为整数。在训练时，我们需要将**特征转换为归一化的张量（tensor）**，并将**标签转换为独热编码（one-hot encoded）张量**。为了进行这些转换，使用`ToTensor`和`Lambda`。

```Python
import torch
from torchvision import datasets
from torchvision.transforms import ToTensor, Lambda

ds = datasets.FashionMNIST(
    root="data",
    train=True,
    download=True,
    transform=ToTensor(),  #将图片转换为张量
    target_transform=Lambda(lambda y: torch.zeros(10, dtype=torch.float).scatter_(0, torch.tensor(y), value=1))
)  #将整数标签转换为one-hot编码。
#torch.zeros(10, dtype=torch.float)：创建一个全 0 的张量（长度 10）
#.scatter_(0, torch.tensor(y), value=1)：在第0维（即1D张量）中，将y位置的值设为1。
```

```Out
  0%|          | 0.00/26.4M [00:00<?, ?B/s]
  0%|          | 65.5k/26.4M [00:00<01:12, 363kB/s]
  1%|          | 229k/26.4M [00:00<00:38, 682kB/s]
  3%|3         | 918k/26.4M [00:00<00:10, 2.54MB/s]
  7%|7         | 1.93M/26.4M [00:00<00:05, 4.12MB/s]
 25%|##4       | 6.59M/26.4M [00:00<00:01, 15.0MB/s]
 38%|###7      | 9.96M/26.4M [00:00<00:00, 17.3MB/s]
 60%|#####9    | 15.8M/26.4M [00:01<00:00, 26.6MB/s]
 73%|#######2  | 19.2M/26.4M [00:01<00:00, 28.2MB/s]
 85%|########5 | 22.5M/26.4M [00:01<00:00, 26.3MB/s]
100%|##########| 26.4M/26.4M [00:01<00:00, 19.4MB/s]

  0%|          | 0.00/29.5k [00:00<?, ?B/s]
100%|##########| 29.5k/29.5k [00:00<00:00, 327kB/s]

  0%|          | 0.00/4.42M [00:00<?, ?B/s]
  1%|1         | 65.5k/4.42M [00:00<00:11, 363kB/s]
  5%|5         | 229k/4.42M [00:00<00:06, 683kB/s]
 21%|##1       | 950k/4.42M [00:00<00:01, 2.19MB/s]
 87%|########6 | 3.83M/4.42M [00:00<00:00, 7.62MB/s]
100%|##########| 4.42M/4.42M [00:00<00:00, 6.10MB/s]

  0%|          | 0.00/5.15k [00:00<?, ?B/s]
100%|##########| 5.15k/5.15k [00:00<00:00, 51.4MB/s]
```

## 转换张量
***

`ToTensor` 主要用于将 PIL 图像或 NumPy 数组转换为 PyTorch 张量，并归一化像素值到 [0,1] 之间。

## Lambda变换
***

Lambda 变换可应用任何用户定义的 lambda 函数。定义一个函数将整数转换为One-hot 编码张量。它首先创建一个大小为 10（我们数据集中的标签数量）的零张量，然后调用 [scatter_](https://pytorch.org/docs/stable/generated/torch.Tensor.scatter_.html)，该函数将 `value=1`赋值给标签给出的索引`y`。

```Python
target_transform = Lambda(lambda y: torch.zeros(
    10, dtype=torch.float).scatter_(dim=0, index=torch.tensor(y), value=1))
```

>[!note] One-hot 编码
>One-hot 编码能避免类别之间的大小关系影响模型。
