<template>
  <div id="app">
    <APTKnowledgeGraph />
  </div>
</template>

<script setup>
import APTKnowledgeGraph from './components/APTKnowledgeGraph.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
