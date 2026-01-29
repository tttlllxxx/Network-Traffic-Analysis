#!/bin/bash

# 启动脚本：同时启动前端和后端服务

echo "🚀 启动APT知识图谱应用..."

# 检查后端依赖
if [ ! -d "server/node_modules" ]; then
  echo "📦 安装后端依赖..."
  cd server
  npm install
  cd ..
fi

# 检查前端依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装前端依赖..."
  npm install
fi

# 启动后端服务（后台运行）
echo "🔧 启动后端API服务 (端口 3001)..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# 等待后端服务启动
sleep 3

# 启动前端服务
echo "🎨 启动前端开发服务器 (端口 5173)..."
npm run dev

# 清理：当脚本退出时停止后端服务
trap "kill $BACKEND_PID 2>/dev/null" EXIT
