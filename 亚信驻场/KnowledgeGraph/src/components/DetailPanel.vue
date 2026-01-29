<template>
  <div class="detail-panel">
    <div class="panel-header">
      <h3>图谱选择</h3>
    </div>
    
    <div class="panel-content">
      <div class="graph-selection-section">
        <p class="section-description">选择要查看的APT知识图谱</p>
        <div class="graph-list">
          <div
            v-for="index in 9"
            :key="index"
            class="graph-item"
            :class="{ active: selectedGraphIndex === index }"
            @click="selectGraph(index)"
          >
            <div class="graph-number">{{ String(index).padStart(2, '0') }}</div>
            <div class="graph-label">图谱 {{ index }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['graph-select'])

const selectedGraphIndex = ref(null)

function selectGraph(index) {
  selectedGraphIndex.value = index
  emit('graph-select', index)
}
</script>

<style scoped>
.detail-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-left: 1px solid #e8e8e8;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.graph-selection-section {
  width: 100%;
}

.section-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #8c8c8c;
}

.graph-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.graph-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.graph-item:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.graph-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.graph-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  color: #262626;
}

.graph-item.active .graph-number {
  background: #1890ff;
  color: white;
}

.graph-label {
  font-size: 14px;
  color: #262626;
}

</style>
