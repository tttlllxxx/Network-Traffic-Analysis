<template>
  <div class="scenario-aggregation-view">
    <div class="view-header">
      <h3>攻击剧本聚合视图 <span class="scenario-count">（共 {{ totalScenarioCount }} 个剧本）</span></h3>
      <div class="header-actions">
        <!-- 应用筛选按钮：将左侧筛选条件应用到聚合列表（筛选APT组织和资产） -->
        <button class="apply-filter-btn" @click="applyFiltersToExpanded">
          应用筛选
        </button>
      </div>
    </div>

    <div class="view-content">
      <!-- 按APT-资产聚合 -->
      <!-- 注意：此视图基于已应用的筛选条件（appliedFilters）显示聚合列表 -->
      <!-- 点击"应用筛选"按钮后，才会根据左侧筛选条件更新聚合列表 -->
      <div class="aggregation-list">
        <!-- aggregations.byAPTAsset 基于 appliedFilters 计算，只显示选中的APT组织和资产类型 -->
        <div v-for="item in aggregations.byAPTAsset" :key="`${item.aptId}-${item.asset}`" class="aggregation-wrapper">
          <div class="aggregation-item" @click="expandAPTAsset(item)">
            <span class="apt-name">{{ getAPTName(item.aptId) }}</span>
            <span class="arrow">→</span>
            <span class="asset-name">{{ item.asset }}</span>
            <span class="count-badge">{{ item.count }} 个剧本</span>
            <button class="expand-btn" @click.stop="expandAPTAsset(item)">
              {{ isExpanded(item) ? '收起' : '展开' }}
            </button>
          </div>
          <!-- 在每个聚合项下面展开剧本 -->
          <!-- 注意：item.scenarios 已经是基于 appliedFilters 筛选后的结果 -->
          <div v-if="isExpanded(item)" class="phase-scenarios">
            <div v-for="scenario in getFilteredScenarios(item)" :key="scenario.id" class="scenario-item"
              @click.stop="highlightScenario(scenario)">
              <div class="scenario-header">
                <span class="scenario-name">{{ scenario.name }}</span>
                <span class="scenario-phase">{{ scenario.phase }}</span>
              </div>
              <div class="scenario-desc">{{ scenario.description }}</div>
              <div class="scenario-meta">
                <span>方法: {{ scenario.methods.length }} 种</span>
                <span>武器: {{ scenario.weapons.length }} 种</span>
              </div>
            </div>
            <div v-if="getFilteredScenarios(item).length === 0" class="empty-item">
              该聚合项在当前过滤条件下无剧本
            </div>
          </div>
        </div>
        <div v-if="aggregations.byAPTAsset.length === 0" class="empty">
          暂无数据（请先选择APT组织或调整过滤条件）
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
/**
 * ScenarioAggregationView.vue - 攻击剧本聚合视图组件
 * 
 * 功能说明：
 * - 按APT-资产聚合：显示每个APT组织对每个资产的攻击剧本数量
 * - 支持展开/收起查看详细剧本列表
 * - 点击"应用筛选"按钮后，根据左侧筛选条件更新聚合结果
 * - 点击剧本可触发高亮事件
 * 
 * 数据聚合策略：
 * - 不直接显示所有1000+剧本，而是按维度聚合显示数量
 * - 展开时才显示具体剧本列表（限制显示数量，避免性能问题）
 * - 筛选条件变化时自动清除展开状态
 * 
 * 修改说明：
 * - 如需修改展开剧本的显示数量限制，请修改 getFilteredScenarios 中的 slice(0, 20)
 */

import { ref, computed, watch } from 'vue'
import { getScenarioAggregations } from '../data/graphDataManager.js'
import { aptOrganizations } from '../data/aptOrganizations.js'

// ========== Props 定义 ==========
const props = defineProps({
  // 筛选条件对象（包含 aptIds、assetCategories）
  filters: {
    type: Object,
    default: () => ({})
  }
})

// ========== Emits 定义 ==========
const emit = defineEmits([
  'highlight-scenario'  // 剧本高亮事件，传递剧本数据
])

// ========== 响应式数据 ==========
// 已展开的APT-资产组合集合
const expandedAPTAssets = ref(new Set())
// 已应用的筛选条件（用于聚合列表筛选）
// 点击"应用筛选"按钮后，将 props.filters 复制到这里
const appliedFilters = ref({
  aptIds: [],
  assetCategories: []
})

// ========== 计算属性 ==========
/**
 * 聚合数据计算属性（基于已应用的筛选条件）
 * 
 * 核心原则：
 * - 数据源由"已应用的筛选条件"（appliedFilters）派生，而不是实时的 props.filters
 * - 用户选择筛选条件后，需要点击"应用筛选"按钮才会更新聚合列表
 * - 点击"应用筛选"按钮后，将 props.filters 复制到 appliedFilters
 * - 此 computed 基于 appliedFilters 计算聚合结果
 * 
 * 工作流程：
 * 1. 用户在左侧选择筛选条件 → props.filters 更新（但不影响聚合列表）
 * 2. 用户点击"应用筛选"按钮 → appliedFilters 更新为 props.filters 的值
 * 3. aggregations computed 检测到 appliedFilters 变化 → 重新计算聚合结果
 * 4. 聚合视图自动更新显示
 */
const aggregations = computed(() => {
  // ========== 使用已应用的筛选条件 ==========
  // 基于 appliedFilters 计算聚合结果，而不是实时的 props.filters
  // 这样用户选择筛选条件后，需要点击"应用筛选"按钮才会生效
  
  // 访问 appliedFilters 的所有属性，确保响应式追踪
  const aptIds = (appliedFilters.value.aptIds && Array.isArray(appliedFilters.value.aptIds) && appliedFilters.value.aptIds.length > 0)
    ? appliedFilters.value.aptIds
    : undefined

  const assetCategories = Array.isArray(appliedFilters.value.assetCategories) ? appliedFilters.value.assetCategories : []

  // ========== 基于已应用的筛选条件计算聚合结果 ==========
  const result = getScenarioAggregations({
    aptIds: aptIds,
    assetCategories: assetCategories
  })

  // 返回聚合结果，模板会自动使用此结果更新显示
  return result
})

// 当前展示的剧本总数：无筛选时为全部剧本数，筛选后为符合条件的剧本数
const totalScenarioCount = computed(() => {
  return aggregations.value.byAPTAsset.reduce((sum, item) => sum + item.count, 0)
})

// ========== 监听器 ==========
/**
 * 监听筛选条件变化
 * 当筛选条件变化时，清除所有展开状态
 * 注意：不自动更新 appliedFilters，需要用户点击"应用筛选"按钮
 */
watch(() => [
  props.filters.aptIds,
  props.filters.assetCategories
], () => {
  // 清除所有展开状态（筛选条件变化后，展开的内容可能不再有效）
  expandedAPTAssets.value.clear()
}, { deep: true, immediate: false })

// ========== 工具函数 ==========
/**
 * 根据APT ID获取APT组织名称
 * @param {string} aptId - APT组织ID
 * @returns {string} APT组织名称
 */
function getAPTName(aptId) {
  const apt = aptOrganizations.find(a => a.id === aptId)
  return apt ? apt.label : aptId
}

// ========== 展开/收起控制函数 ==========
/**
 * 切换APT-资产组合的展开/收起状态
 * @param {Object} item - 聚合项对象（包含 aptId 和 asset）
 */
function expandAPTAsset(item) {
  const key = `${item.aptId}-${item.asset}`
  if (expandedAPTAssets.value.has(key)) {
    // 如果已展开，则收起（从Set中移除）
    expandedAPTAssets.value.delete(key)
  } else {
    // 如果未展开，则展开（添加到Set）
    expandedAPTAssets.value.add(key)
  }
}

/**
 * 检查APT-资产组合是否已展开
 * @param {Object} item - 聚合项对象
 * @returns {boolean} 是否已展开
 */
function isExpanded(item) {
  const key = `${item.aptId}-${item.asset}`
  return expandedAPTAssets.value.has(key)
}

/**
 * 应用筛选条件到聚合列表
 * 点击"应用筛选"按钮时调用此函数
 * 
 * 功能说明：
 * - 将左侧筛选条件（props.filters）复制到已应用的筛选条件（appliedFilters）
 * - 更新 appliedFilters 后，aggregations computed 会自动重新计算
 * - 聚合列表会基于新的筛选条件更新显示
 * - 展开的剧本列表会自动更新（因为 item.scenarios 已经是筛选后的结果）
 */
function applyFiltersToExpanded() {
  // 将左侧筛选条件复制到已应用的筛选条件
  // 这样聚合列表会基于这些筛选条件重新计算
  appliedFilters.value = {
    aptIds: Array.isArray(props.filters.aptIds) ? [...props.filters.aptIds] : [],
    assetCategories: Array.isArray(props.filters.assetCategories) ? [...props.filters.assetCategories] : []
  }
  
  // 清除所有展开状态（因为筛选条件已更新，之前展开的内容可能不再有效）
  expandedAPTAssets.value.clear()
}

// ========== 剧本筛选和获取函数 ==========
/**
 * 获取APT-资产聚合项中过滤后的剧本列表
 * 
 * 说明：
 * - item.scenarios 已经在 getScenarioAggregations 中基于 appliedFilters 应用了所有筛选条件
 * - 当点击"应用筛选"按钮后，aggregations computed 会重新计算
 * - 重新计算后，item.scenarios 已经是基于新筛选条件的结果
 * - 此函数直接使用 item.scenarios，无需再次应用筛选
 * - 因此，展开的剧本列表会自动反映已应用的筛选条件
 * 
 * @param {Object} item - 聚合项对象（包含 scenarios 数组，已经是基于 appliedFilters 筛选后的结果）
 * @returns {Array} 过滤后的剧本列表（最多20个）
 */
function getFilteredScenarios(item) {
  // 获取该聚合项的所有剧本
  // 这些剧本已经在 getScenarioAggregations 中基于 appliedFilters 应用了所有筛选条件
  // 包括：APT组织、资产类型
  const scenarios = item.scenarios || []

  // 限制显示数量（避免一次显示过多剧本导致性能问题）
  // 如需修改显示数量，请修改此处的 20
  return scenarios.slice(0, 20)
}

/**
 * 触发剧本高亮事件
 * @param {Object} scenario - 要高亮的攻击剧本对象
 */
function highlightScenario(scenario) {
  // 发送高亮事件给父组件（可用于在图谱中高亮相关节点）
  emit('highlight-scenario', scenario)
}

</script>

<style scoped>
.scenario-aggregation-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
}

.view-header {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.view-header .scenario-count {
  font-weight: 400;
  color: #8c8c8c;
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-tabs {
  display: flex;
  gap: 8px;
}

.view-tabs button {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.view-tabs button.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.apply-filter-btn {
  padding: 6px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
}

.apply-filter-btn:hover {
  background: #40a9ff;
}

.apply-filter-btn:active {
  background: #096dd9;
}

.view-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.aggregation-wrapper {
  margin-bottom: 8px;
}

.aggregation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.2s;
}

.aggregation-item:hover {
  background: #f5f5f5;
  border-color: #1890ff;
}

.expand-btn {
  margin-left: auto;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.expand-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}


.apt-name {
  font-weight: 600;
  color: #ff4d4f;
}

.asset-name {
  color: #722ed1;
}

.count-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
}

.phase-scenarios {
  padding: 0 12px 12px;
  border-top: 1px solid #f0f0f0;
}

.scenario-item {
  padding: 8px 0;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.scenario-item:hover {
  background: #f0f0f0;
}

.scenario-item:last-child {
  border-bottom: none;
}

.scenario-severity {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.scenario-severity.严重 {
  background: #fff1f0;
  color: #ff4d4f;
}

.scenario-severity.高 {
  background: #fff7e6;
  color: #fa8c16;
}

.scenario-severity.中 {
  background: #e6f7ff;
  color: #1890ff;
}

.scenario-severity.低 {
  background: #f6ffed;
  color: #52c41a;
}

.scenario-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11px;
  color: #8c8c8c;
}

.empty-item {
  padding: 12px;
  text-align: center;
  color: #8c8c8c;
  font-size: 12px;
}

.filter-prompt {
  padding: 20px;
  text-align: center;
  color: #8c8c8c;
  font-size: 12px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px dashed #d9d9d9;
}

.filter-prompt p {
  margin: 0;
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.scenario-name {
  font-weight: 600;
  color: #262626;
}

.scenario-phase {
  font-size: 11px;
  color: #8c8c8c;
}

.scenario-desc {
  font-size: 12px;
  color: #595959;
  line-height: 1.5;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
}
</style>
