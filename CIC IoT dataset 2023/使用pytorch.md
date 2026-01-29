```Python
import os
import torch
import pandas as pd
import numpy as np
from torch import nn
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
from sklearn.impute import SimpleImputer
from sklearn.discriminant_analysis import StandardScaler


# 设置随机种子，确保结果可复现
torch.manual_seed(42)
np.random.seed(42)
```

```python
DATASET_DIRECTORY = '../CICIoT2023_pytorch/'
```

```python
device = torch.accelerator.current_accelerator().type if torch.accelerator.is_available() else "cpu"

print(f"Using {device} device")
```

```Python
X_columns = [

     'Header_Length', 'Protocol Type', 'Rate',  'fin_flag_number', 'syn_flag_number','rst_flag_number', 'psh_flag_number', 'ack_flag_number','ece_flag_number', 'cwr_flag_number', 'ack_count','syn_count', 'fin_count', 'rst_count', 'HTTP', 'HTTPS', 'DNS', 'Telnet', 'SMTP', 'SSH', 'IRC', 'TCP','UDP', 'DHCP', 'ARP', 'ICMP', 'IPv', 'LLC', 'Tot sum', 'Min','Max', 'AVG', 'Std', 'Tot size', 'IAT', 'Number', 'Variance',  

]

y_column = 'Label'
```

```Python
df_sets = [k for k in os.listdir(DATASET_DIRECTORY) if k.endswith('.csv')]
df_sets.sort()
train = df_sets[:int(len(df_sets)*.8)]
test = df_sets[int(len(df_sets)*.8):]  #从指定目录中获取 .csv 文件，并按 80% 训练集、20% 测试集的比例进行划分。
```

```Python
# 加载多个CSV文件并合并
def load_data(csv_dir):
    labels_map = {
            "DDOS-RSTFINFLOOD": 0,
            "DDOS-PSHACK_FLOOD": 1,
            "DDOS-SYN_FLOOD": 2,
            "DDOS-UDP_FLOOD": 3,
            "DDOS-TCP_FLOOD": 4,
            "DDOS-ICMP_FLOOD": 5,
            "DDOS-SYNONYMOUSIP_FLOOD": 6,
            "DDOS-ACK_FRAGMENTATION": 7,
            "DDOS-UDP_FRAGMENTATION": 8,
            "DDOS-ICMP_FRAGMENTATION": 9,
            "DDOS-SLOWLORIS": 10,
            "DDOS-HTTP_FLOOD": 11,

            "DOS-UDP_FLOOD": 12,
            "DOS-SYN_FLOOD": 13,
            "DOS-TCP_FLOOD": 14,
            "DOS-HTTP_FLOOD": 15,

            "MIRAI-GREETH_FLOOD": 16,
            "MIRAI-GREIP_FLOOD": 17,
            "MIRAI-UDPPLAIN": 18,

            "RECON-PINGSWEEP": 19,
            "RECON-OSSCAN": 20,
            "RECON-PORTSCAN": 21,
            "VULNERABILITYSCAN": 22,
            "RECON-HOSTDISCOVERY": 23,

            "DNS_SPOOFING": 24,
            "MITM-ARPSPOOFING": 25,

            "BENIGN": 26,

            "BROWSERHIJACKING": 27,
            "BACKDOOR_MALWARE": 28,
            "XSS": 29,
            "UPLOADING_ATTACK": 30,
            "SQLINJECTION": 31,
            "COMMANDINJECTION": 32,

            "DICTIONARYBRUTEFORCE":33
        }
    dfs = []
    for file in csv_dir:
        df = pd.read_csv(os.path.join(DATASET_DIRECTORY, file))
        dfs.append(df)
    
    merged_data = pd.concat(dfs, ignore_index=False)
    data = merged_data[X_columns].values
    labels = merged_data[y_column].values
    
    # 处理无穷大和极大值
    data = np.clip(data, -1e15, 1e15)  # 限制数值范围
    
    # 替换无穷大值为最大值
    data = np.nan_to_num(data, nan=0.0, posinf=1e15, neginf=-1e15)
    
    # 对每个特征进行标准化
    mean = np.mean(data, axis=0)
    std = np.std(data, axis=0)
    std = np.where(std == 0, 1, std)  # 避免除以0
    data = (data - mean) / std
    
    # 将字符串标签转换为数值标签
    labels = np.array([labels_map[label] for label in labels])
    
    return data, labels
```

```Python
class Dataset_34classes(Dataset):
    def __init__(self, data, labels, transform=None, target_transform=None):
        self.data = data
        self.labels = labels
        self.transform = transform
        self.target_transform = target_transform
        self.num_classes = 34  # 更新为34个类别

    def __len__(self):
        return len(self.labels)
    
    def to_one_hot(self, label):
        one_hot = torch.zeros(self.num_classes, dtype=torch.float32)
        one_hot[label] = 1
        return one_hot

    
    def __getitem__(self, idx):
        traffic = self.data[idx]
        label = self.labels[idx]
        
        # 转换为one-hot编码
        label = self.to_one_hot(label)

        if self.transform:
            traffic = self.transform(traffic)
        if self.target_transform:
            label = self.target_transform(label)
        
        return torch.tensor(traffic, dtype=torch.float32), label
        
```

```Python
class NeuralNetwork_34classes(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear_relu_stack = nn.Sequential(
            nn.Linear(37, 64),
            nn.BatchNorm1d(64),  # 添加BatchNorm，批量归一化
            nn.ReLU(),
            nn.Dropout(0.2),  #每次前向传播时，20% 的神经元的输出将被随机置为零
            
            nn.Linear(64, 128),
            nn.BatchNorm1d(128),  # 添加BatchNorm
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),  # 添加BatchNorm
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(64, 34)
        )

    def forward(self, x):
        logits = self.linear_relu_stack(x)
        return logits

model = NeuralNetwork_34classes()

```

`torch.nn.BatchNorm1d` 是 PyTorch 中用于对 1D 输入数据（通常是序列或特征向量）进行批量归一化（Batch Normalization, BN）的层。它有助于加速训练、稳定梯度并提高模型的泛化能力。

`BatchNorm1d` 对输入的每个通道（feature）进行归一化，即：

$$y = \gamma \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta$$

其中：

- $\mu$ 是当前 mini-batch 的均值。
- $\sigma^2$ 是当前 mini-batch 的方差。
- $\gamma, \beta$ 是可学习的缩放和平移参数（如果 `affine=True`）。
- $\epsilon$ 是一个小的正值，用于避免除零错误。
  
`nn.Dropout` 是 PyTorch 中的一种层，用于在训练过程中随机地将输入单元设置为零。这是一种正则化技术，可以通过使模型不那么依赖于特定的神经元，来防止过拟合。每次前向传播时，都会随机选择一些神经元进行“丢弃”。

```Python
# 训练参数
learning_rate = 5e-5
batch_size = 2048
epochs = 10
```

```Python
def train_loop(dataloader, model, loss_fn, optimizer):  #训练循环
    size = len(dataloader.dataset)
    model.train()
    total_loss = 0
    for batch, (X, y) in enumerate(dataloader):
        # 检查输入数据是否包含NaN
        if torch.isnan(X).any() or torch.isnan(y).any():
            print("Warning: Input contains NaN!")
            continue
            
        pred = model(X)
        loss = loss_fn(pred, y)
        
        # 检查loss是否为NaN
        if torch.isnan(loss):
            print(f"NaN loss detected at batch {batch}")
            continue
        loss.backward()
        
        # 添加梯度裁剪,避免梯度爆炸
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        optimizer.step()
        optimizer.zero_grad()

        total_loss += loss.item()  #当前批次的损失值累加到 total_loss 中
        if batch % 100 == 0:  #每训练 100 个批次，会打印当前的损失值
            loss, current = loss.item(), batch * batch_size + len(X)
            print(f"loss: {loss:>7f}  [{current:>5d}/{size:>5d}]")
    
    return total_loss / len(dataloader)  #返回整个数据集的平均损失
```

```Python
def test_loop(dataloader, model, loss_fn):  #测试循环
    model.eval()  #模型设置为评估模式
    size = len(dataloader.dataset)
    num_batches = len(dataloader)
    test_loss, correct = 0, 0

    with torch.no_grad():  #使用torch.no_grad()来禁用梯度计算，减少内存消耗并加速计算。
        for X, y in dataloader:
            pred = model(X)
            test_loss += loss_fn(pred, y).item()
            pred_indices = pred.argmax(1)
            true_indices = y.argmax(1)
            correct += (pred_indices == true_indices).type(torch.float).sum().item()

    test_loss /= num_batches  #计算平均损失。
    correct /= size  #计算准确率
    print(f"Test Error: \n Accuracy: {(100*correct):>0.1f}%, Avg loss: {test_loss:>8f} \n")
```

```Python
# 创建数据加载器
train_dataset = Dataset_34classes(load_data(train)[0], load_data(train)[1])
test_dataset = Dataset_34classes(load_data(test)[0], load_data(test)[1])
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
```

```Python
# 创建模型、损失函数和优化器
model = NeuralNetwork_34classes()
loss_fn = nn.BCEWithLogitsLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)  #Adma优化器
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(  #学习率调度器
    optimizer, 
    mode='min',
    factor=0.5,  #当需要调整时，学习率乘以0.5
    patience=3,  #如果连续3个epoch没有改善，就调整学习率
    min_lr=1e-6  #学习率的下限，防止学习率过小
)
```

```Python
for t in range(epochs):
    print(f"Epoch {t+1}\n-------------------------------")
    train_loop(train_loader, model, loss_fn, optimizer)
    test_loop(test_loader, model, loss_fn)
print("Done!")
```

```Out
Epoch 1
-------------------------------
loss: 0.728571  [ 2048/5712270]
loss: 0.660609  [206848/5712270]
loss: 0.594189  [411648/5712270]
loss: 0.534101  [616448/5712270]
loss: 0.479485  [821248/5712270]
loss: 0.422562  [1026048/5712270]
loss: 0.383621  [1230848/5712270]
loss: 0.337590  [1435648/5712270]
loss: 0.301023  [1640448/5712270]
loss: 0.269484  [1845248/5712270]
loss: 0.248500  [2050048/5712270]
loss: 0.221963  [2254848/5712270]
loss: 0.199843  [2459648/5712270]
loss: 0.184559  [2664448/5712270]
loss: 0.169305  [2869248/5712270]
loss: 0.158737  [3074048/5712270]
loss: 0.144874  [3278848/5712270]
loss: 0.136038  [3483648/5712270]
loss: 0.128098  [3688448/5712270]
loss: 0.120434  [3893248/5712270]
loss: 0.111962  [4098048/5712270]
loss: 0.105500  [4302848/5712270]
loss: 0.100120  [4507648/5712270]
loss: 0.095173  [4712448/5712270]
loss: 0.092404  [4917248/5712270]
loss: 0.087565  [5122048/5712270]
loss: 0.083215  [5326848/5712270]
loss: 0.080676  [5531648/5712270]
Test Error: 
 Accuracy: 69.4%, Avg loss: 0.070969 

Epoch 2
-------------------------------
loss: 0.077013  [ 2048/5712270]
loss: 0.073687  [206848/5712270]
loss: 0.071203  [411648/5712270]
loss: 0.069053  [616448/5712270]
loss: 0.066354  [821248/5712270]
loss: 0.064160  [1026048/5712270]
loss: 0.063089  [1230848/5712270]
loss: 0.061688  [1435648/5712270]
loss: 0.060973  [1640448/5712270]
loss: 0.057620  [1845248/5712270]
loss: 0.058129  [2050048/5712270]
loss: 0.055432  [2254848/5712270]
loss: 0.053295  [2459648/5712270]
loss: 0.053641  [2664448/5712270]
loss: 0.051772  [2869248/5712270]
loss: 0.050240  [3074048/5712270]
loss: 0.049590  [3278848/5712270]
loss: 0.049226  [3483648/5712270]
loss: 0.047463  [3688448/5712270]
loss: 0.045879  [3893248/5712270]
loss: 0.046237  [4098048/5712270]
loss: 0.045248  [4302848/5712270]
loss: 0.044817  [4507648/5712270]
loss: 0.043278  [4712448/5712270]
loss: 0.044063  [4917248/5712270]
loss: 0.041831  [5122048/5712270]
loss: 0.043956  [5326848/5712270]
loss: 0.040974  [5531648/5712270]
Test Error: 
 Accuracy: 69.6%, Avg loss: 0.038271 

Epoch 3
-------------------------------
loss: 0.041651  [ 2048/5712270]
loss: 0.039352  [206848/5712270]
loss: 0.040404  [411648/5712270]
loss: 0.039970  [616448/5712270]
loss: 0.039600  [821248/5712270]
loss: 0.039304  [1026048/5712270]
loss: 0.037890  [1230848/5712270]
loss: 0.038210  [1435648/5712270]
loss: 0.037790  [1640448/5712270]
loss: 0.036059  [1845248/5712270]
loss: 0.036438  [2050048/5712270]
loss: 0.035987  [2254848/5712270]
loss: 0.036297  [2459648/5712270]
loss: 0.035564  [2664448/5712270]
loss: 0.035900  [2869248/5712270]
loss: 0.035602  [3074048/5712270]
loss: 0.035854  [3278848/5712270]
loss: 0.035118  [3483648/5712270]
loss: 0.034741  [3688448/5712270]
loss: 0.034661  [3893248/5712270]
loss: 0.034082  [4098048/5712270]
loss: 0.032759  [4302848/5712270]
loss: 0.034308  [4507648/5712270]
loss: 0.033672  [4712448/5712270]
loss: 0.032466  [4917248/5712270]
loss: 0.032712  [5122048/5712270]
loss: 0.034126  [5326848/5712270]
loss: 0.033483  [5531648/5712270]
Test Error: 
 Accuracy: 72.5%, Avg loss: 0.030860 

Epoch 4
-------------------------------
loss: 0.033767  [ 2048/5712270]
loss: 0.032531  [206848/5712270]
loss: 0.032492  [411648/5712270]
loss: 0.032658  [616448/5712270]
loss: 0.031321  [821248/5712270]
loss: 0.031798  [1026048/5712270]
loss: 0.031891  [1230848/5712270]
loss: 0.031243  [1435648/5712270]
loss: 0.030484  [1640448/5712270]
loss: 0.031980  [1845248/5712270]
loss: 0.030197  [2050048/5712270]
loss: 0.030829  [2254848/5712270]
loss: 0.030841  [2459648/5712270]
loss: 0.031281  [2664448/5712270]
loss: 0.030805  [2869248/5712270]
loss: 0.030968  [3074048/5712270]
loss: 0.029867  [3278848/5712270]
loss: 0.031202  [3483648/5712270]
loss: 0.030855  [3688448/5712270]
loss: 0.029981  [3893248/5712270]
loss: 0.029977  [4098048/5712270]
loss: 0.029825  [4302848/5712270]
loss: 0.030080  [4507648/5712270]
loss: 0.030879  [4712448/5712270]
loss: 0.030150  [4917248/5712270]
loss: 0.030324  [5122048/5712270]
loss: 0.030513  [5326848/5712270]
loss: 0.029958  [5531648/5712270]
Test Error: 
 Accuracy: 73.0%, Avg loss: 0.028725 

Epoch 5
-------------------------------
loss: 0.030552  [ 2048/5712270]
loss: 0.029417  [206848/5712270]
loss: 0.029448  [411648/5712270]
loss: 0.030257  [616448/5712270]
loss: 0.029443  [821248/5712270]
loss: 0.029480  [1026048/5712270]
loss: 0.029017  [1230848/5712270]
loss: 0.029297  [1435648/5712270]
loss: 0.029893  [1640448/5712270]
loss: 0.029769  [1845248/5712270]
loss: 0.029839  [2050048/5712270]
loss: 0.028733  [2254848/5712270]
loss: 0.028967  [2459648/5712270]
loss: 0.029353  [2664448/5712270]
loss: 0.028923  [2869248/5712270]
loss: 0.030237  [3074048/5712270]
loss: 0.028581  [3278848/5712270]
loss: 0.028401  [3483648/5712270]
loss: 0.029450  [3688448/5712270]
loss: 0.028945  [3893248/5712270]
loss: 0.028639  [4098048/5712270]
loss: 0.029373  [4302848/5712270]
loss: 0.028668  [4507648/5712270]
loss: 0.029461  [4712448/5712270]
loss: 0.028457  [4917248/5712270]
loss: 0.029553  [5122048/5712270]
loss: 0.028817  [5326848/5712270]
loss: 0.029182  [5531648/5712270]
Test Error: 
 Accuracy: 74.2%, Avg loss: 0.028009 

Epoch 6
-------------------------------
loss: 0.029452  [ 2048/5712270]
loss: 0.028139  [206848/5712270]
loss: 0.029029  [411648/5712270]
loss: 0.029302  [616448/5712270]
loss: 0.027880  [821248/5712270]
loss: 0.029022  [1026048/5712270]
loss: 0.027653  [1230848/5712270]
loss: 0.028980  [1435648/5712270]
loss: 0.029471  [1640448/5712270]
loss: 0.028827  [1845248/5712270]
loss: 0.028776  [2050048/5712270]
loss: 0.028106  [2254848/5712270]
loss: 0.028896  [2459648/5712270]
loss: 0.029116  [2664448/5712270]
loss: 0.028049  [2869248/5712270]
loss: 0.030080  [3074048/5712270]
loss: 0.029517  [3278848/5712270]
loss: 0.028946  [3483648/5712270]
loss: 0.028750  [3688448/5712270]
loss: 0.028338  [3893248/5712270]
loss: 0.028304  [4098048/5712270]
loss: 0.028264  [4302848/5712270]
loss: 0.027835  [4507648/5712270]
loss: 0.028763  [4712448/5712270]
loss: 0.029536  [4917248/5712270]
loss: 0.028174  [5122048/5712270]
loss: 0.029118  [5326848/5712270]
loss: 0.028846  [5531648/5712270]
Test Error: 
 Accuracy: 74.2%, Avg loss: 0.027691 

Epoch 7
-------------------------------
loss: 0.027746  [ 2048/5712270]
loss: 0.028888  [206848/5712270]
loss: 0.029264  [411648/5712270]
loss: 0.028539  [616448/5712270]
loss: 0.027587  [821248/5712270]
loss: 0.028855  [1026048/5712270]
loss: 0.029553  [1230848/5712270]
loss: 0.028219  [1435648/5712270]
loss: 0.029020  [1640448/5712270]
loss: 0.028912  [1845248/5712270]
loss: 0.028128  [2050048/5712270]
loss: 0.028396  [2254848/5712270]
loss: 0.028125  [2459648/5712270]
loss: 0.028949  [2664448/5712270]
loss: 0.028040  [2869248/5712270]
loss: 0.029015  [3074048/5712270]
loss: 0.029042  [3278848/5712270]
loss: 0.028093  [3483648/5712270]
loss: 0.028583  [3688448/5712270]
loss: 0.028406  [3893248/5712270]
loss: 0.027529  [4098048/5712270]
loss: 0.028646  [4302848/5712270]
loss: 0.028864  [4507648/5712270]
loss: 0.027630  [4712448/5712270]
loss: 0.028879  [4917248/5712270]
loss: 0.028717  [5122048/5712270]
loss: 0.028344  [5326848/5712270]
loss: 0.027903  [5531648/5712270]
Test Error: 
 Accuracy: 74.4%, Avg loss: 0.027498 

Epoch 8
-------------------------------
loss: 0.028700  [ 2048/5712270]
loss: 0.029163  [206848/5712270]
loss: 0.029241  [411648/5712270]
loss: 0.027990  [616448/5712270]
loss: 0.027852  [821248/5712270]
loss: 0.026876  [1026048/5712270]
loss: 0.027847  [1230848/5712270]
loss: 0.029221  [1435648/5712270]
loss: 0.027496  [1640448/5712270]
loss: 0.028518  [1845248/5712270]
loss: 0.029127  [2050048/5712270]
loss: 0.027186  [2254848/5712270]
loss: 0.028526  [2459648/5712270]
loss: 0.027688  [2664448/5712270]
loss: 0.027827  [2869248/5712270]
loss: 0.028237  [3074048/5712270]
loss: 0.028091  [3278848/5712270]
loss: 0.028222  [3483648/5712270]
loss: 0.027945  [3688448/5712270]
loss: 0.027184  [3893248/5712270]
loss: 0.027775  [4098048/5712270]
loss: 0.027505  [4302848/5712270]
loss: 0.028639  [4507648/5712270]
loss: 0.028059  [4712448/5712270]
loss: 0.028192  [4917248/5712270]
loss: 0.028101  [5122048/5712270]
loss: 0.028098  [5326848/5712270]
loss: 0.027772  [5531648/5712270]
Test Error: 
 Accuracy: 74.6%, Avg loss: 0.027367 

Epoch 9
-------------------------------
loss: 0.028809  [ 2048/5712270]
loss: 0.027892  [206848/5712270]
loss: 0.028051  [411648/5712270]
loss: 0.028584  [616448/5712270]
loss: 0.029012  [821248/5712270]
loss: 0.029400  [1026048/5712270]
loss: 0.028665  [1230848/5712270]
loss: 0.027257  [1435648/5712270]
loss: 0.026939  [1640448/5712270]
loss: 0.027338  [1845248/5712270]
loss: 0.027528  [2050048/5712270]
loss: 0.028045  [2254848/5712270]
loss: 0.027460  [2459648/5712270]
loss: 0.026331  [2664448/5712270]
loss: 0.026262  [2869248/5712270]
loss: 0.027434  [3074048/5712270]
loss: 0.027850  [3278848/5712270]
loss: 0.028023  [3483648/5712270]
loss: 0.028118  [3688448/5712270]
loss: 0.028537  [3893248/5712270]
loss: 0.027862  [4098048/5712270]
loss: 0.026145  [4302848/5712270]
loss: 0.027417  [4507648/5712270]
loss: 0.026703  [4712448/5712270]
loss: 0.027126  [4917248/5712270]
loss: 0.027800  [5122048/5712270]
loss: 0.028112  [5326848/5712270]
loss: 0.028569  [5531648/5712270]
Test Error: 
 Accuracy: 74.7%, Avg loss: 0.027228 

Epoch 10
-------------------------------
loss: 0.028429  [ 2048/5712270]
loss: 0.027585  [206848/5712270]
loss: 0.027800  [411648/5712270]
loss: 0.027435  [616448/5712270]
loss: 0.027504  [821248/5712270]
loss: 0.026583  [1026048/5712270]
loss: 0.027623  [1230848/5712270]
loss: 0.027309  [1435648/5712270]
loss: 0.028220  [1640448/5712270]
loss: 0.029165  [1845248/5712270]
loss: 0.026637  [2050048/5712270]
loss: 0.027653  [2254848/5712270]
loss: 0.027797  [2459648/5712270]
loss: 0.027483  [2664448/5712270]
loss: 0.027085  [2869248/5712270]
loss: 0.028452  [3074048/5712270]
loss: 0.027921  [3278848/5712270]
loss: 0.027366  [3483648/5712270]
loss: 0.028146  [3688448/5712270]
loss: 0.026210  [3893248/5712270]
loss: 0.027539  [4098048/5712270]
loss: 0.028887  [4302848/5712270]
loss: 0.027447  [4507648/5712270]
loss: 0.027519  [4712448/5712270]
loss: 0.026977  [4917248/5712270]
loss: 0.027901  [5122048/5712270]
loss: 0.028165  [5326848/5712270]
loss: 0.027066  [5531648/5712270]
Test Error: 
 Accuracy: 74.8%, Avg loss: 0.027133 

Done!
```

修改batch_size：

```Python
batch_size = 1024
```

```Out
...
Epoch 10
-------------------------------
loss: 0.027880  [ 1024/5712270]
loss: 0.028087  [103424/5712270]
loss: 0.027304  [205824/5712270]
loss: 0.028724  [308224/5712270]
loss: 0.027693  [410624/5712270]
loss: 0.028723  [513024/5712270]
loss: 0.026329  [615424/5712270]
loss: 0.028145  [717824/5712270]
loss: 0.026823  [820224/5712270]
loss: 0.026891  [922624/5712270]
loss: 0.027712  [1025024/5712270]
loss: 0.028543  [1127424/5712270]
loss: 0.027399  [1229824/5712270]
loss: 0.026560  [1332224/5712270]
loss: 0.027318  [1434624/5712270]
loss: 0.028868  [1537024/5712270]
loss: 0.026832  [1639424/5712270]
loss: 0.028024  [1741824/5712270]
loss: 0.027063  [1844224/5712270]
loss: 0.027193  [1946624/5712270]
loss: 0.026504  [2049024/5712270]
loss: 0.027082  [2151424/5712270]
loss: 0.028091  [2253824/5712270]
loss: 0.027102  [2356224/5712270]
loss: 0.027798  [2458624/5712270]
loss: 0.028329  [2561024/5712270]
loss: 0.027984  [2663424/5712270]
loss: 0.028290  [2765824/5712270]
loss: 0.026386  [2868224/5712270]
loss: 0.028474  [2970624/5712270]
loss: 0.025801  [3073024/5712270]
loss: 0.027401  [3175424/5712270]
loss: 0.029217  [3277824/5712270]
loss: 0.026614  [3380224/5712270]
loss: 0.026086  [3482624/5712270]
loss: 0.027620  [3585024/5712270]
loss: 0.027091  [3687424/5712270]
loss: 0.028062  [3789824/5712270]
loss: 0.026916  [3892224/5712270]
loss: 0.027963  [3994624/5712270]
loss: 0.028783  [4097024/5712270]
loss: 0.029514  [4199424/5712270]
loss: 0.028030  [4301824/5712270]
loss: 0.026732  [4404224/5712270]
loss: 0.027026  [4506624/5712270]
loss: 0.027115  [4609024/5712270]
loss: 0.028617  [4711424/5712270]
loss: 0.028105  [4813824/5712270]
loss: 0.026907  [4916224/5712270]
loss: 0.026834  [5018624/5712270]
loss: 0.026541  [5121024/5712270]
loss: 0.025791  [5223424/5712270]
loss: 0.027027  [5325824/5712270]
loss: 0.025425  [5428224/5712270]
loss: 0.026572  [5530624/5712270]
loss: 0.027229  [5633024/5712270]
Test Error: 
 Accuracy: 75.5%, Avg loss: 0.026647 
```