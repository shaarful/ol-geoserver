<script lang="ts">
export default {
  name: "LayerItem",
  props: {
    layer: null,
  },
  data() {
    return {}
  },
  methods: {
    onInput(evt: any) {
      this.layer.setVisible(evt.target.checked);
    }
  }
}
</script>

<template>
  <div>
    <input @input="onInput" :checked="layer.getVisible()" type="checkbox" class="mr-1">
    <label>
      <slot></slot>
    </label>

  </div>
</template>

<style scoped>

</style>