/**
 * 生成攻击剧本数据
 * 
 * 数据来源：
 * - 剧本1000目录：包含1000个真实攻击剧本的JSON文件
 * - 图谱15目录：包含15个APT知识图谱的HTML文件
 * 
 * 注意：由于浏览器环境限制，真实剧本数据需要通过其他方式加载
 * 当前实现保持原有逻辑，但添加了注释说明数据来源
 */

import { aptOrganizations } from './aptOrganizations.js'
import { attackMethods } from './attackMethods.js'
import { attackWeapons } from './attackWeapons.js'
import { powerAssets } from './powerAssets.js'

// 攻击阶段（MITRE ATT&CK标准阶段）
const attackPhases = [
  'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 
  'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
  'Collection', 'Command and Control', 'Exfiltration', 'Impact'
]

// 阶段映射：将中文阶段映射到MITRE ATT&CK阶段
const stageMapping = {
  '侦察': 'Discovery',
  '初始访问': 'Initial Access',
  '执行': 'Execution',
  '持久化': 'Persistence',
  '权限提升': 'Privilege Escalation',
  '防御规避': 'Defense Evasion',
  '凭证访问': 'Credential Access',
  '发现': 'Discovery',
  '横向移动': 'Lateral Movement',
  '收集': 'Collection',
  'C2': 'Command and Control',
  '命令与控制': 'Command and Control',
  '数据渗出': 'Exfiltration',
  '外泄': 'Exfiltration',
  '影响': 'Impact'
}

// 使用powerAssets的label作为目标
const powerTargets = powerAssets.map(asset => asset.label)

/**
 * 生成攻击剧本
 * 
 * 说明：
 * - 当前实现为生成式逻辑，用于开发测试
 * - 真实数据来源：/Users/tlx/Network-Traffic-Analysis-master/亚信驻场/剧本1000/
 * - 真实数据包含1000个剧本，每个剧本包含详细的stages、technique、tool等信息
 * - 如需使用真实数据，需要将剧本1000目录的JSON文件复制到public目录，然后通过fetch加载
 * 
 * @returns {Array} 攻击剧本数组
 */
/**
 * 确定性哈希函数（用于生成固定的"伪随机"值）
 * 基于输入值生成0-1之间的固定值
 */
function deterministicHash(seed) {
  let hash = 0
  const str = String(seed)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // 转换为0-1之间的值
  return Math.abs(hash) / 2147483647
}

export function generateAttackScenarios() {
  const scenarios = []
  let scenarioId = 1

  // 为每个APT组织生成多个攻击剧本
  aptOrganizations.forEach((apt, aptIndex) => {
    // 每个组织生成60-70个剧本，确保总数超过1000
    const scenariosPerAPT = 60 + (aptIndex % 10)
    
    for (let i = 0; i < scenariosPerAPT; i++) {
      // 使用确定性哈希选择攻击方法（1-3个）
      // 基于 aptIndex, i, scenarioId 生成固定种子
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

      // 使用确定性哈希选择攻击武器（1-2个）
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

      // 使用确定性哈希选择目标和阶段
      const seed5 = `${aptIndex}-${i}-${scenarioId}-target`
      const targetIndex = Math.floor(deterministicHash(seed5) * powerTargets.length)
      const target = powerTargets[targetIndex]
      
      const seed6 = `${aptIndex}-${i}-${scenarioId}-phase`
      const phaseIndex = Math.floor(deterministicHash(seed6) * attackPhases.length)
      const phase = attackPhases[phaseIndex]

      // 对方法ID和武器ID进行排序，确保顺序一致
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

  // 按ID排序，确保每次顺序一致
  return scenarios.sort((a, b) => a.id.localeCompare(b.id))
}
