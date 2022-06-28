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
      //@ts-ignore
      this.layer.setVisible(evt.target.checked);
    }
  }
}
</script>

<template>
  <div>
    <input @input="onInput" :checked="layer.getVisible()" type="checkbox" class="mr-1">
    <label class="text-ellipsis overflow-hidden">
      <slot></slot>
    </label>

  </div>
</template>

<style scoped>

</style>