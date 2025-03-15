在训练神经网络时，最常用的算法是 **反向传播**。在该算法中，根据损失函数关于给定参数的**梯度**来调整参数（模型权重） 。

为了计算这些梯度，PyTorch 有一个内置的微分引擎，称为`torch.autograd`。它支持自动计算任何计算图的梯度。

考虑最简单的单层神经网络，具有输入`x`、参数`w`和`b`以及一些损失函数。它可以在 PyTorch 中按以下方式定义：

```Python
import torch

x = torch.ones(5)  # input tensor
y = torch.zeros(3)  # expected output
# 创建可训练参数（权重和偏置）
w = torch.randn(5, 3, requires_grad=True) #权重
b = torch.randn(3, requires_grad=True) #偏置
# 计算模型输出 logits  线性变换: z = xW + b
z = torch.matmul(x, w)+b 
# 计算二元交叉熵损失（带 logits 版本）
loss = torch.nn.functional.binary_cross_entropy_with_logits(z, y)
```

`binary_cross_entropy_with_logits` 结合了**Sigmoid 激活**和**二元交叉熵损失**
$$BCE(p,y)=−ylog(p)−(1−y)log(1−p)$$ 其中：

- $p = \sigma(z)$是 **Sigmoid 激活后的概率**：$$ \sigma(z) = \frac{1}{1 + e^{-z}}$$
- `y` 是真实标签（`0` 或 `1`）。

>[!note] **二元交叉熵（Binary Cross-Entropy, BCE）**
>$$BCE=-\frac{1}{n}\sum_{i=1}^n​[y_i​log(p_i​)+(1−y_i​)log(1−p_i​)]$$
>
> **衡量两个概率分布的差异**，适用于 **二分类任务**。
> $p_i = sigmoid(logits)$ 表示模型预测的概率。
 
 
## 张量、函数和计算图
***

此代码定义了以下**计算图**：

![](https://pytorch.org/tutorials/_images/comp-graph.png)

在这个网络中，`w`和`b`是需要优化的**参数**。因此，需要能够计算损失函数对这些变量的梯度。为了做到这一点，设置了`requires_grad`这些张量的属性。

>[!note] requires_grad
>`requires_grad`可以在创建张量时设置的值，或者稍后使用`x.requires_grad_(True)`方法设置。

应用于张量来构建计算图的函数实际上是类的对象`Function`。该对象知道如何在前向传播种计算函数，以及如何在后向传播中计算其导数。对后向传播函数的引用存储在张量的属性中。

```Python
print(f"Gradient function for z = {z.grad_fn}")
print(f"Gradient function for loss = {loss.grad_fn}")
```

```Out
Gradient function for z = <AddBackward0 object at 0x7fbf8b2f0e50>
Gradient function for loss = <BinaryCrossEntropyWithLogitsBackward0 object at 0x7fbf8b2f0f40>
```

## 计算梯度
***
为了优化神经网络中的参数权重，需要计算损失函数对参数的导数，我们需要在某些固定的 $x$ 和 $y$ 值下计算$\frac{∂损失}{∂_w}$​​和$\frac{∂损失}{∂_b}$​​。为了计算这些导数，调用`loss.backward()`，然后从和`w.grad`中`b.grad`检索值：

```Python
loss.backward()
print(w.grad)
print(b.grad)
```

```Out
tensor([[0.3313, 0.0626, 0.2530],
        [0.3313, 0.0626, 0.2530],
        [0.3313, 0.0626, 0.2530],
        [0.3313, 0.0626, 0.2530],
        [0.3313, 0.0626, 0.2530]])
tensor([0.3313, 0.0626, 0.2530])
```

## 禁用梯度跟踪
***

在 PyTorch 中，默认情况下，所有 `requires_grad=True` 的张量都会跟踪计算历史，以便进行自动微分。但在某些情况下，我们并不需要梯度跟踪，比如：

1. **推理（Inference）阶段**：当模型已经训练好只想在新数据上做前向传播，而不需要计算梯度。
2. **减少内存占用**：禁用梯度跟踪可以节省显存，因为 PyTorch不会存储计算图。
3. **加速计算**：在 `torch.no_grad()` 作用下，PyTorch不会计算梯度信息，使得前向计算更快。
   
```Python
z = torch.matmul(x, w)+b
print(z.requires_grad)

with torch.no_grad():
    z = torch.matmul(x, w)+b
print(z.requires_grad)
```

```Out
True
False
```

实现相同结果的另一种方法是使用`detach()`张量上的方法：

```Python
z = torch.matmul(x, w)+b
z_det = z.detach()
print(z_det.requires_grad)
```

```Out
False
```