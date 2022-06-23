<script lang="ts">
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import {TileWMS} from "ol/source";
import {defineComponent} from "vue";
import {fromLonLat} from "ol/proj";
import {useMapStore} from "@/stores/map"
import {mapStores} from "pinia";

export default defineComponent({
  name: "MapApp",
  data() {
    return {
      layerList: [
        // 'topp:tasmania_state_boundaries',
        // 'topp:tasmania_water_bodies',
        // 'topp:tasmania_roads',
        // 'topp:tasmania_cities',
        {
          name: 'DTK Skaermkort',
          id: 'dtk_skaermkort',
        },
        {
          name: 'DTK Skaermkort Daempet',
          id: 'dtk_skaermkort_daempet',
        },
        {
          name: 'DTK Skaermkort Daempet 1548',
          id: 'dtk_skaermkort_daempet_1548_print',
        },
        {
          name: 'DTK Skaermkort Graa',
          id: 'dtk_skaermkort_graa',
        },
        {
          name: 'DTK Skaermkort Graa 1548',
          id: 'dtk_skaermkort_graa_1548_print',
        },
        {
          name: 'DTK Skaermkort Graa 774',
          id: 'dtk_skaermkort_graa_774_print',
        },


      ],
    }
  },
  computed: {...mapStores(useMapStore)},
  methods: {
    getTileLayers() {
      return this.layerList.map(layer => {
        return new TileLayer({
          name: layer.name || layer.id,
          source: new TileWMS({
            url: "https://services.datafordeler.dk/Dkskaermkort/topo_skaermkort/1.0.0/wms?username=GCXPTROVSJ&password=f8B9qGYExV!iuxJ",
            params: {
              'LAYERS': layer.id,
              'TILED': 'TRUE',
              'TRANSPARENT': 'TRUE',
            },
            crossOrigin: 'anonymous',
            serverType: 'geoserver',
          })
        });

      })
    }
  },
  mounted() {

    const map = new Map({
      layers: [
        new TileLayer({
          name: 'OSM',
          source: new OSM(),
        }),
        // new TileLayer({
        //   name: 'DTK Skaermkort',
        //   source: new TileWMS({
        //     url: "https://services.datafordeler.dk/Dkskaermkort/topo_skaermkort/1.0.0/wms?username=GCXPTROVSJ&password=f8B9qGYExV!iuxJ",
        //     params: {
        //       'LAYERS': 'dtk_skaermkort',
        //       'TILED': 'TRUE',
        //       'TRANSPARENT': 'TRUE',
        //       // 'username': 'GCXPTROVSJ',
        //       // 'password': 'f8B9qGYExV!iuxJ'
        //     },
        //     crossOrigin: 'anonymous',
        //     serverType: 'geoserver',
        //   })
        // }),
        ...this.getTileLayers(),
      ],
      target: 'map',
      view: new View({
        center: fromLonLat([10.522, 56.318]),
        zoom: 7,
      }),
    });

    this.mapStore.setMap(map);

  }
})
</script>

<template>
  <div class="map" id="map"></div>
</template>


<style scoped>
.map {
  width: var(--map-width);
  height: var(--content-height);
}
</style>