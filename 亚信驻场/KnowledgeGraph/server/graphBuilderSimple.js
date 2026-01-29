/**
 * graphBuilderSimple.js - 简化的图谱构建器（Node.js环境）
 * 
 * 从剧本数据构建中心辐射式知识图谱
 */

const fs = require('fs').promises
const path = require('path')

// 缓存数据
let aptOrganizations = null
let attackMethods = null
let attackWeapons = null
let powerAssets = null
let allScenarios = null

/**
 * 加载数据文件（从JS文件提取数据）
 */
async function loadData() {
  if (aptOrganizations && attackMethods && attackWeapons && powerAssets) {
    return // 已加载
  }
  
  try {
    // 读取并解析数据文件
    const aptOrgsContent = await fs.readFile(
      path.join(__dirname, '..', 'src', 'data', 'aptOrganizations.js'),
      'utf8'
    )
    const methodsContent = await fs.readFile(
      path.join(__dirname, '..', 'src', 'data', 'attackMethods.js'),
      'utf8'
    )
    const weaponsContent = await fs.readFile(
      path.join(__dirname, '..', 'src', 'data', 'attackWeapons.js'),
      'utf8'
    )
    const assetsContent = await fs.readFile(
      path.join(__dirname, '..', 'src', 'data', 'powerAssets.js'),
      'utf8'
    )
    
    // 使用eval提取数据（注意：生产环境应使用更安全的方式）
    // 这里简化处理，直接eval export的内容
    eval(aptOrgsContent.replace('export const', 'aptOrganizations ='))
    eval(methodsContent.replace('export const', 'attackMethods ='))
    eval(weaponsContent.replace('export const', 'attackWeapons ='))
    eval(assetsContent.replace('export const', 'powerAssets ='))
    
    // 生成场景数据
    const scenariosContent = await fs.readFile(
      path.join(__dirname, '..', 'src', 'data', 'generateScenarios.js'),
      'utf8'
    )
    // 提取generateAttackScenarios函数
    const scenariosModule = scenariosContent
      .replace('export function', 'function')
      .replace(/import.*?from.*?;/g, '')
    eval(scenariosModule)
    allScenarios = generateAttackScenarios()
    
  } catch (error) {
    console.error('加载数据失败:', error)
    throw error
  }
}

/**
 * 根据APT组织ID从剧本数据构建中心辐射式图谱
 */
async function buildScenarioGraph(aptIds, filters = {}) {
  await loadData()
  
  if (!aptIds || aptIds.length === 0) {
    return { nodes: [], links: [] }
  }

  // 过滤剧本
  let filteredScenarios = allScenarios.filter(s => aptIds.includes(s.aptId))
  
  // 应用阶段过滤
  if (filters.phases && filters.phases.length > 0) {
    filteredScenarios = filteredScenarios.filter(s => filters.phases.includes(s.phase))
  }
  
  // 应用资产类型过滤
  if (filters.assetCategories && filters.assetCategories.length > 0) {
    filteredScenarios = filteredScenarios.filter(s => {
      const asset = powerAssets.find(a => a.label === s.target)
      return asset && filters.assetCategories.includes(asset.category)
    })
  }
  
  if (filteredScenarios.length === 0) {
    return { nodes: [], links: [] }
  }

  // 构建节点
  const nodes = []
  const nodeMap = new Map()
  
  // 1. APT节点（中心）
  aptIds.forEach(aptId => {
    const apt = aptOrganizations.find(a => a.id === aptId)
    if (apt) {
      nodes.push({
        id: aptId,
        type: 'APT',
        name: apt.label || apt.name,
        meta: {
          ...apt,
          scenarioCount: filteredScenarios.filter(s => s.aptId === aptId).length
        }
      })
      nodeMap.set(aptId, 'APT')
    }
  })
  
  // 2. 提取方法、武器、目标
  const methodSet = new Set()
  const weaponSet = new Set()
  const targetSet = new Set()
  
  filteredScenarios.forEach(scenario => {
    scenario.methods.forEach(m => methodSet.add(m))
    scenario.weapons.forEach(w => weaponSet.add(w))
    if (scenario.target) targetSet.add(scenario.target)
  })
  
  // 3. 添加方法节点
  methodSet.forEach(methodId => {
    const method = attackMethods.find(m => m.id === methodId)
    if (method && !nodeMap.has(methodId)) {
      nodes.push({
        id: methodId,
        type: 'Technique',
        name: method.label || method.name,
        meta: { ...method, mitreId: method.name || methodId }
      })
      nodeMap.set(methodId, 'Technique')
    }
  })
  
  // 4. 添加武器节点
  weaponSet.forEach(weaponId => {
    const weapon = attackWeapons.find(w => w.id === weaponId)
    if (weapon && !nodeMap.has(weaponId)) {
      nodes.push({
        id: weaponId,
        type: 'Tool',
        name: weapon.label || weapon.name,
        meta: { ...weapon }
      })
      nodeMap.set(weaponId, 'Tool')
    }
  })
  
  // 5. 添加目标节点
  targetSet.forEach(targetName => {
    const targetId = `TARGET-${targetName}`
    if (!nodeMap.has(targetId)) {
      const asset = powerAssets.find(a => a.label === targetName)
      nodes.push({
        id: targetId,
        type: 'Target',
        name: targetName,
        meta: {
          category: asset?.category || 'unknown',
          originalName: targetName
        }
      })
      nodeMap.set(targetId, 'Target')
    }
  })
  
  // 构建边
  const links = []
  const linkSet = new Set()
  const relationCounts = new Map()
  
  filteredScenarios.forEach(scenario => {
    const aptId = scenario.aptId
    
    // APT -> Technique
    scenario.methods.forEach(methodId => {
      const key = `${aptId}->uses->${methodId}`
      if (!linkSet.has(key)) {
        links.push({ source: aptId, target: methodId, relation: 'uses' })
        linkSet.add(key)
      }
      relationCounts.set(key, (relationCounts.get(key) || 0) + 1)
    })
    
    // APT -> Tool
    scenario.weapons.forEach(weaponId => {
      const key = `${aptId}->uses->${weaponId}`
      if (!linkSet.has(key)) {
        links.push({ source: aptId, target: weaponId, relation: 'uses' })
        linkSet.add(key)
      }
      relationCounts.set(key, (relationCounts.get(key) || 0) + 1)
    })
    
    // APT -> Target
    if (scenario.target) {
      const targetId = `TARGET-${scenario.target}`
      const key = `${aptId}->targets->${targetId}`
      if (!linkSet.has(key)) {
        links.push({ source: aptId, target: targetId, relation: 'targets' })
        linkSet.add(key)
      }
      relationCounts.set(key, (relationCounts.get(key) || 0) + 1)
    }
    
    // Technique -> Target
    scenario.methods.forEach(methodId => {
      if (scenario.target) {
        const targetId = `TARGET-${scenario.target}`
        const key = `${methodId}->exploits->${targetId}`
        if (!linkSet.has(key)) {
          links.push({ source: methodId, target: targetId, relation: 'exploits' })
          linkSet.add(key)
        }
      }
    })
    
    // Tool -> Target
    scenario.weapons.forEach(weaponId => {
      if (scenario.target) {
        const targetId = `TARGET-${scenario.target}`
        const key = `${weaponId}->attacks->${targetId}`
        if (!linkSet.has(key)) {
          links.push({ source: weaponId, target: targetId, relation: 'attacks' })
          linkSet.add(key)
        }
      }
    })
  })
  
  // 添加权重
  links.forEach(link => {
    const key = `${link.source}->${link.relation}->${link.target}`
    link.weight = relationCounts.get(key) || 1
  })
  
  return { nodes, links }
}

module.exports = { buildScenarioGraph }
