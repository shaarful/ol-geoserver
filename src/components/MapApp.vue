<script lang="ts">
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import View from 'ol/View';
import {TileWMS} from "ol/source";
import {defineComponent} from "vue";
import {fromLonLat} from "ol/proj";
import {useMapStore} from "@/stores/map"
import {mapStores} from "pinia";
import {MyTileLayer} from "@/classes/my-tile-layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {MyVectorLayer} from "@/classes/my-vector-layer";
import {defaults as defaultControls, MousePosition} from 'ol/control';
import {Fill, Stroke, Style} from "ol/style";
import CircleStyle from "ol/style/Circle";
import {Overlay} from "ol";
import MeasurementControl from "@/classes/measurement-control";
import type {PopupProperty} from "@/models/PopupProperty";

// https://geoserver.qler.dk/geoserver/qler/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=qler%3Aledninger&outputFormat=application%2Fjson
//
// https://geoserver.qler.dk/geoserver/qler/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=qler%3Abrandhaner&maxFeatures=50&outputFormat=application%2Fjson
//
//  EPSG:25832

export default defineComponent({
  name: "MapApp",
  data() {
    return {
      layerList: [
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
      props: [] as PopupProperty[],
      notIn: ['fid', 'geometry'],
      overlay: new Overlay({
        // autoPan: {
        //   animation: {
        //     duration: 250,
        //   },
        // },
      }),
      styleColor: {
        mainColor: {
          fill: 'rgba(169,203,239,0.93)',
          stroke: 'rgba(164,75,222,0.5)',
          image: {
            fill: 'rgba(63,205,116,0.7)',
            stroke: 'rgba(3,116,47,0.7)'
          }
        },
        hltColor: {
          fill: 'rgba(236,42,115,0.93)',
          stroke: 'rgba(213,9,70,0.5)',
          image: {
            fill: 'rgba(236,42,115,0.93)',
            stroke: 'rgba(213,9,70,0.5)',
          }
        }
      },
    }
  },
  computed: {
    ...mapStores(useMapStore),
  },
  methods: {
    getTileLayers() {
      return this.layerList.map(layer => {
        return new MyTileLayer({
          name: layer.name || layer.id,
          visible: false,
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
    },
    closePopup() {
      this.overlay.setPosition(undefined);
      return false;
    },
    getStyle(colorTheme: string = 'mainColor') {
      const me = this;
      const styleColor: any = me.styleColor;

      return new Style({
        fill: new Fill({
          color: styleColor[colorTheme].fill,
        }),
        stroke: new Stroke({
          color: styleColor[colorTheme].stroke,
          // lineDash: [10, 10],
          width: 3,
        }),
        image: new CircleStyle({
          radius: 8,
          stroke: new Stroke({
            color: styleColor[colorTheme].image.stroke,
            width: 3,
          }),
          fill: new Fill({
            color: styleColor[colorTheme].image.stroke,
          }),
        }),
      });
    }
  },
  mounted() {

    const me = this;

    this.overlay.setElement(document.getElementById('popup') as any)

    const measure = new MeasurementControl({});


    const map = new Map({
      controls: defaultControls().extend([
        // new MousePosition({projection: 'EPSG:4326'}),
        measure
      ]),
      layers: [
        new MyTileLayer({
          name: 'OSM',
          source: new OSM(),
        }),
        ...this.getTileLayers(),

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
        new MyVectorLayer({
          name: 'Line',
          source: new VectorSource({
            format: new GeoJSON(),
            url: function (extent) {
              return (
                  //     'https://geoserver.qler.dk/geoserver/qler/ows?' +
                  //     'service=WFS&version=1.0.0&request=GetFeature&' +
                  //     'typeName=qler:ledninger&outputFormat=application/json&srsname=EPSG:25832&' +

                  'https://geoserver.qler.dk/geoserver/qler/ows' +
                  // 'http://localhost:2020' +
                  '?service=WFS&version=1.0.0&request=GetFeature&typeName=qler:ledninger&outputFormat=application/json' +
                  '&srsname=EPSG:3857&' +
                  'bbox=' +
                  extent.join(',') +
                  ',EPSG:3857'
              );
            },
            strategy: bboxStrategy,
          }),
          style: function (feature: any) {
            // const color = feature.get('COLOR') || '#eeeeee';
            // style.getFill().setColor(color);
            return me.getStyle();
          },
        }),
        new MyVectorLayer({
          name: 'Point',
          source: new VectorSource({
            format: new GeoJSON(),
            url: function (extent) {
              return (
                  'https://geoserver.qler.dk/geoserver/qler/ows' +
                  // 'http://localhost:2020' +
                  '?service=WFS&version=1.0.0&request=GetFeature&typeName=qler:brandhaner&maxFeatures=50&outputFormat=application/json' +
                  '&srsname=EPSG:3857&' +
                  'bbox=' +
                  extent.join(',') +
                  ',EPSG:3857'
              );
            },
            strategy: bboxStrategy,
          }),
          style: function (feature: any) {
            // const color = feature.get('COLOR') || '#eeeeee';
            // style.getFill().setColor(color);
            return me.getStyle();
          },
        }),
      ],
      target: 'map',
      view: new View({
        center: fromLonLat([9.789641898736475, 56.388292418035235]),
        zoom: 13,
      }),
      overlays: [this.overlay as any],
    });

    this.overlay.setPosition(undefined);


    this.mapStore.setMap(map);

    let feature: any = null;

    const handlePointerMoveLocal = (event: any) => {
      const features = map.getFeaturesAtPixel(event.pixel);
      if (feature) {
        feature.setStyle(this.getStyle())
      }
      me.props = [];
      me.overlay.setPosition(undefined);
      if (features.length == 0) {
        return;
      }
      feature = features[0];
      const coordinate = event.coordinate;
      const properties = feature.getProperties();
      feature.setStyle(this.getStyle('hltColor'))
      for (let prop in properties) {
        if (!me.notIn.includes(prop) && properties[prop]) {
          me.props.push({
            head: prop,
            body: properties[prop]
          })

        }
      }
      me.overlay.setPosition(coordinate);
    }
    const handlePointerMove = handlePointerMoveLocal.bind(this);
    map.on('pointermove', handlePointerMove);

    measure.on('propertychange', event => {
      const control = event.target;

      if (control.get('active')) {
        map.un('pointermove', handlePointerMove);
      } else {
        map.on('pointermove', handlePointerMove);
      }
    });


    // map.on('pointermove', function (e) {
    //   if (e.dragging) {
    //     return;
    //   }
    //   const pixel = map.getEventPixel(e.originalEvent);
    //   const hit = map.hasFeatureAtPixel(pixel);
    //   map.getTarget().style.cursor = hit ? 'pointer' : '';
    // });


  }
})
</script>

<template>
  <div class="map" id="map"></div>
  <div id="popup" class="ol-popup bg-white p-2 rounded">
    <div class="flex justify-between">
      <div class="bg-green-100 flex-1 px-2 rounded">Properties</div>
      <div @click="closePopup" id="popup-closer"
           class="ol-popup-closer px-2 py-1 bg-green-400 rounded hover:bg-green-200 cursor-pointer">X
      </div>
    </div>
    <table id="popup-content" class="table-auto">
      <tr class="odd:bg-gray-200 hover:bg-green-100" v-for="prop in props">
        <td v-make-title class="pr-2">{{ prop.head }}</td>
        <td v-make-title>{{ prop.body }}</td>
      </tr>
    </table>
  </div>
</template>

<style scoped>
.map {
  width: var(--map-width);
  height: var(--content-height);
}

/*#popup-content{*/
/*  display: flex;*/
/*  flex-direction: column;*/
/*}*/


</style>

<style lang="scss">
.ol-control button {
  background-color: #2e7d32 !important;

  &:hover {
    background-color: #005005 !important;
  }

  &.active {
    background-color: #f9a825 !important;
  }
}

.ol-measurement {
  right: 1rem;
  left: unset;
}

//.ol-measurement button.active {
//  background-color: rgba(0, 60, 136, 1);
//}
</style>