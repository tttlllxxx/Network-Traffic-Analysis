// 图谱数据管理器 - 支持按需加载
import { aptOrganizations } from './aptOrganizations.js'
import { attackMethods } from './attackMethods.js'
import { attackWeapons } from './attackWeapons.js'
import { powerAssets } from './powerAssets.js'
import { generateAttackScenarios } from './generateScenarios.js'

// 缓存所有场景数据；当 aptOrganizations 的 id/label 变化时失效
let allScenarios = null
let cachedAptSignature = null

function getAptSignature() {
  return JSON.stringify(aptOrganizations.map(a => ({ id: a.id, label: a.label, name: a.name })))
}

// 获取所有场景；若 aptOrganizations 已变更则重新生成
function getAllScenarios() {
  const sig = getAptSignature()
  if (!allScenarios || cachedAptSignature !== sig) {
    cachedAptSignature = sig
    allScenarios = generateAttackScenarios()
  }
  return allScenarios
}

/**
 * 获取攻击剧本聚合数据（状态驱动）
 * 
 * 核心原则：
 * - 此函数完全由筛选条件状态驱动，不依赖任何用户交互事件
 * - 当筛选条件变化时，调用此函数会返回基于新状态的聚合结果
 * - 所有筛选条件都是 AND 逻辑（必须同时满足）
 * - 未被选中的 APT/资产类型的剧本不会出现在聚合结果中
 * 
 * 状态驱动流程：
 * 1. 用户在 FilterPanel 中勾选/取消复选框
 * 2. FilterPanel 发送 filter-change 事件
 * 3. APTKnowledgeGraph 更新 filters 状态
 * 4. ScenarioAggregationView.aggregations computed 自动调用此函数
 * 5. 返回基于当前筛选条件的聚合结果
 * 6. 聚合视图自动更新显示
 * 
 * @param {Object} filters - 筛选条件对象（来自全局 filters 状态）
 * @param {Array<string>} filters.aptIds - APT组织ID列表（空数组表示不过滤，显示所有）
 * @param {Array<string>} filters.assetCategories - 资产类型列表（空数组表示不过滤，显示所有）
 * @returns {Object} 聚合结果 { byAPTAsset: [] }
 */
export function getScenarioAggregations(filters = {}) {
  // 获取所有攻击剧本（数据源）
  const scenarios = getAllScenarios()
  let filteredScenarios = scenarios
  
  // ========== 状态驱动的实时过滤 ==========
  // 注意：空数组表示"不过滤"（显示所有），有值才进行过滤
  // 所有筛选条件都是 AND 逻辑，必须同时满足
  
  // 应用APT过滤（实时）
  // 如果 aptIds 存在且长度 > 0，则只显示选中的APT组织的剧本
  if (filters.aptIds && Array.isArray(filters.aptIds) && filters.aptIds.length > 0) {
    filteredScenarios = filteredScenarios.filter(s => filters.aptIds.includes(s.aptId))
  }
  
  // 应用资产类型过滤（实时）
  // 如果 assetCategories 存在且长度 > 0，则只显示选中资产类型的剧本
  if (filters.assetCategories && Array.isArray(filters.assetCategories) && filters.assetCategories.length > 0) {
    filteredScenarios = filteredScenarios.filter(s => {
      const asset = powerAssets.find(a => a.label === s.target)
      return asset && filters.assetCategories.includes(asset.category)
    })
  }
  
  // 按APT+资产聚合
  const aptAssetMap = new Map()
  filteredScenarios.forEach(scenario => {
    const key = `${scenario.aptId}-${scenario.target}`
    if (!aptAssetMap.has(key)) {
      aptAssetMap.set(key, {
        aptId: scenario.aptId,
        asset: scenario.target,
        count: 0,
        scenarios: []
      })
    }
    const agg = aptAssetMap.get(key)
    agg.count++
    // 保存所有场景，不限制数量
    agg.scenarios.push(scenario)
  })
  
  // 对每个聚合项中的scenarios数组进行排序，确保顺序一致
  aptAssetMap.forEach((agg) => {
    agg.scenarios.sort((a, b) => a.id.localeCompare(b.id))
  })

  // 获取固定排序的APT组织顺序（按ID排序，确保每次顺序一致）
  const aptOrder = aptOrganizations.map(a => a.id)
  
  // 对按APT-资产聚合的结果进行排序
  const byAPTAsset = Array.from(aptAssetMap.values())
    .sort((a, b) => {
      // 先按APT顺序排序
      const aptIndexA = aptOrder.indexOf(a.aptId)
      const aptIndexB = aptOrder.indexOf(b.aptId)
      if (aptIndexA !== aptIndexB) {
        return aptIndexA - aptIndexB
      }
      // 如果APT相同，按资产名称排序（确保顺序一致）
      return a.asset.localeCompare(b.asset, 'zh-CN')
    })

  return {
    byAPTAsset
  }
}

// 获取统计信息
export function getStatistics() {
  const scenarios = getAllScenarios()
  return {
    aptCount: aptOrganizations.length,
    methodCount: attackMethods.length,
    weaponCount: attackWeapons.length,
    assetCount: powerAssets.length,
    scenarioCount: scenarios.length
  }
}
