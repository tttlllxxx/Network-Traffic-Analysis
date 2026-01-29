# 图谱数据 API 服务

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 启动服务

```bash
npm start
```

或者使用 nodemon 进行开发（自动重启）：

```bash
npm run dev
```

服务将在 `http://localhost:3001` 启动

## API 端点

### 1. 获取图谱数据

```
GET /api/graph/data
```

**查询参数：**
- `aptIds` (可选): APT组织ID列表，逗号分隔
- `nodeTypes` (可选): 节点类型列表，逗号分隔，如 `APT,Target,Tool`
- `limit` (可选): 返回节点数量限制，默认返回全部
- `offset` (可选): 偏移量，用于分页

**示例：**
```
GET /api/graph/data?aptIds=Sandworm,Lazarus&nodeTypes=APT,Target,Tool&limit=100
```

**响应：**
```json
{
  "nodes": [...],
  "links": [...],
  "total": 411,
  "hasMore": false
}
```

### 2. 获取APT关联数据

```
GET /api/graph/apt/:aptId/relations
```

**查询参数：**
- `depth` (可选): 关联深度，默认1
- `nodeTypes` (可选): 节点类型过滤

**示例：**
```
GET /api/graph/apt/Sandworm/relations?nodeTypes=Target,Tool
```

### 3. 搜索节点

```
GET /api/graph/search?q=关键词&type=APT
```

### 4. 获取统计信息

```
GET /api/graph/stats
```

### 5. 健康检查

```
GET /api/health
```

## 性能优化

- **数据缓存**: 转换后的数据缓存5分钟，避免重复处理
- **按需过滤**: 只返回符合条件的数据
- **分页支持**: 支持 limit 和 offset 参数

## 环境变量

可以通过环境变量配置端口：

```bash
PORT=3001 npm start
```

## 注意事项

1. 确保 `../src/data/realGraphData.json` 文件存在
2. 服务启动时会加载并转换数据，首次请求可能稍慢
3. 数据缓存5分钟，修改数据文件后需要重启服务
