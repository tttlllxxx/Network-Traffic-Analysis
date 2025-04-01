训练模型是一个迭代过程；在每次迭代中，模型都会对输出进行猜测，计算猜测中的误差（损失），收集误差相对于其参数的导数([[Automatic Differentiation(自动微分) with torch.autograd|自动微分]])，并使用梯度下降优化这些参数。

![](https://www.youtube.com/watch?v=tIeHLnjs5U8)

## 先决条件代码
***

```Python
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets
from torchvision.transforms import ToTensor

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

train_dataloader = DataLoader(training_data, batch_size=64)
test_dataloader = DataLoader(test_data, batch_size=64)

class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.linear_relu_stack = nn.Sequential(
            nn.Linear(28*28, 512),
            nn.ReLU(),
            nn.Linear(512, 512),
            nn.ReLU(),
            nn.Linear(512, 10),
        )

    def forward(self, x):
        x = self.flatten(x)
        logits = self.linear_relu_stack(x)
        return logits

model = NeuralNetwork()
```

```Out
  0%|          | 0.00/26.4M [00:00<?, ?B/s]
  0%|          | 65.5k/26.4M [00:00<01:12, 364kB/s]
  1%|          | 229k/26.4M [00:00<00:38, 680kB/s]
  4%|3         | 950k/26.4M [00:00<00:11, 2.18MB/s]
 15%|#4        | 3.83M/26.4M [00:00<00:02, 7.58MB/s]
 38%|###8      | 10.1M/26.4M [00:00<00:00, 17.2MB/s]
 61%|######1   | 16.2M/26.4M [00:01<00:00, 22.8MB/s]
 84%|########3 | 22.1M/26.4M [00:01<00:00, 25.9MB/s]
100%|##########| 26.4M/26.4M [00:01<00:00, 19.3MB/s]

  0%|          | 0.00/29.5k [00:00<?, ?B/s]
100%|##########| 29.5k/29.5k [00:00<00:00, 325kB/s]

  0%|          | 0.00/4.42M [00:00<?, ?B/s]
  1%|1         | 65.5k/4.42M [00:00<00:12, 357kB/s]
  5%|5         | 229k/4.42M [00:00<00:06, 672kB/s]
 21%|##        | 918k/4.42M [00:00<00:01, 2.49MB/s]
 43%|####2     | 1.90M/4.42M [00:00<00:00, 3.98MB/s]
100%|##########| 4.42M/4.42M [00:00<00:00, 6.00MB/s]

  0%|          | 0.00/5.15k [00:00<?, ?B/s]
100%|##########| 5.15k/5.15k [00:00<00:00, 41.6MB/s]
```

## 超参数
***

超参数是可调整的参数，控制模型优化过程。不同的超参数值会影响模型训练和收敛速度。

- **迭代次数(epochs)**- 对数据集进行迭代的次数
- **批次大小(batch_size)**- 参数更新前通过网络传播的数据样本数量
- **学习率(learning_rate)**- 每次批次/时期更新模型参数的程度。较小的值会导致学习速度变慢，而较大的值可能会导致训练期间出现不可预测的行为。
  
```Python
learning_rate = 1e-3
batch_size = 64
epochs = 5
```

## 优化循环
***

设置了超参数，就可以使用优化循环来训练和优化模型。优化循环的每次迭代称为一个**epoch**。

每个时期由两个主要部分组成：

- **训练循环**- 迭代训练数据集并尝试收敛到最佳参数。
- **验证/测试循环**- 迭代测试数据集以检查模型性能是否有所改善。
  
### 损失函数

当提供一些训练数据时，未训练的网络可能无法给出正确的答案。损失函数衡量的是得到的结果与目标值之间的不相似程度，损失函数在训练过程中希望最小化。为了计算损失，使用给定数据样本的输入进行预测，并将其与真实的标签值进行比较。

常见的损失函数包括用于回归任务的[nn.MSELoss](https://pytorch.org/docs/stable/generated/torch.nn.MSELoss.html#torch.nn.MSELoss)（均方误差）和用于分类的[nn.NLLLoss](https://pytorch.org/docs/stable/generated/torch.nn.NLLLoss.html#torch.nn.NLLLoss)（负对数似然）。[nn.CrossEntropyLoss](https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html#torch.nn.CrossEntropyLoss)结合了`nn.LogSoftmax`和`nn.NLLLoss`。

将模型的输出的`logits`传递给`nn.CrossEntropyLoss`，它将规范化`logits`并计算预测误差。

```Python
# Initialize the loss function
loss_fn = nn.CrossEntropyLoss()
```

### 优化器

优化是调整模型参数以减少每一步训练中的模型误差的过程。优化算法定义了这个过程如何进行（在例子中，使用的是随机梯度下降）。所有的优化逻辑都封装在优化器对象中。这里使用了 SGD 优化器；此外，PyTorch 还提供了许多不同的优化器，如 ADAM 和 RMSProp，它们在不同类型的模型和数据上表现更好。

通过注册需要训练的模型参数并传入学习率超参数来初始化优化器

```Python
optimizer = torch.optim.SGD(model.parameters(), lr=learning_rate)
```

在训练循环中，优化分为三个步骤：

- 调用`optimizer.zero_grad()`以重置模型参数的梯度。默认情况下，梯度会相加；为了防止重复计算，我们在每次迭代时明确将其归零。
- 通过调用`loss.backward()`反向传播来预测损失。PyTorch 存储每个参数的损失梯度。
- 一旦有了梯度，就会调用来`optimizer.step()`通过在反向传递中收集的梯度来调整参数。
  
## 全面应用

定义`train_loop`循环优化代码，并`test_loop`根据测试数据评估模型的性能。

```Python
def train_loop(dataloader, model, loss_fn, optimizer):
    size = len(dataloader.dataset)
    # Set the model to training mode - important for batch normalization and dropout layers
    # Unnecessary in this situation but added for best practices
    model.train()
    for batch, (X, y) in enumerate(dataloader):
        # Compute prediction and loss
        pred = model(X)
        loss = loss_fn(pred, y)

        # Backpropagation
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

        if batch % 100 == 0:
            loss, current = loss.item(), batch * batch_size + len(X)
            print(f"loss: {loss:>7f}  [{current:>5d}/{size:>5d}]")


def test_loop(dataloader, model, loss_fn):
    # Set the model to evaluation mode - important for batch normalization and dropout layers
    # Unnecessary in this situation but added for best practices
    model.eval()
    size = len(dataloader.dataset)
    num_batches = len(dataloader)
    test_loss, correct = 0, 0

    # Evaluating the model with torch.no_grad() ensures that no gradients are computed during test mode
    # also serves to reduce unnecessary gradient computations and memory usage for tensors with requires_grad=True
    with torch.no_grad():
        for X, y in dataloader:
            pred = model(X)
            test_loss += loss_fn(pred, y).item()
            correct += (pred.argmax(1) == y).type(torch.float).sum().item()

    test_loss /= num_batches
    correct /= size
    print(f"Test Error: \n Accuracy: {(100*correct):>0.1f}%, Avg loss: {test_loss:>8f} \n")
```

初始化损失函数和优化器，并将其传递给`train_loop`和`test_loop`。随意增加 epoch 的数量来跟踪模型不断提升的性能。

```Python
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=learning_rate)

epochs = 10
for t in range(epochs):
    print(f"Epoch {t+1}\n-------------------------------")
    train_loop(train_dataloader, model, loss_fn, optimizer)
    test_loop(test_dataloader, model, loss_fn)
print("Done!")
```

```Out
Epoch 1
-------------------------------
loss: 2.298730  [   64/60000]
loss: 2.289123  [ 6464/60000]
loss: 2.273286  [12864/60000]
loss: 2.269406  [19264/60000]
loss: 2.249603  [25664/60000]
loss: 2.229407  [32064/60000]
loss: 2.227368  [38464/60000]
loss: 2.204261  [44864/60000]
loss: 2.206193  [51264/60000]
loss: 2.166651  [57664/60000]
Test Error:
 Accuracy: 50.9%, Avg loss: 2.166725

Epoch 2
-------------------------------
loss: 2.176750  [   64/60000]
loss: 2.169595  [ 6464/60000]
loss: 2.117500  [12864/60000]
loss: 2.129272  [19264/60000]
loss: 2.079674  [25664/60000]
loss: 2.032928  [32064/60000]
loss: 2.050115  [38464/60000]
loss: 1.985236  [44864/60000]
loss: 1.987887  [51264/60000]
loss: 1.907162  [57664/60000]
Test Error:
 Accuracy: 55.9%, Avg loss: 1.915486

Epoch 3
-------------------------------
loss: 1.951612  [   64/60000]
loss: 1.928685  [ 6464/60000]
loss: 1.815709  [12864/60000]
loss: 1.841552  [19264/60000]
loss: 1.732467  [25664/60000]
loss: 1.692914  [32064/60000]
loss: 1.701714  [38464/60000]
loss: 1.610632  [44864/60000]
loss: 1.632870  [51264/60000]
loss: 1.514263  [57664/60000]
Test Error:
 Accuracy: 58.8%, Avg loss: 1.541525

Epoch 4
-------------------------------
loss: 1.616448  [   64/60000]
loss: 1.582892  [ 6464/60000]
loss: 1.427595  [12864/60000]
loss: 1.487950  [19264/60000]
loss: 1.359332  [25664/60000]
loss: 1.364817  [32064/60000]
loss: 1.371491  [38464/60000]
loss: 1.298706  [44864/60000]
loss: 1.336201  [51264/60000]
loss: 1.232145  [57664/60000]
Test Error:
 Accuracy: 62.2%, Avg loss: 1.260237

Epoch 5
-------------------------------
loss: 1.345538  [   64/60000]
loss: 1.327798  [ 6464/60000]
loss: 1.153802  [12864/60000]
loss: 1.254829  [19264/60000]
loss: 1.117322  [25664/60000]
loss: 1.153248  [32064/60000]
loss: 1.171765  [38464/60000]
loss: 1.110263  [44864/60000]
loss: 1.154467  [51264/60000]
loss: 1.070921  [57664/60000]
Test Error:
 Accuracy: 64.1%, Avg loss: 1.089831

Epoch 6
-------------------------------
loss: 1.166889  [   64/60000]
loss: 1.170514  [ 6464/60000]
loss: 0.979435  [12864/60000]
loss: 1.113774  [19264/60000]
loss: 0.973411  [25664/60000]
loss: 1.015192  [32064/60000]
loss: 1.051113  [38464/60000]
loss: 0.993591  [44864/60000]
loss: 1.039709  [51264/60000]
loss: 0.971077  [57664/60000]
Test Error:
 Accuracy: 65.8%, Avg loss: 0.982440

Epoch 7
-------------------------------
loss: 1.045165  [   64/60000]
loss: 1.070583  [ 6464/60000]
loss: 0.862304  [12864/60000]
loss: 1.022265  [19264/60000]
loss: 0.885213  [25664/60000]
loss: 0.919528  [32064/60000]
loss: 0.972762  [38464/60000]
loss: 0.918728  [44864/60000]
loss: 0.961629  [51264/60000]
loss: 0.904379  [57664/60000]
Test Error:
 Accuracy: 66.9%, Avg loss: 0.910167

Epoch 8
-------------------------------
loss: 0.956964  [   64/60000]
loss: 1.002171  [ 6464/60000]
loss: 0.779057  [12864/60000]
loss: 0.958409  [19264/60000]
loss: 0.827240  [25664/60000]
loss: 0.850262  [32064/60000]
loss: 0.917320  [38464/60000]
loss: 0.868384  [44864/60000]
loss: 0.905506  [51264/60000]
loss: 0.856353  [57664/60000]
Test Error:
 Accuracy: 68.3%, Avg loss: 0.858248

Epoch 9
-------------------------------
loss: 0.889765  [   64/60000]
loss: 0.951220  [ 6464/60000]
loss: 0.717035  [12864/60000]
loss: 0.911042  [19264/60000]
loss: 0.786085  [25664/60000]
loss: 0.798370  [32064/60000]
loss: 0.874939  [38464/60000]
loss: 0.832796  [44864/60000]
loss: 0.863254  [51264/60000]
loss: 0.819742  [57664/60000]
Test Error:
 Accuracy: 69.5%, Avg loss: 0.818780

Epoch 10
-------------------------------
loss: 0.836395  [   64/60000]
loss: 0.910220  [ 6464/60000]
loss: 0.668506  [12864/60000]
loss: 0.874338  [19264/60000]
loss: 0.754805  [25664/60000]
loss: 0.758453  [32064/60000]
loss: 0.840451  [38464/60000]
loss: 0.806153  [44864/60000]
loss: 0.830360  [51264/60000]
loss: 0.790281  [57664/60000]
Test Error:
 Accuracy: 71.0%, Avg loss: 0.787271

Done!
```