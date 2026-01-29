```Python
import torch
import torchvision.models as models
```

## 保存和加载模型权重

PyTorch 模型将学习到的参数存储在名为 的内部状态字典中`state_dict`（其中包含了所有模型参数（权重和偏置））。这些可以通过以下`torch.save` 方法持久化：

```Python
model = models.vgg16(weights='IMAGENET1K_V1')
torch.save(model.state_dict(), 'model_weights.pth')
```

```Out
Downloading: "https://download.pytorch.org/models/vgg16-397923af.pth" to /var/lib/ci-user/.cache/torch/hub/checkpoints/vgg16-397923af.pth

  0%|          | 0.00/528M [00:00<?, ?B/s]
  4%|3         | 20.1M/528M [00:00<00:02, 210MB/s]
  8%|7         | 40.8M/528M [00:00<00:02, 213MB/s]
 12%|#1        | 61.2M/528M [00:00<00:02, 214MB/s]
 16%|#5        | 81.9M/528M [00:00<00:02, 214MB/s]
 19%|#9        | 102M/528M [00:00<00:02, 214MB/s]
 23%|##3       | 123M/528M [00:00<00:01, 214MB/s]
 27%|##7       | 143M/528M [00:00<00:01, 214MB/s]
 31%|###1      | 164M/528M [00:00<00:01, 215MB/s]
 35%|###4      | 184M/528M [00:00<00:01, 215MB/s]
 39%|###8      | 205M/528M [00:01<00:01, 215MB/s]
 43%|####2     | 226M/528M [00:01<00:01, 216MB/s]
 47%|####6     | 247M/528M [00:01<00:01, 218MB/s]
 51%|#####     | 269M/528M [00:01<00:01, 220MB/s]
 55%|#####4    | 290M/528M [00:01<00:01, 221MB/s]
 59%|#####8    | 311M/528M [00:01<00:01, 221MB/s]
 63%|######2   | 332M/528M [00:01<00:00, 222MB/s]
 67%|######7   | 354M/528M [00:01<00:00, 222MB/s]
 71%|#######1  | 375M/528M [00:01<00:00, 222MB/s]
 75%|#######5  | 397M/528M [00:01<00:00, 223MB/s]
 79%|#######9  | 418M/528M [00:02<00:00, 223MB/s]
 83%|########3 | 439M/528M [00:02<00:00, 223MB/s]
 87%|########7 | 461M/528M [00:02<00:00, 223MB/s]
 91%|#########1| 482M/528M [00:02<00:00, 223MB/s]
 95%|#########5| 504M/528M [00:02<00:00, 223MB/s]
 99%|#########9| 525M/528M [00:02<00:00, 223MB/s]
100%|##########| 528M/528M [00:02<00:00, 219MB/s]
```

要加载模型权重，需要先创建相同模型的实例，然后使用`load_state_dict()`方法加载参数。

在下面的代码中，设置`weights_only=True`将解压期间执行的函数限制为仅加载权重所需的函数。`weights_only=True`加载权重时使用 被认为是最佳实践。

```Python
model = models.vgg16() # we do not specify ``weights``, i.e. create untrained model
model.load_state_dict(torch.load('model_weights.pth', weights_only=True))
model.eval()
```

```Out
VGG(
  (features): Sequential(
    (0): Conv2d(3, 64, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (1): ReLU(inplace=True)
    (2): Conv2d(64, 64, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (3): ReLU(inplace=True)
    (4): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
    (5): Conv2d(64, 128, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (6): ReLU(inplace=True)
    (7): Conv2d(128, 128, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (8): ReLU(inplace=True)
    (9): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
    (10): Conv2d(128, 256, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (11): ReLU(inplace=True)
    (12): Conv2d(256, 256, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (13): ReLU(inplace=True)
    (14): Conv2d(256, 256, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (15): ReLU(inplace=True)
    (16): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
    (17): Conv2d(256, 512, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (18): ReLU(inplace=True)
    (19): Conv2d(512, 512, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (20): ReLU(inplace=True)
    (21): Conv2d(512, 512, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (22): ReLU(inplace=True)
    (23): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
    (24): Conv2d(512, 512, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (25): ReLU(inplace=True)
    (26): Conv2d(512, 512, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (27): ReLU(inplace=True)
    (28): Conv2d(512, 512, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
    (29): ReLU(inplace=True)
    (30): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
  )
  (avgpool): AdaptiveAvgPool2d(output_size=(7, 7))
  (classifier): Sequential(
    (0): Linear(in_features=25088, out_features=4096, bias=True)
    (1): ReLU(inplace=True)
    (2): Dropout(p=0.5, inplace=False)
    (3): Linear(in_features=4096, out_features=4096, bias=True)
    (4): ReLU(inplace=True)
    (5): Dropout(p=0.5, inplace=False)
    (6): Linear(in_features=4096, out_features=1000, bias=True)
  )
)
```

## 保存和加载带有形状的模型

加载模型权重时，需要先实例化模型类，因为该类定义了网络的结构。希望将此类的结构与模型一起保存，将`model`（而不是`model.state_dict()`）传递给保存函数：

```Python
torch.save(model, 'model.pth')
```