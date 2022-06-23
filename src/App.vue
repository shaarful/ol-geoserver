<script setup lang="ts">
import MapApp from './components/MapApp.vue'
import Layers from './components/Tree/Layers.vue'

</script>

<template>
  <div class="content">
    <Layers></Layers>
    <MapApp></MapApp>
  </div>
</template>

<style scoped>
.content {
  height: var(--content-height);
  display: flex;
  /*padding: 1rem;*/
}
</style>
