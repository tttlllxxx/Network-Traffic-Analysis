<template>
  <div class="filter-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <h3>过滤与控制</h3>
    </div>

    <div class="panel-content">
      <!-- APT组织过滤区域 -->
      <div class="filter-section">
        <h4>APT组织</h4>
        <!-- APT组织复选框列表 -->
        <div class="checkbox-group">
          <label 
            v-for="apt in aptOrganizations" 
            :key="apt.id"
            class="checkbox-item"
          >
            <input 
              type="checkbox" 
              :value="apt.id"
              :checked="selectedAPTs.includes(apt.id)"
              @change="toggleAPT(apt.id, $event.target.checked)"
              @click.stop
            />
            <span>{{ apt.label }}</span>
          </label>
        </div>
        <!-- APT组织快捷操作按钮 -->
        <div class="filter-actions">
          <button @click.stop="selectAllAPTs($event)" class="btn-link">全选</button>
          <button @click.stop="clearAllAPTs($event)" class="btn-link">清空</button>
        </div>
      </div>

      <!-- 资产类型过滤区域 -->
      <div class="filter-section">
        <h4>资产类型</h4>
        <!-- 资产类型复选框列表 -->
        <div class="checkbox-group">
          <label 
            v-for="category in assetCategories" 
            :key="category.value"
            class="checkbox-item"
          >
            <input 
              type="checkbox" 
              :value="category.value"
              :checked="selectedAssetCategories.includes(category.value)"
              @change="toggleAssetCategory(category.value, $event.target.checked)"
              @click.stop
            />
            <span>{{ category.label }}</span>
          </label>
        </div>
        <!-- 资产类型快捷操作按钮 -->
        <div class="filter-actions">
          <button @click.stop="selectAllAssetCategories($event)" class="btn-link">全选</button>
          <button @click.stop="clearAllAssetCategories($event)" class="btn-link">清空</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
/**
 * FilterPanel.vue - 筛选控制面板组件
 * 
 * 功能说明：
 * - 提供APT组织、资产类型等筛选条件
 * - 实时筛选：用户勾选/取消复选框时立即应用筛选条件
 * - 提供全选/清空快捷操作
 * - 显示当前图谱规模信息
 * 
 * 修改说明：
 * - 如需修改筛选选项，请修改对应的数据数组（assetCategories等）
 * - 如需添加新的筛选类型，请：
 *   1. 在 template 中添加新的 filter-section
 *   2. 添加对应的响应式变量（ref）
 *   3. 添加切换函数（toggleXXX）
 *   4. 在 updateFilters 函数中添加对应的字段
 */

import { ref } from 'vue'
import { aptOrganizations } from '../data/aptOrganizations.js'


// ========== Emits 定义 ==========
const emit = defineEmits(['filter-change'])

// ========== 响应式数据 ==========
// 当前选中的APT组织ID列表（实时筛选，立即生效）
const selectedAPTs = ref([])
// 当前选中的资产类型列表（实时筛选，立即生效）
const selectedAssetCategories = ref([])

// ========== 静态数据配置 ==========
// 资产类型选项列表
// 如需修改资产类型，请修改此数组
const assetCategories = [
  { value: 'generation', label: '发电' },
  { value: 'transmission', label: '输电' },
  { value: 'distribution', label: '配电' },
  { value: 'control', label: '控制' },
  { value: 'data', label: '数据' },
  { value: 'network', label: '网络' },
  { value: 'security', label: '安全' },
  { value: 'metering', label: '计量' },
  { value: 'management', label: '管理' },
  { value: 'protection', label: '保护' }
]


// ========== 筛选操作函数 ==========
/**
 * 切换APT组织选择状态
 * @param {string} aptId - APT组织ID
 * @param {boolean} checked - 是否选中
 */
function toggleAPT(aptId, checked) {
  if (checked) {
    // 添加到选中列表
    if (!selectedAPTs.value.includes(aptId)) {
      selectedAPTs.value = [...selectedAPTs.value, aptId]
    }
  } else {
    // 从选中列表移除
    selectedAPTs.value = selectedAPTs.value.filter(id => id !== aptId)
  }
  // 立即应用筛选（实时筛选）
  updateFilters()
}

/**
 * 切换资产类型选择状态
 * @param {string} category - 资产类型值
 * @param {boolean} checked - 是否选中
 */
function toggleAssetCategory(category, checked) {
  if (checked) {
    if (!selectedAssetCategories.value.includes(category)) {
      selectedAssetCategories.value = [...selectedAssetCategories.value, category]
    }
  } else {
    selectedAssetCategories.value = selectedAssetCategories.value.filter(c => c !== category)
  }
  // 立即应用筛选（实时筛选）
  updateFilters()
}

// ========== 快捷操作函数 ==========
/**
 * 全选所有APT组织
 */
function selectAllAPTs(event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  // 全选所有APT组织
  const allAPTIds = aptOrganizations.map(a => a.id)
  selectedAPTs.value = [...allAPTIds]
  updateFilters()
}

/**
 * 清空所有APT组织选择
 */
function clearAllAPTs(event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  // 清空所有APT组织选择
  selectedAPTs.value = []
  updateFilters()
}

/**
 * 全选所有资产类型
 */
function selectAllAssetCategories(event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  selectedAssetCategories.value = [...assetCategories.map(c => c.value)]
  updateFilters()
}

/**
 * 清空所有资产类型选择
 */
function clearAllAssetCategories(event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  selectedAssetCategories.value = []
  updateFilters()
}

// ========== 核心函数 ==========
/**
 * 更新筛选条件并发送给父组件（状态驱动）
 * 
 * 核心原则：
 * - 此函数在每次筛选条件变化时自动调用（实时筛选）
 * - 不需要用户点击确认按钮，复选框状态变化即触发
 * - 发送的筛选条件会立即更新全局状态，驱动聚合视图自动刷新
 * 
 * 工作流程：
 * 1. 用户勾选/取消复选框 → toggleXXX() → updateFilters()
 * 2. updateFilters() → emit('filter-change') → 更新全局 filters 状态
 * 3. ScenarioAggregationView.aggregations computed → 自动重新计算
 * 4. 聚合视图 → 自动更新显示
 */
function updateFilters() {
  // 构建新的筛选条件对象（状态快照）
  const newFilters = {
    aptIds: [...selectedAPTs.value],           // APT组织筛选条件
    assetCategories: [...selectedAssetCategories.value]  // 资产类型筛选条件
  }
  
  // 发送筛选条件变化事件给父组件
  // 父组件会更新全局 filters 状态，触发聚合视图自动刷新
  emit('filter-change', newFilters)
}

// ========== 初始化 ==========
// 组件挂载时发送默认筛选条件（全部为空，即显示所有数据）
updateFilters()
</script>

<style scoped>
.filter-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e8e8e8;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item,
.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-item input {
  cursor: pointer;
}

.filter-actions {
  margin-top: 8px;
  display: flex;
  gap: 12px;
}

.btn-link {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #1890ff;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  pointer-events: auto;
  user-select: none;
}

.btn-link:hover {
  color: #40a9ff;
}

.btn-link:active {
  color: #096dd9;
}

</style>
