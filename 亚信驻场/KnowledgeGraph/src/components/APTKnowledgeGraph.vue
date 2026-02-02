<template>
  <div class="apt-knowledge-graph" :class="{ resizing: isResizing }">
    <!-- 顶部标题栏 -->
    <div class="header-bar">
      <h1>针对电力行业的APT组织攻击图谱</h1>
      <div class="stats-bar">
        <div class="stat-item clickable" @click="showMethodsModal = true" title="点击查看全部攻击方法">
          <span class="stat-label">攻击方法:</span>
          <span class="stat-value">{{ stats.methodCount }}</span>
        </div>
        <div class="stat-item clickable" @click="showWeaponsModal = true" title="点击查看全部攻击武器">
          <span class="stat-label">攻击武器:</span>
          <span class="stat-value">{{ stats.weaponCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">电力资产:</span>
          <span class="stat-value">{{ stats.assetCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">攻击剧本:</span>
          <span class="stat-value">{{ stats.scenarioCount }}</span>
        </div>
      </div>
    </div>

    <!-- 四个联动区域 -->
    <div class="main-layout">
      <!-- 区域4：左侧过滤面板 -->
      <div class="filter-area" :style="{ width: filterAreaWidth + 'px' }">
        <FilterPanel 
          @filter-change="handleFilterChange"
        />
      </div>

      <!-- 左侧分隔条 -->
      <div 
        class="resizer resizer-vertical"
        @mousedown="startResize('left', $event)"
      ></div>

      <!-- 区域1：主知识图谱画布（核心） -->
      <div class="graph-area" :style="{ flex: '1 1 auto', minWidth: '300px' }">
        <!-- 未选择图谱时的提示 -->
        <div v-if="!selectedGraphIndex" class="empty-state">
          <div class="empty-content">
            <h3>请选择图谱</h3>
            <p>在右侧"图谱选择"面板中选择要查看的APT知识图谱</p>
          </div>
        </div>
        
        <!-- HTML图谱展示 -->
        <div v-else class="html-graph-container">
          <iframe
            :src="getGraphHtmlPath(selectedGraphIndex)"
            frameborder="0"
            class="graph-iframe"
          ></iframe>
        </div>
      </div>

      <!-- 右侧分隔条 -->
      <div 
        class="resizer resizer-vertical"
        @mousedown="startResize('right', $event)"
      ></div>

      <!-- 区域3：右侧详情面板 -->
      <div class="detail-area" :style="{ width: detailAreaWidth + 'px' }">
        <DetailPanel 
          @graph-select="handleGraphSelect"
        />
      </div>
    </div>

    <!-- 水平分隔条 -->
    <div 
      class="resizer resizer-horizontal"
      @mousedown="startResize('bottom', $event)"
    ></div>

    <!-- 区域2：底部攻击剧本聚合视图 -->
    <div class="scenario-area" :style="{ height: scenarioAreaHeight + 'px' }">
        <ScenarioAggregationView 
          :filters="filters"
          @highlight-scenario="handleHighlightScenario"
        />
    </div>

    <!-- 攻击方法列表弹窗 -->
    <Teleport to="body">
      <div v-if="showMethodsModal" class="list-modal-overlay" @click.self="showMethodsModal = false">
        <div class="list-modal-box">
          <div class="list-modal-header">
            <h3>攻击方法列表</h3>
            <button type="button" class="list-modal-close" @click="showMethodsModal = false" aria-label="关闭">×</button>
          </div>
          <div class="list-modal-body">
            <ul class="list-modal-list">
              <li v-for="m in attackMethods" :key="m.id" class="list-modal-item">
                <span class="list-item-id">{{ m.id }}</span>
                <span class="list-item-label">{{ m.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 攻击武器列表弹窗 -->
    <Teleport to="body">
      <div v-if="showWeaponsModal" class="list-modal-overlay" @click.self="showWeaponsModal = false">
        <div class="list-modal-box">
          <div class="list-modal-header">
            <h3>攻击武器列表</h3>
            <button type="button" class="list-modal-close" @click="showWeaponsModal = false" aria-label="关闭">×</button>
          </div>
          <div class="list-modal-body">
            <ul class="list-modal-list">
              <li v-for="w in attackWeapons" :key="w.id" class="list-modal-item">
                <span class="list-item-id">{{ w.id }}</span>
                <span class="list-item-label">{{ w.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * APTKnowledgeGraph.vue - APT知识图谱主容器组件
 * 
 * 功能说明：
 * - 整合四个区域：筛选面板、主图谱画布、详情面板、剧本聚合视图
 * - 管理全局筛选状态（filters）
 * - 协调各子组件之间的数据传递和事件通信
 * 
 * 布局结构：
 * - 顶部：标题栏和统计信息
 * - 主体：左侧筛选面板 + 中间图谱画布 + 右侧详情面板
 * - 底部：攻击剧本聚合视图
 * 
 * 修改说明：
 * - 如需修改布局比例，请修改 style 中的宽度/高度设置
 * - 如需添加新的筛选条件，请在 filters 对象中添加对应字段
 * - 如需修改统计信息显示，请修改 header-bar 中的 stat-item
 */

import { ref, reactive, onUnmounted } from 'vue'
import { getStatistics } from '../data/graphDataManager.js'
import { attackMethods } from '../data/attackMethods.js'
import { attackWeapons } from '../data/attackWeapons.js'
import ScenarioAggregationView from './ScenarioAggregationView.vue'
import DetailPanel from './DetailPanel.vue'
import FilterPanel from './FilterPanel.vue'

// ========== 数据初始化 ==========
// 获取全局统计信息（APT数量、方法数量等）
const stats = getStatistics()

// 初始状态：不加载任何数据
// 不再需要API和图谱数据，直接展示HTML文件

// ========== 响应式数据 ==========
// 攻击方法 / 攻击武器列表弹窗
const showMethodsModal = ref(false)
const showWeaponsModal = ref(false)
// 当前选中的图谱索引（1-15）
const selectedGraphIndex = ref(null)

// ========== 区域大小控制 ==========
// 左侧筛选面板宽度（默认280px）
const filterAreaWidth = ref(280)
// 右侧详情面板宽度（默认320px）
const detailAreaWidth = ref(320)
// 底部剧本聚合视图高度（默认200px）
const scenarioAreaHeight = ref(200)

// 拖动状态
const isResizing = ref(false)
const resizeType = ref(null) // 'left' | 'right' | 'bottom'
const startX = ref(0)
const startY = ref(0)
const startFilterWidth = ref(0)
const startDetailWidth = ref(0)
const startScenarioHeight = ref(0)

// 全局筛选条件（使用 reactive 确保深层响应式）
const filters = reactive({
  aptIds: [],              // 选中的APT组织ID列表
  assetCategories: []      // 选中的资产类型列表
})

// 不再需要监听筛选条件，直接展示HTML图谱

// ========== 事件处理函数 ==========
/**
 * 处理筛选条件变化事件（来自 FilterPanel）
 * 
 * 状态驱动机制：
 * - 当用户在 FilterPanel 中勾选/取消复选框时，会立即触发此函数
 * - 此函数更新全局 filters 状态，触发所有依赖此状态的组件自动更新
 * - ScenarioAggregationView 的 aggregations computed 会自动重新计算
 * - 整个过程完全由状态驱动，无需用户额外操作
 * 
 * @param {Object} newFilters - 新的筛选条件对象（来自 FilterPanel 的复选框状态）
 */
function handleFilterChange(newFilters) {
  // 直接赋值新数组，确保响应式系统能检测到变化
  // 使用展开运算符创建新数组引用，触发响应式更新
  // 这是状态驱动的关键：每次更新都创建新引用，确保 Vue 能检测到变化
  filters.aptIds = Array.isArray(newFilters.aptIds) ? [...newFilters.aptIds] : []
  filters.assetCategories = Array.isArray(newFilters.assetCategories) ? [...newFilters.assetCategories] : []
  
  // 状态更新后，ScenarioAggregationView.aggregations 会自动重新计算
}

/**
 * 处理图谱选择事件（来自 DetailPanel）
 * @param {number} index - 选中的图谱索引（1-15）
 */
function handleGraphSelect(index) {
  selectedGraphIndex.value = index
  console.log('选择图谱:', index)
}

/**
 * 获取图谱HTML文件路径
 * @param {number} index - 图谱索引（1-15）
 * @returns {string} HTML文件路径
 */
function getGraphHtmlPath(index) {
  // 使用相对路径访问图谱15目录下的HTML文件
  // 注意：需要确保这些文件可以通过HTTP访问
  const fileName = `apt_knowledge_graph_${String(index).padStart(2, '0')}.html`
  // 使用相对路径，假设图谱15目录在public或可以通过服务器访问
  return `/图谱15/${fileName}`
}

/**
 * 处理剧本高亮事件（来自 ScenarioAggregationView）
 * @param {Object} scenario - 要高亮的攻击剧本
 */
function handleHighlightScenario(scenario) {
  // TODO: 可以在这里实现高亮相关节点的逻辑
  // 例如：根据剧本中的APT、方法、武器等，在图谱中高亮对应节点
  console.log('高亮剧本:', scenario)
}

// ========== 拖动调整大小功能 ==========
/**
 * 开始拖动调整大小
 * @param {string} type - 拖动类型：'left' | 'right' | 'bottom'
 * @param {MouseEvent} event - 鼠标事件
 */
function startResize(type, event) {
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  resizeType.value = type
  startX.value = event.clientX
  startY.value = event.clientY
  startFilterWidth.value = filterAreaWidth.value
  startDetailWidth.value = detailAreaWidth.value
  startScenarioHeight.value = scenarioAreaHeight.value
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  
  // 添加拖动时的样式（防止文本选择）
  document.body.style.userSelect = 'none'
  document.body.style.cursor = type === 'bottom' ? 'row-resize' : 'col-resize'
}

/**
 * 处理拖动调整大小
 * @param {MouseEvent} event - 鼠标事件
 */
function handleResize(event) {
  if (!isResizing.value) return
  
  const deltaX = event.clientX - startX.value
  const deltaY = event.clientY - startY.value
  
  if (resizeType.value === 'left') {
    // 调整左侧筛选面板宽度
    const newWidth = startFilterWidth.value + deltaX
    // 限制最小宽度和最大宽度
    if (newWidth >= 200 && newWidth <= 600) {
      filterAreaWidth.value = newWidth
    }
  } else if (resizeType.value === 'right') {
    // 调整右侧详情面板宽度
    const newWidth = startDetailWidth.value - deltaX
    // 限制最小宽度和最大宽度
    if (newWidth >= 200 && newWidth <= 600) {
      detailAreaWidth.value = newWidth
    }
  } else if (resizeType.value === 'bottom') {
    // 调整底部剧本聚合视图高度
    const newHeight = startScenarioHeight.value - deltaY
    // 限制最小高度和最大高度
    if (newHeight >= 150 && newHeight <= 600) {
      scenarioAreaHeight.value = newHeight
    }
  }
}

/**
 * 停止拖动调整大小
 */
function stopResize() {
  if (!isResizing.value) return
  
  isResizing.value = false
  resizeType.value = null
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  // 恢复样式
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

// ========== 生命周期钩子 ==========
onUnmounted(() => {
  // 组件卸载时清理事件监听
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.apt-knowledge-graph {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.header-bar {
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-bar h1 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.stats-bar {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item.clickable {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
}

.stat-item.clickable:hover {
  background: #f0f0f0;
}

.stat-label {
  color: #8c8c8c;
  font-size: 13px;
}

.stat-value {
  color: #262626;
  font-size: 16px;
  font-weight: 600;
}

.main-layout {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.filter-area {
  flex-shrink: 0;
  border-right: 1px solid #e8e8e8;
  min-width: 200px;
  max-width: 600px;
  overflow: hidden;
}

.html-graph-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.graph-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.graph-area {
  flex: 1;
  min-width: 0;
  background: white;
  overflow: hidden;
  position: relative;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.empty-content {
  text-align: center;
  color: #999;
  padding: 40px;
}

.empty-content h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #666;
}

.empty-content p {
  font-size: 14px;
  line-height: 1.6;
}

.detail-area {
  flex-shrink: 0;
  border-left: 1px solid #e8e8e8;
  min-width: 200px;
  max-width: 600px;
  overflow: hidden;
}

.scenario-area {
  flex-shrink: 0;
  border-top: 1px solid #e8e8e8;
  background: white;
  min-height: 150px;
  max-height: 600px;
  overflow: hidden;
}

/* 分隔条样式 */
.resizer {
  background: #e8e8e8;
  position: relative;
  flex-shrink: 0;
  z-index: 10;
}

.resizer-vertical {
  width: 4px;
  cursor: col-resize;
  border-left: 1px solid #d9d9d9;
  border-right: 1px solid #d9d9d9;
}

.resizer-vertical:hover {
  background: #1890ff;
}

.resizer-horizontal {
  height: 4px;
  cursor: row-resize;
  border-top: 1px solid #d9d9d9;
  border-bottom: 1px solid #d9d9d9;
}

.resizer-horizontal:hover {
  background: #1890ff;
}

/* 拖动时的样式 */
.apt-knowledge-graph.resizing .resizer {
  background: #1890ff;
}

/* 列表弹窗 */
.list-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.list-modal-box {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  max-width: 480px;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.list-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.list-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.list-modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #8c8c8c;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-modal-close:hover {
  background: #f0f0f0;
  color: #262626;
}

.list-modal-body {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.list-modal-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.list-modal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.list-modal-item:hover {
  background: #f5f5f5;
}

.list-item-id {
  flex-shrink: 0;
  color: #8c8c8c;
  font-family: monospace;
  min-width: 52px;
}

.list-item-label {
  color: #262626;
}
</style>
