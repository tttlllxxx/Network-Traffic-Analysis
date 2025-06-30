# APT行为图（APT Behavior Graph）设计文档草稿

## 1. 设计目的

APT（高级持续性威胁）攻击具有阶段性、隐蔽性和链式行为特征。为了更好地建模APT攻击过程中的行为关联与阶段演进，我们设计一种适用于图神经网络建模的APT行为图结构，作为后续GNN建模与评价体系分析的基础。

---

## 2. 图结构概述

### 2.1 图类型

- **有向图**（Directed Graph）
- **可为动态图**（支持时序构建 / 滑窗构建）

---

## 3. 节点设计（Node Design）

### 3.1 节点类型

| 类型        | 描述                           | 示例            |
|-------------|--------------------------------|-----------------|
| 主机节点    | 表示物理/虚拟主机或IP地址      | `Host_192.168.1.10` |
| 进程节点    | 表示系统中的某个进程或程序行为 | `Proc_cmd.exe`      |
| 文件节点    | 表示被访问、创建、修改的文件   | `File_C:\flag.txt` |
| 网络连接节点| 表示一次网络通信行为            | `Conn_TCP_443`      |
| 用户节点    | 表示用户身份                   | `User_admin`        |
| 日志事件节点| 表示被记录的一条日志行为       | `Log_event_ID4624`  |

可根据任务简化为：`{行为节点}` 或 `{主机-行为}` 二部图。

### 3.2 节点属性（Features）

| 属性名称       | 描述                             | 示例值       |
|----------------|----------------------------------|--------------|
| 时间戳         | 行为或事件的发生时间             | `2024-03-01 12:34:56` |
| 行为类别       | 如创建进程、文件访问、登录、通信 | `proc_create`, `file_write` |
| 所属阶段标签   | ATT&CK阶段标签                   | `Initial_Access`, `Lateral_Movement` |
| 是否为攻击行为 | 二值标签                         | `1`（攻击），`0`（正常） |
| 权重（可选）   | 节点重要性                       | `0.85`       |

---

## 4. 边设计（Edge Design）

### 4.1 边定义

| 边类型        | 表示的关系                     | 示例                   |
|---------------|--------------------------------|------------------------|
| 时间先后关系  | A事件发生在B之前               | `Proc_A → File_B`      |
| 因果触发关系  | A操作触发B操作                 | `Login → File_access` |
| 同主机关系    | 两个行为发生在同一主机上       | `Proc_A ↔ Proc_B`      |
| 网络流关系    | A主机向B主机发起通信           | `Host_A → Host_B`      |
| 用户关联      | 某行为由某用户发起             | `User_U → Proc_P`      |

### 4.2 边属性

| 属性名称   | 描述                     | 示例值     |
|------------|--------------------------|------------|
| 权重       | 表示该边重要性/置信度   | `0.7`      |
| 时间差     | 边两端节点时间差         | `2.3s`     |
| 类型标签   | 如“数据流”、“控制流”等 | `causal`   |

---

## 5. 图构建规则（Graph Construction Rules）

1. **时间窗切片**：将整个攻击流程按时间滑窗切分，每个滑窗构建一个小图；
2. **节点聚合规则**：
   - 相同主机同一类型节点可合并（如10秒内多个同类操作合并）；
3. **边添加规则**：
   - 若两行为相隔时间小于 `Δt` 且发生在同主机，可建立“先后关系”边；
   - 若行为A产生事件日志，行为B访问日志资源，可添加“因果边”；
4. **标签标注方式**：
   - 使用已知标签数据标注攻击阶段；
   - 若无标签，使用规则引擎或专家标注。

---

## 6. 图示建议（可选）

可使用以下工具生成结构示意图：

- `Graphviz` / `NetworkX` / `PyVis`
- 显示节点颜色代表攻击阶段、形状代表节点类型、边颜色代表因果关系等

---

## 7. 示例子图（概念结构）

[User_admin]──▶[Proc_powershell.exe]──▶[Conn_TCP_10.0.0.2]  
│  
▼  
[File_C:\malware.dll]

说明：

- 用户启动 PowerShell → 建立远程连接 → 下载文件；
- 三个事件构成攻击链的一个阶段（如 Command and Control）；
- 每个节点都包含时间戳、类型、阶段标签、可被GNN处理。

---

## 8. 可扩展方向

- **动态图支持**：构建动态图序列，适配T-GNN或EvolveGCN；
- **图分层设计**：将行为图按主机划分子图，构建图嵌套；
- **特征增强**：引入静态信息（用户权限、文件哈希）作为特征。

---

## 9. 小结

APT行为图为APT攻击建模提供了结构化支持，具备：

- 行为阶段建模能力；
- 因果链条表达能力；
- 可被图神经网络学习的语义与结构。

它将作为后续APT建模与GNN训练的基础输入，并与评价-反馈机制紧密结合。


```Python
# graph_construction.py
import pandas as pd
import networkx as nx

# === 参数设置 ===
WINDOW_SIZE = 10  # 时间窗口大小（秒）
STEP_SIZE = 5     # 滑动步长（秒）
DELTA_T = 2       # 添加边的最大时间间隔（秒）

# === 数据读取 ===
def load_data(file_path):
    df = pd.read_excel(file_path)
    return df

# === 时间窗口划分 ===
def generate_time_windows(min_ts, max_ts, window_size, step_size):
    windows = []
    t = min_ts
    while t + window_size <= max_ts:
        windows.append((t, t + window_size))
        t += step_size
    return windows

# === 聚合节点 ===
def aggregate_nodes(window_df):
    window_df['node_id'] = (
        window_df['Source IP'].astype(str) + '_' +
        window_df['Protocol_name']
    )
    grouped = window_df.groupby('node_id').agg({
        'Source IP': 'first',
        'Protocol_name': 'first',
        'flow_duration': 'sum'
    }).reset_index()
    return grouped

# === 构建边关系图 ===
def build_edges(window_df, delta_t=2):
    G = nx.DiGraph()
    events = window_df.sort_values('ts').copy()
    events['node_id'] = events['Source IP'].astype(str) + '_' + events['Protocol_name']

    for i, row_a in events.iterrows():
        G.add_node(row_a['node_id'], ip=row_a['Source IP'], protocol=row_a['Protocol_name'])

    for i, row_a in events.iterrows():
        for j, row_b in events.iterrows():
            if i >= j:
                continue
            time_gap = row_b['ts'] - row_a['ts']
            same_host = row_a['Source IP'] == row_b['Source IP']
            if time_gap <= delta_t and same_host:
                G.add_edge(
                    row_a['node_id'], row_b['node_id'],
                    relation='sequence', time_gap=time_gap
                )
    return G

# === 标签标注（可选） ===
def label_graph(G, label_data):
    for node in G.nodes:
        ip = node.split('_')[0]
        if ip in label_data:
            G.nodes[node]['label'] = label_data[ip]
        else:
            G.nodes[node]['label'] = 'unknown'

# === 主流程 ===
def process_graphs(file_path, label_data=None):
    df = load_data(file_path)
    min_ts = df['ts'].min()
    max_ts = df['ts'].max()
    windows = generate_time_windows(min_ts, max_ts, WINDOW_SIZE, STEP_SIZE)

    graph_list = []
    for start, end in windows:
        window_df = df[(df['ts'] >= start) & (df['ts'] < end)].copy()
        if window_df.empty:
            continue
        G = build_edges(window_df, delta_t=DELTA_T)
        if label_data:
            label_graph(G, label_data)
        graph_list.append((start, end, G))
    return graph_list

# === 使用示例 ===
if __name__ == "__main__":
    excel_file = "./your_excel_data.xlsx"
    label_dict = {  # 示例标签
        "172.16.64.128": "attacker",
        "172.16.66.128": "victim"
    }
    graphs = process_graphs(excel_file, label_dict)
    print(f"Generated {len(graphs)} graphs.")
    
    # 可保存或进一步处理
    # for idx, (start, end, G) in enumerate(graphs):
    #     nx.write_gml(G, f"window_{idx}.gml")


```

### 输出说明：

- **NetworkX图**：可视化攻击行为的顺序与依赖关系；
    
- **PyG数据对象**：后续可以直接用于图神经网络训练；
    
- 节点属性在 `G.nodes[node]` 中；
    
- 可在 `x` 特征中加入时间、类型、阶段等真实特征。