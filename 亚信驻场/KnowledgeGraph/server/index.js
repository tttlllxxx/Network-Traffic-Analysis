/**
 * 后端 API 服务
 * 
 * 使用 Express 提供图谱数据 API
 * 功能：
 * - 数据转换和预处理
 * - 按需过滤和分页
 * - 缓存优化
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs').promises

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())

// 导入图谱构建函数
// const { buildScenarioGraph } = require('./graphBuilder.js') // 实时生成已注释

/**
 * 将原始节点类型映射到标准类型
 */
function mapNodeType(originalType) {
  const typeMap = {
    'apt': 'APT',
    'target': 'Target',
    'weapon': 'Tool',
    'method': 'Technique',
    'alias': 'Support',
    'vuln': 'Support',
    'other': 'Support'
  }
  return typeMap[originalType] || 'Support'
}

/**
 * 加载并转换图谱数据
 */
async function loadAndConvertGraphData() {
  try {
    // 读取原始数据文件
    // 从 server 目录向上两级，然后进入 src/data
    const dataPath = path.join(__dirname, '..', 'src', 'data', 'realGraphData.json')
    console.log('读取数据文件:', dataPath)
    
    // 检查文件是否存在
    try {
      await fs.access(dataPath)
    } catch (error) {
      throw new Error(`数据文件不存在: ${dataPath}`)
    }
    
    const rawData = JSON.parse(await fs.readFile(dataPath, 'utf8'))
    console.log('数据文件读取成功，节点数:', rawData.nodes?.length || 0, '边数:', rawData.edges?.length || 0)
    
    // 转换节点
    const nodes = rawData.nodes.map(node => ({
      id: node.id,
      type: mapNodeType(node.type || node.dataType || 'other'),
      name: node.label || node.name || node.id,
      meta: {
        originalColor: node.data?.originalColor || node.style?.fill,
        originalType: node.type || node.dataType,
        ...(node.data || {})
      }
    }))
    
    // 转换边（edges -> links）
    const links = rawData.edges.map(edge => ({
      source: edge.source || edge.from,
      target: edge.target || edge.to,
      relation: edge.label || edge.relation || 'related'
    }))
    
    return { nodes, links }
  } catch (error) {
    console.error('加载图谱数据失败:', error)
    throw error
  }
}

/**
 * 获取图谱数据（带缓存）
 */
async function getGraphData() {
  const now = Date.now()
  
  // 如果缓存有效，直接返回
  if (cachedGraphData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedGraphData
  }
  
  // 重新加载数据
  cachedGraphData = await loadAndConvertGraphData()
  cacheTimestamp = now
  
  return cachedGraphData
}

/**
 * 根据APT ID过滤图谱数据
 */
function filterByAPT(aptIds, graphData) {
  if (!aptIds || aptIds.length === 0) {
    return graphData
  }

  const aptIdSet = new Set(aptIds)
  const relatedNodeIds = new Set()
  
  // 添加APT节点
  graphData.nodes.forEach(node => {
    if (node.type === 'APT' && aptIdSet.has(node.id)) {
      relatedNodeIds.add(node.id)
    }
  })

  // 通过边找到所有关联节点
  let changed = true
  while (changed) {
    changed = false
    graphData.links.forEach(link => {
      if (relatedNodeIds.has(link.source) && !relatedNodeIds.has(link.target)) {
        relatedNodeIds.add(link.target)
        changed = true
      }
      if (relatedNodeIds.has(link.target) && !relatedNodeIds.has(link.source)) {
        relatedNodeIds.add(link.source)
        changed = true
      }
    })
  }

  // 过滤节点和边
  const filteredNodes = graphData.nodes.filter(node => relatedNodeIds.has(node.id))
  const filteredLinks = graphData.links.filter(link => 
    relatedNodeIds.has(link.source) && relatedNodeIds.has(link.target)
  )

  return {
    nodes: filteredNodes,
    links: filteredLinks
  }
}

/**
 * 根据节点类型过滤
 */
function filterByNodeTypes(nodeTypes, graphData) {
  if (!nodeTypes || nodeTypes.length === 0) {
    return graphData
  }
  
  const typeSet = new Set(nodeTypes)
  const filteredNodes = graphData.nodes.filter(node => typeSet.has(node.type))
  const nodeIdSet = new Set(filteredNodes.map(n => n.id))
  
  const filteredLinks = graphData.links.filter(link =>
    nodeIdSet.has(link.source) && nodeIdSet.has(link.target)
  )
  
  return {
    nodes: filteredNodes,
    links: filteredLinks
  }
}

// ========== API 路由 ==========

/**
 * GET /api/graph/data
 * 根据APT组织从剧本数据构建中心辐射式图谱
 * 实时生成功能已注释
 */
/*
app.get('/api/graph/data', async (req, res) => {
  try {
    const { aptIds, nodeTypes, phases, assetCategories } = req.query
    
    // 必须提供APT组织ID
    if (!aptIds) {
      return res.json({
        nodes: [],
        links: [],
        total: 0,
        hasMore: false
      })
    }
    
    // 解析参数
    const aptIdArray = Array.isArray(aptIds) ? aptIds : aptIds.split(',').filter(Boolean)
    const filters = {}
    
    if (phases) {
      filters.phases = Array.isArray(phases) ? phases : phases.split(',').filter(Boolean)
    }
    
    if (assetCategories) {
      filters.assetCategories = Array.isArray(assetCategories) 
        ? assetCategories 
        : assetCategories.split(',').filter(Boolean)
    }
    
    // 从剧本数据构建图谱
    const graphData = await buildScenarioGraph(aptIdArray, filters)
    
    // 节点类型过滤
    let filteredNodes = graphData.nodes
    if (nodeTypes) {
      const typeArray = Array.isArray(nodeTypes) ? nodeTypes : nodeTypes.split(',').filter(Boolean)
      filteredNodes = graphData.nodes.filter(node => typeArray.includes(node.type))
    }
    
    // 过滤边（只保留过滤后节点之间的边）
    const nodeIdSet = new Set(filteredNodes.map(n => n.id))
    const filteredLinks = graphData.links.filter(link =>
      nodeIdSet.has(link.source) && nodeIdSet.has(link.target)
    )
    
    res.json({
      nodes: filteredNodes,
      links: filteredLinks,
      total: filteredNodes.length,
      hasMore: false
    })
  } catch (error) {
    console.error('获取图谱数据失败:', error)
    res.status(500).json({ error: '获取图谱数据失败', message: error.message })
  }
})
*/

/**
 * GET /api/graph/apt/:aptId/relations
 * 获取指定APT的关联数据
 */
app.get('/api/graph/apt/:aptId/relations', async (req, res) => {
  try {
    const { aptId } = req.params
    const { depth = 1, nodeTypes } = req.query
    
    const fullData = await getGraphData()
    const filteredData = filterByAPT([aptId], fullData)
    
    // 节点类型过滤
    let result = filteredData
    if (nodeTypes) {
      const typeArray = Array.isArray(nodeTypes) ? nodeTypes : nodeTypes.split(',')
      result = filterByNodeTypes(typeArray, filteredData)
    }
    
    res.json({
      nodes: result.nodes,
      links: result.links
    })
  } catch (error) {
    console.error('获取APT关联数据失败:', error)
    res.status(500).json({ error: '获取APT关联数据失败', message: error.message })
  }
})

/**
 * GET /api/graph/search
 * 搜索节点
 */
app.get('/api/graph/search', async (req, res) => {
  try {
    const { q, type } = req.query
    
    if (!q) {
      return res.json({ nodes: [] })
    }
    
    const fullData = await getGraphData()
    const query = q.toLowerCase()
    
    let results = fullData.nodes.filter(node => {
      const matchesQuery = node.name.toLowerCase().includes(query) || 
                          node.id.toLowerCase().includes(query)
      const matchesType = !type || node.type === type
      return matchesQuery && matchesType
    })
    
    // 限制返回数量
    results = results.slice(0, 50)
    
    res.json({ nodes: results })
  } catch (error) {
    console.error('搜索节点失败:', error)
    res.status(500).json({ error: '搜索节点失败', message: error.message })
  }
})

/**
 * GET /api/graph/stats
 * 获取图谱统计信息
 */
app.get('/api/graph/stats', async (req, res) => {
  try {
    const fullData = await getGraphData()
    
    const stats = {
      totalNodes: fullData.nodes.length,
      totalLinks: fullData.links.length,
      nodesByType: {}
    }
    
    fullData.nodes.forEach(node => {
      const type = node.type || 'Unknown'
      stats.nodesByType[type] = (stats.nodesByType[type] || 0) + 1
    })
    
    res.json(stats)
  } catch (error) {
    console.error('获取统计信息失败:', error)
    res.status(500).json({ error: '获取统计信息失败', message: error.message })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`图谱数据 API 服务运行在 http://localhost:${PORT}`)
  console.log(`API 端点:`)
  console.log(`  GET /api/graph/data - 获取图谱数据`)
  console.log(`  GET /api/graph/apt/:aptId/relations - 获取APT关联数据`)
  console.log(`  GET /api/graph/search - 搜索节点`)
  console.log(`  GET /api/graph/stats - 获取统计信息`)
})
