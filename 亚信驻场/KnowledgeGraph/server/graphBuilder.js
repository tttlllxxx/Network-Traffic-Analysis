/**
 * graphBuilder.js - 图谱构建器（Node.js环境）
 * 
 * 从剧本数据构建中心辐射式知识图谱
 * 使用require直接加载JS文件（需要转换为CommonJS格式）
 */

const fs = require('fs').promises
const path = require('path')
const vm = require('vm')

// 缓存数据
let aptOrganizations = null
let attackMethods = null
let attackWeapons = null
let powerAssets = null
let allScenarios = null

/**
 * 安全地执行JS代码并提取数据
 */
function extractDataFromJS(filePath, varName) {
  return fs.readFile(filePath, 'utf8').then(content => {
    // 创建沙箱环境
    const sandbox = {
      module: { exports: {} },
      exports: {},
      require: (module) => {
        // 处理相对路径导入
        if (module.startsWith('./') || module.startsWith('../')) {
          // 简化处理：只处理已知的数据文件
          if (module.includes('aptOrganizations')) {
            return { aptOrganizations: [] }
          }
          if (module.includes('attackMethods')) {
            return { attackMethods: [] }
          }
          if (module.includes('attackWeapons')) {
            return { attackWeapons: [] }
          }
          if (module.includes('powerAssets')) {
            return { powerAssets: [] }
          }
        }
        return {}
      }
    }
    
    // 修改代码：将export const改为var
    const modifiedContent = content
      .replace(/export const/g, 'var')
      .replace(/export function/g, 'function')
      .replace(/import.*?from.*?['\"].*?['\"];?/g, '')
    
    try {
      vm.createContext(sandbox)
      vm.runInContext(modifiedContent, sandbox)
      
      // 从沙箱中提取数据
      return sandbox[varName] || []
    } catch (error) {
      console.error(`提取 ${varName} 失败:`, error)
      return []
    }
  })
}

/**
 * 加载所有数据
 */
async function loadData() {
  if (aptOrganizations && attackMethods && attackWeapons && powerAssets) {
    return // 已加载
  }
  
  try {
    const basePath = path.join(__dirname, '..', 'src', 'data')
    
    // 使用JSON.parse直接读取（如果数据是JSON格式）
    // 或者使用更简单的方法：直接require（需要将文件改为.cjs）
    // 这里我们使用一个更直接的方法：读取并解析
    
    // 读取aptOrganizations - 使用更可靠的正则匹配（支持多行）
    const aptContent = await fs.readFile(path.join(basePath, 'aptOrganizations.js'), 'utf8')
    // 匹配 export const aptOrganizations = [...]（包括多行）
    const aptMatch = aptContent.match(/export const aptOrganizations\s*=\s*(\[[\s\S]*?\]);?\s*$/)
    if (aptMatch && aptMatch[1]) {
      try {
        // 尝试JSON解析
        aptOrganizations = JSON.parse(aptMatch[1])
      } catch (e) {
        // 如果JSON解析失败，使用eval（因为JS对象可能包含单引号等）
        try {
          aptOrganizations = eval(`(${aptMatch[1]})`)
        } catch (e2) {
          console.error('解析aptOrganizations失败:', e2)
          aptOrganizations = []
        }
      }
    } else {
      console.warn('未找到aptOrganizations数据')
      aptOrganizations = []
    }
    
    // 读取attackMethods
    const methodsContent = await fs.readFile(path.join(basePath, 'attackMethods.js'), 'utf8')
    const methodsMatch = methodsContent.match(/export const attackMethods\s*=\s*(\[[\s\S]*?\]);?\s*$/)
    if (methodsMatch && methodsMatch[1]) {
      try {
        attackMethods = JSON.parse(methodsMatch[1])
      } catch (e) {
        try {
          attackMethods = eval(`(${methodsMatch[1]})`)
        } catch (e2) {
          console.error('解析attackMethods失败:', e2)
          attackMethods = []
        }
      }
    } else {
      attackMethods = []
    }
    
    // 读取attackWeapons
    const weaponsContent = await fs.readFile(path.join(basePath, 'attackWeapons.js'), 'utf8')
    const weaponsMatch = weaponsContent.match(/export const attackWeapons\s*=\s*(\[[\s\S]*?\]);?\s*$/)
    if (weaponsMatch && weaponsMatch[1]) {
      try {
        attackWeapons = JSON.parse(weaponsMatch[1])
      } catch (e) {
        try {
          attackWeapons = eval(`(${weaponsMatch[1]})`)
        } catch (e2) {
          console.error('解析attackWeapons失败:', e2)
          attackWeapons = []
        }
      }
    } else {
      attackWeapons = []
    }
    
    // 读取powerAssets
    const assetsContent = await fs.readFile(path.join(basePath, 'powerAssets.js'), 'utf8')
    const assetsMatch = assetsContent.match(/export const powerAssets\s*=\s*(\[[\s\S]*?\]);?\s*$/)
    if (assetsMatch && assetsMatch[1]) {
      try {
        powerAssets = JSON.parse(assetsMatch[1])
      } catch (e) {
        try {
          powerAssets = eval(`(${assetsMatch[1]})`)
        } catch (e2) {
          console.error('解析powerAssets失败:', e2)
          powerAssets = []
        }
      }
    } else {
      powerAssets = []
    }
    
    // 生成场景数据（使用确定性哈希函数）
    const scenariosContent = await fs.readFile(path.join(basePath, 'generateScenarios.js'), 'utf8')
    
    // 提取generateAttackScenarios函数并执行
    // 这里简化处理，直接调用函数逻辑
    allScenarios = await generateScenarios()
    
    console.log('数据加载完成:', {
      apts: aptOrganizations?.length || 0,
      methods: attackMethods?.length || 0,
      weapons: attackWeapons?.length || 0,
      assets: powerAssets?.length || 0
    })
    
  } catch (error) {
    console.error('加载数据失败:', error)
    throw error
  }
}

/**
 * 确定性哈希函数
 */
function deterministicHash(seed) {
  let hash = 0
  const str = String(seed)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) / 2147483647
}

/**
 * 生成攻击场景
 */
async function generateScenarios() {
  await loadData()
  
  const scenarios = []
  let scenarioId = 1
  
  const attackPhases = [
    'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 
    'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
    'Collection', 'Command and Control', 'Exfiltration', 'Impact'
  ]
  
  const powerTargets = powerAssets.map(asset => asset.label)
  
  aptOrganizations.forEach((apt, aptIndex) => {
    const scenariosPerAPT = 60 + (aptIndex % 10)
    
    for (let i = 0; i < scenariosPerAPT; i++) {
      const seed1 = `${aptIndex}-${i}-${scenarioId}-methods`
      const methodCount = Math.floor(deterministicHash(seed1) * 3) + 1
      const selectedMethods = []
      for (let j = 0; j < methodCount; j++) {
        const seed2 = `${seed1}-${j}`
        const methodIndex = Math.floor(deterministicHash(seed2) * attackMethods.length)
        const method = attackMethods[methodIndex]
        if (!selectedMethods.find(m => m.id === method.id)) {
          selectedMethods.push(method)
        }
      }
      
      const seed3 = `${aptIndex}-${i}-${scenarioId}-weapons`
      const weaponCount = Math.floor(deterministicHash(seed3) * 2) + 1
      const selectedWeapons = []
      for (let j = 0; j < weaponCount; j++) {
        const seed4 = `${seed3}-${j}`
        const weaponIndex = Math.floor(deterministicHash(seed4) * attackWeapons.length)
        const weapon = attackWeapons[weaponIndex]
        if (!selectedWeapons.find(w => w.id === weapon.id)) {
          selectedWeapons.push(weapon)
        }
      }
      
      const seed5 = `${aptIndex}-${i}-${scenarioId}-target`
      const targetIndex = Math.floor(deterministicHash(seed5) * powerTargets.length)
      const target = powerTargets[targetIndex]
      
      const seed6 = `${aptIndex}-${i}-${scenarioId}-phase`
      const phaseIndex = Math.floor(deterministicHash(seed6) * attackPhases.length)
      const phase = attackPhases[phaseIndex]
      
      const sortedMethodIds = selectedMethods.map(m => m.id).sort()
      const sortedWeaponIds = selectedWeapons.map(w => w.id).sort()
      
      scenarios.push({
        id: `SCENARIO-${String(scenarioId).padStart(4, '0')}`,
        name: `${apt.name}攻击剧本-${scenarioId}`,
        type: 'scenario',
        label: `剧本${scenarioId}`,
        aptId: apt.id,
        methods: sortedMethodIds,
        weapons: sortedWeaponIds,
        target: target,
        phase: phase,
        description: `${apt.name}组织使用${selectedMethods.map(m => m.name || m.label).join('、')}技术，通过${selectedWeapons.map(w => w.label).join('、')}工具，针对${target}进行${phase}阶段攻击`
      })
      
      scenarioId++
    }
  })
  
  return scenarios.sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * 根据APT组织ID从剧本数据构建中心辐射式图谱
 * 实时生成功能已注释
 */
/*
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
*/

module.exports = { loadData } // buildScenarioGraph 已注释
