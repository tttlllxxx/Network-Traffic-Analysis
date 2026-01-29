处理数据样本的代码可能会变得混乱且难以维护；理想情况下，我们希望将数据集代码与模型训练代码分离，以提高可读性和模块化。

`PyTorch` 提供了两个数据原语：`torch.utils.data.DataLoader`和`torch.utils.data.Dataset` ，允许使用预加载的数据集以及自己的数据。 `Dataset`存储样本及其相应的标签，`DataLoader`使用可迭代对象包装样本`Dataset`，以便轻松访问样本。

## 加载数据集
***

从 `TorchVision` 加载[Fashion-MNIST](https://github.com/zalandoresearch/) 数据集的示例。

[Fashion-MNIST](https://github.com/zalandoresearch/) 是 Zalando 文章图像的数据集，包含 60,000 个训练示例和 10,000 个测试示例。每个示例包含一个 28×28 灰度图像和一个来自 10 个类别之一的相关标签。

使用以下参数加载[FashionMNIST数据集：](https://pytorch.org/vision/stable/datasets.html#fashion-mnist)

- `root`是存储训练/测试数据的路径，
    
- `train`指定训练或测试数据集，
    
- `download=True`如果没有数据，则从互联网上下载数据`root`。
    
- `transform`和`target_transform`指定特征和标签转换
  
```Python
import torch
from torch.utils.data import Dataset
from torchvision import datasets
from torchvision.transforms import ToTensor
import matplotlib.pyplot as plt


training_data = datasets.FashionMNIST(
    root="data",
    train=True,
    download=True,
    transform=ToTensor()
)

test_data = datasets.FashionMNIST(
    root="data",
    train=False,
    download=True,
    transform=ToTensor()
)
```

```Out
  0%|          | 0.00/26.4M [00:00<?, ?B/s]
  0%|          | 65.5k/26.4M [00:00<01:12, 362kB/s]
  1%|          | 229k/26.4M [00:00<00:35, 728kB/s]
  2%|1         | 492k/26.4M [00:00<00:19, 1.31MB/s]
  7%|7         | 1.93M/26.4M [00:00<00:05, 4.31MB/s]
 26%|##6       | 6.95M/26.4M [00:00<00:01, 14.1MB/s]
 38%|###8      | 10.1M/26.4M [00:00<00:00, 17.8MB/s]
 61%|######    | 16.1M/26.4M [00:01<00:00, 24.6MB/s]
 73%|#######2  | 19.2M/26.4M [00:01<00:00, 25.5MB/s]
 95%|#########4| 25.1M/26.4M [00:01<00:00, 29.3MB/s]
100%|##########| 26.4M/26.4M [00:01<00:00, 19.3MB/s]

  0%|          | 0.00/29.5k [00:00<?, ?B/s]
100%|##########| 29.5k/29.5k [00:00<00:00, 329kB/s]

  0%|          | 0.00/4.42M [00:00<?, ?B/s]
  1%|1         | 65.5k/4.42M [00:00<00:12, 361kB/s]
  5%|5         | 229k/4.42M [00:00<00:06, 679kB/s]
 21%|##        | 918k/4.42M [00:00<00:01, 2.60MB/s]
 44%|####3     | 1.93M/4.42M [00:00<00:00, 4.07MB/s]
100%|##########| 4.42M/4.42M [00:00<00:00, 6.05MB/s]

  0%|          | 0.00/5.15k [00:00<?, ?B/s]
100%|##########| 5.15k/5.15k [00:00<00:00, 39.8MB/s]
```

## 迭代并可视化数据集
***

`Datasets`可以像列表一样手动索引：`training_data[index]`。用`matplotlib`来可视化训练数据中的某些样本。

```Python
#从 `training_data` 中随机选取 9 张图片，并在 3x3 的网格中可视化它们。
labels_map = {  #类别映射 将类别编号（0-9）映射到实际的服装类别名称。
    0: "T-Shirt",
    1: "Trouser",
    2: "Pullover",
    3: "Dress",
    4: "Coat",
    5: "Sandal",
    6: "Shirt",
    7: "Sneaker",
    8: "Bag",
    9: "Ankle Boot",
}
figure = plt.figure(figsize=(8, 8))  #创建一个Matplotlib图像对象，并设置图像大小为 8×8 英寸。
cols, rows = 3, 3  #定义子图的布局：3 列 × 3 行，即 9 张图片。
for i in range(1, cols * rows + 1):  #随机采样 9 张图片。
    sample_idx = torch.randint(len(training_data), size=(1,)).item()  #随机选择一个样本索引。
    img, label = training_data[sample_idx]  #取出随机选中的图片（img）和标签（label）。
    figure.add_subplot(rows, cols, i)  #在figure中添加子图，按 `i` 的顺序填充3×3网格。
    plt.title(labels_map[label])  #设置子图标题，为服装类别的名称。
    plt.axis("off")  #去掉坐标轴。
    plt.imshow(img.squeeze(), cmap="gray")  #去掉通道维度，用灰度模式显示图像。
plt.show()
```

![](https://pytorch.org/tutorials/_images/sphx_glr_data_tutorial_001.png)

## 为文件创建自定义数据集
***

自定义 Dataset 类必须实现三个函数：`__init__`、`__len__`和`__getitem__`。
`FashionMNIST` 图像存储在目录中`img_dir`，其标签分别存储在 CSV 文件中`annotations_file`。

```Python
import os
import pandas as pd
from torchvision.io import read_image

class CustomImageDataset(Dataset):
    def __init__(self, annotations_file, img_dir, transform=None, target_transform=None):
        self.img_labels = pd.read_csv(annotations_file)
        self.img_dir = img_dir
        self.transform = transform
        self.target_transform = target_transform

    def __len__(self):
        return len(self.img_labels)

    def __getitem__(self, idx):
        img_path = os.path.join(self.img_dir, self.img_labels.iloc[idx, 0])
        image = read_image(img_path)
        label = self.img_labels.iloc[idx, 1]
        if self.transform:
            image = self.transform(image)
        if self.target_transform:
            label = self.target_transform(label)
        return image, label
```

### `__init__`

实例化 Dataset 对象时，会运行一次`__init__`函数。初始化包含图像、注释文件和两个转换的目录。

labels.csv 文件如下所示：

```csv
tshirt1.jpg, 0
tshirt2.jpg, 0
......
ankleboot999.jpg, 9
```

```Python
def __init__(self, annotations_file, img_dir, transform=None, target_transform=None):
    self.img_labels = pd.read_csv(annotations_file)
    self.img_dir = img_dir
    self.transform = transform
    self.target_transform = target_transform
```

### `__len__`

`__len__` 函数返回数据集中的样本数量。

```Python
def __len__(self):
    return len(self.img_labels)
```

### `__getitem__`

`__getitem__`函数加载并返回给定索引处数据集中的样本`idx`。根据索引，它识别图像在磁盘上的位置，使用将其转换为张量`read_image`，从 csv 数据中检索相应的标签`self.img_labels`，对其调用转换函数（如果适用），并在元组中返回张量图像和相应的标签。

```Python
def __getitem__(self, idx):
    img_path = os.path.join(self.img_dir, self.img_labels.iloc[idx, 0])
    image = read_image(img_path)
    label = self.img_labels.iloc[idx, 1]
    if self.transform:
        image = self.transform(image)
    if self.target_transform:
        label = self.target_transform(label)
    return image, label
```


## 使用 `DataLoaders` 准备训练数据

检索`Dataset`数据集的特征并一次标记一个样本。在训练模型时，通常希望以“小批量”传递样本，在每个时期重新调整数据以减少模型过度拟合，并使用 Python`multiprocessing`来加速数据检索。

`DataLoader`是一个可迭代对象，它通过一个简单的 API 为抽象了这种复杂性。

```Python
from torch.utils.data import DataLoader

train_dataloader = DataLoader(training_data, batch_size=64, shuffle=True)
test_dataloader = DataLoader(test_data, batch_size=64, shuffle=True)
```

## 遍历 `DataLoader`

已将该数据集加载到中`DataLoader`，并且可以根据需要迭代数据集。下面的每次迭代都会返回一批`train_features`和`train_labels`（分别包含`batch_size=64`特征和标签）。因为指定了`shuffle=True`，所以在迭代所有批次后，数据会被打乱。

```Python
# Display image and label.
train_features, train_labels = next(iter(train_dataloader))
print(f"Feature batch shape: {train_features.size()}")
print(f"Labels batch shape: {train_labels.size()}")
img = train_features[0].squeeze()  #train_features[0]：取出批次中的第一张图像。.squeeze()：去掉维度为1的通道维，变成(28, 28)，方便plt.imshow()显示。
label = train_labels[0]  #取出第一张图像对应的标签。
plt.imshow(img, cmap="gray")
plt.show()
print(f"Label: {label}")
```

![](https://pytorch.org/tutorials/_images/sphx_glr_data_tutorial_002.png)

```Out
Feature batch shape: torch.Size([64, 1, 28, 28])  #这个批次有64张(28 × 28)的灰度图像，1表示单通道（灰度）。
Labels batch shape: torch.Size([64])
Label: 5
```
