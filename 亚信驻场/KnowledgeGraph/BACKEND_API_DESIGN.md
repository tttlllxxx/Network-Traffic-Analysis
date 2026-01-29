# 前后端分离方案设计

如果 Web Worker 方案仍然不够，可以考虑前后端分离。

## 后端 API 设计

### 1. 获取图谱数据（分页/过滤）

```
GET /api/graph/data
Query Parameters:
  - aptIds: string[] (可选) - APT组织ID列表
  - nodeTypes: string[] (可选) - 节点类型过滤 ['APT', 'Target', 'Tool']
  - limit: number (可选) - 返回节点数量限制，默认100
  - offset: number (可选) - 偏移量，用于分页

Response:
{
  nodes: Node[],
  links: Link[],
  total: number,
  hasMore: boolean
}
```

### 2. 获取APT关联数据

```
GET /api/graph/apt/:aptId/relations
Query Parameters:
  - depth: number (可选) - 关联深度，默认1（只返回直接关联）
  - nodeTypes: string[] (可选) - 节点类型过滤

Response:
{
  nodes: Node[],
  links: Link[]
}
```

### 3. 搜索节点

```
GET /api/graph/search
Query Parameters:
  - q: string - 搜索关键词
  - type: string (可选) - 节点类型过滤

Response:
{
  nodes: Node[]
}
```

## 实现建议

### 后端技术栈
- Node.js + Express 或 Python + FastAPI
- 使用数据库存储图谱数据（Neo4j、MongoDB 或 PostgreSQL）
- 实现数据缓存（Redis）

### 前端调用示例

```javascript
// 在 graphDataConverter.js 中添加
export async function fetchGraphDataFromAPI(params = {}) {
  const queryString = new URLSearchParams({
    ...params,
    aptIds: params.aptIds?.join(',') || ''
  }).toString()
  
  const response = await fetch(`/api/graph/data?${queryString}`)
  return await response.json()
}
```

## 优势

1. **性能更好**：后端可以预处理和缓存数据
2. **可扩展**：支持更复杂的查询和过滤
3. **数据安全**：敏感数据不暴露在前端
4. **实时更新**：可以从数据库实时获取最新数据

## 劣势

1. **需要后端服务**：增加开发和维护成本
2. **网络延迟**：需要等待API响应
3. **部署复杂**：需要部署后端服务
