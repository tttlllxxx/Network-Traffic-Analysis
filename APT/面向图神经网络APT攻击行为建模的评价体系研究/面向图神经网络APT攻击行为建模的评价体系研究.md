结合图神经网络（GNN）模型的优势，建立一套专门针对APT攻击行为建模的评价体系，以评估图神经网络在APT攻击识别中的表现和效果。
通过图神经网络对APT攻击行为进行建模，并构建一套**可闭环反馈优化**的评价体系，用于量化GNN模型在APT识别中的各维度表现，并将评价反馈用于改进模型设计与输入特征建构。

```
      [流量样本]
           ↓
    [日志行为图构建]
           ↓
      [图神经网络 GNN]
           ↓
┌──────────────────────────────┐
│ 输出1：是否为APT攻击（预测标签） │
│ 输出2：攻击阶段预测（阶段编号） │
│ 输出3：节点重要性解释（GNN attention）│
└──────────────────────────────┘
           ↓
     [多维度评价指标计算]
     （准确率、阶段识别、结构一致性）
           ↓
   [可信度反馈 / 可解释机制]
           ↓
[若表现不佳 → 优化图结构/特征/GNN参数]

```

示例输出
```json
{
  "is_apt": true,
  "attack_stage": ["Reconnaissance", "Lateral Movement"],
  "classification": {
    "accuracy": 0.91,
    "precision": 0.89,
    "recall": 0.94,
    "f1_score": 0.91
  },
  "graph_consistency_score": 0.86,
  "important_nodes": [12, 27, 33],  // attention分数高
  "confidence": 0.92,
  "explanation": "该流量中Node 27 出现横向登录行为，频繁连接多IP，与典型APT横向移动阶段一致"
}

```