# 前后端分离方案使用指南

## 快速开始

### 方式1：使用启动脚本（推荐）

```bash
./start.sh
```

脚本会自动：
1. 检查并安装依赖
2. 启动后端API服务（端口3001）
3. 启动前端开发服务器（端口5173）

### 方式2：手动启动

#### 1. 启动后端服务

```bash
cd server
npm install
npm start
```

后端服务将在 `http://localhost:3001` 启动

#### 2. 启动前端服务

在项目根目录：

```bash
npm install
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

## 架构说明

### 后端服务 (`server/`)

- **技术栈**: Node.js + Express
- **功能**: 
  - 数据转换和预处理
  - 按需过滤和分页
  - 数据缓存（5分钟）
- **端口**: 3001

### 前端应用 (`src/`)

- **技术栈**: Vue 3 + Vite + G6
- **功能**: 
  - 图谱可视化
  - 用户交互
  - API调用

## API 端点

### 1. 获取图谱数据

```
GET /api/graph/data?aptIds=Sandworm,Lazarus&nodeTypes=APT,Target,Tool
```

### 2. 获取APT关联数据

```
GET /api/graph/apt/Sandworm/relations?nodeTypes=Target,Tool
```

### 3. 搜索节点

```
GET /api/graph/search?q=Sandworm
```

### 4. 获取统计信息

```
GET /api/graph/stats
```

## 性能优势

1. **数据预处理**: 后端一次性转换数据，前端直接使用
2. **按需加载**: 只加载需要的节点和边
3. **数据缓存**: 转换结果缓存5分钟，减少重复计算
4. **分页支持**: 支持大数据量的分页加载

## 故障排查

### 问题：页面显示"后端API服务未启动"

**解决方案：**
1. 检查后端服务是否运行：`curl http://localhost:3001/api/health`
2. 如果未运行，启动后端：`cd server && npm start`
3. 检查端口3001是否被占用

### 问题：CORS错误

**解决方案：**
后端已配置CORS，如果仍有问题，检查：
1. 前端请求的URL是否正确
2. 后端服务是否正常运行

### 问题：数据加载慢

**解决方案：**
1. 首次加载会转换数据，稍慢是正常的
2. 后续请求会使用缓存，速度更快
3. 可以通过 `limit` 参数限制返回数量

## 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```
VITE_API_BASE_URL=http://localhost:3001/api
```

## 开发建议

1. **开发环境**: 使用 `npm run dev`（后端）和 `npm run dev`（前端）
2. **生产环境**: 构建前端 `npm run build`，后端使用 PM2 等进程管理器
3. **API调试**: 使用 Postman 或 curl 测试API端点
