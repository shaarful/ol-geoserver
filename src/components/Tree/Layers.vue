<script lang="ts">
import LayerItem from './LayerItem.vue';
import {useMapStore} from "@/stores/map";
import {mapState, mapStores} from "pinia";
// import {useMapStore} from "../../stores/map.ts"


export default {
  name: "Layers",
  components: {
    LayerItem,
  },
  data() {
    return {
      layerList: [],
    }
  },
  computed: {
    // ...mapStores(useMapStore)
    ...mapState(useMapStore, ['map'])
  },
  methods: {
    onChangeVisibility(val: any, layer: any) {
      console.log(val);
    }
  },
  watch: {
    map(map: any) {
      let layers: any = []

      map.getLayers().forEach((layer: any) => {
        layers.push({
          name: layer.get('name'),
          layer: layer
        });
      });

      //@ts-ignore
      this.layerList = layers.reverse();

    }
  },
  mounted() {
    // console.log(this.mapStore.getMap);

    // console.log(this.map);
  }
}
</script>

<template>
  <div class="layer-container pl-2 pt-2">
    <LayerItem :layer="layer.layer" v-for="layer in layerList">{{ layer.name }}</LayerItem>
  </div>
</template>

<style scoped>
.layer-container {
  width: var(--layer-width);
  height: var(--content-height);
}
</style>