张量是一种特殊的数据结构，与数组和矩阵非常相似。在 `PyTorch` 中，使用张量来编码模型的输入和输出以及模型的参数。

```python
import torch
import numpy as np
```

## 张量初始化
***

**直接来自数据：

张量可以直接从数据创建，数据类型自动判断。

```python
data = [[1,2],[3,4]]
x_data=torch.tensor(data)
```

**来自Numpy数组：

可以从NumPy数组创建张量。

```python
np_array = np.array(data)
x_np = torch.from_numpy(np_array)
```

**从另一个张量：

除非明确覆盖，否则新的张量将保留参数张量的属性（形状、数据类型）。

```python
x_ones = torch.ones_like(x_data) # retains the properties of x_data
print(f"Ones Tensor: \n {x_ones} \n")

x_rand = torch.rand_like(x_data, dtype=torch.float) # overrides the datatype of x_data
print(f"Random Tensor: \n {x_rand} \n")
```

```Out
Ones Tensor:
 tensor([[1, 1],
        [1, 1]])

Random Tensor:
 tensor([[0.8823, 0.9150],
        [0.3829, 0.9593]])
```

**使用随机值或常数值：

`shape`是张量维度发元组。在下面的函数中，它决定了张量的维数。

```python
shape = (2, 3,)
rand_tensor = torch.rand(shape)
ones_tensor = torch.ones(shape)
zeros_tensor = torch.zeros(shape)

print(f"Random Tensor: \n {rand_tensor} \n")
print(f"Ones Tensor: \n {ones_tensor} \n")
print(f"Zeros Tensor: \n {zeros_tensor}")
```

```Out
Random Tensor:
 tensor([[0.3904, 0.6009, 0.2566],
        [0.7936, 0.9408, 0.1332]])

Ones Tensor:
 tensor([[1., 1., 1.],
        [1., 1., 1.]])

Zeros Tensor:
 tensor([[0., 0., 0.],
        [0., 0., 0.]])
```

## 张量属性
***

张量属性描述它们的形状、数据类型和存储它们的设备。

```python
tensor = torch.rand(3, 4)

print(f"Shape of tensor: {tensor.shape}")
print(f"Datatype of tensor: {tensor.dtype}")
print(f"Device tensor is stored on: {tensor.device}")
```

```Out
Shape of tensor: torch.Size([3, 4])
Datatype of tensor: torch.float32
Device tensor is stored on: cpu
```

## [张量运算](https://pytorch.org/docs/stable/torch.html)
***

张量运算可以在GPU上运行（速度比CPU上更快）。

```Python
# We move our tensor to the GPU if available
if torch.cuda.is_available():
  tensor = tensor.to('cuda')
  print(f"Device tensor is stored on: {tensor.device}")
```

```Out
Device tensor is stored on: cuda:0
```

### 标准的numpy式索引和切片：

```Python
tensor = torch.ones(4, 4)
tensor[:,1] = 0 #第二列变为0
print(tensor)
```

```Out
tensor([[1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.]])
```

**连接张量** 可以使用`torch.cat`连接给定维度上的张量序列。

```Python
t1 = torch.cat([tensor, tensor, tensor], dim=1)
print(t1)
```

```Out
tensor([[1., 0., 1., 1., 1., 0., 1., 1., 1., 0., 1., 1.],
        [1., 0., 1., 1., 1., 0., 1., 1., 1., 0., 1., 1.],
        [1., 0., 1., 1., 1., 0., 1., 1., 1., 0., 1., 1.],
        [1., 0., 1., 1., 1., 0., 1., 1., 1., 0., 1., 1.]])
```

### 张量乘法

```Python
# This computes the element-wise product 这将计算逐元素乘积
print(f"tensor.mul(tensor) \n {tensor.mul(tensor)} \n")
# Alternative syntax:
print(f"tensor * tensor \n {tensor * tensor}")
```

```Out
tensor.mul(tensor)
 tensor([[1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.]])

tensor * tensor
 tensor([[1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.]])
```

计算两个张量之间的矩阵乘法

```Python
print(f"tensor.matmul(tensor.T) \n {tensor.matmul(tensor.T)} \n")
# Alternative syntax:
print(f"tensor @ tensor.T \n {tensor @ tensor.T}")
#tensor.T 表示张量的转置
```

```Out
tensor.matmul(tensor.T)
 tensor([[3., 3., 3., 3.],
        [3., 3., 3., 3.],
        [3., 3., 3., 3.],
        [3., 3., 3., 3.]])

tensor @ tensor.T
 tensor([[3., 3., 3., 3.],
        [3., 3., 3., 3.],
        [3., 3., 3., 3.],
        [3., 3., 3., 3.]])
```

> [!NOTE] mul和matmul的区别
> | 操作       | 计算方式      | 适用维度        | 等价符号 |
| -------- | --------- | ----------- | ---- |
| `mul`    | 逐元素乘法     | 维度需匹配（或可广播） | `*`  |
| `matmul` | 矩阵乘法（或点积） | 任意匹配维度的张量   | `@`  |

带有 `_` 后缀的操作是**原地（in-place）操作**。例如：`x.copy_(y)`，`x.t_()`，这些操作会直接修改 `x` 的值。

```Python
print(tensor, "\n")
tensor.add_(5)
print(tensor)
```

```Out
tensor([[1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.]])

tensor([[6., 5., 6., 6.],
        [6., 5., 6., 6.],
        [6., 5., 6., 6.],
        [6., 5., 6., 6.]])
```

>[!note]
>原地（in-place）操作可以节省一些内存，但在计算导数时可能会出现问题，因为会立即丢失历史记录。因此，不鼓励使用它们。

## 与NumPy桥接
***

CPU 和 NumPy 数组上的张量可以共享其底层内存位置，改变其中一个也会改变另一个。

### 张量转为 NumPy 数组

```Python
t = torch.ones(5)
print(f"t: {t}")
n = t.numpy()
print(f"n: {n}")
```

```Out
t: tensor([1., 1., 1., 1., 1.])
n: [1. 1. 1. 1. 1.]
```

张量的变化反映在 NumPy 数组中。

```Python
t.add_(1)
print(f"t: {t}")
print(f"n: {n}")
```

```Out
t: tensor([2., 2., 2., 2., 2.])
n: [2. 2. 2. 2. 2.]
```

### NumPy 数组转张量

```Python
n = np.ones(5)
t = torch.from_numpy(n)
```

NumPy 数组的变化反映在张量中。

```Python
np.add(n, 1, out=n)
print(f"t: {t}")
print(f"n: {n}")
```

```Out
t: tensor([2., 2., 2., 2., 2.], dtype=torch.float64)
n: [2. 2. 2. 2. 2.]
```