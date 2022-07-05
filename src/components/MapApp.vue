<script lang="ts">
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import View from 'ol/View';
import {TileWMS} from "ol/source";
import {defineComponent} from "vue";
import {fromLonLat} from "ol/proj";
import {useMapStore} from "@/stores/map"
import {mapStores} from "pinia";
import {MyTileLayer} from "@/classes/my-tile.layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {MyVectorLayer} from "@/classes/my-vector.layer";
import {defaults as defaultControls, MousePosition, ScaleLine} from 'ol/control';
import {Fill, Icon, Stroke, Style, Text as textStyle} from "ol/style";
import CircleStyle from "ol/style/Circle";
import {Feature, Overlay} from "ol";
import MeasurementControl from "@/classes/measurement.control";
import type {PopupProperty} from "@/models/PopupProperty";
import PrintControl from "@/classes/print.control";

// https://geoserver.qler.dk/geoserver/qler/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=qler:brandhaner&maxFeatures=50&outputFormat=application/json
// https://geoserver.qler.dk/geoserver/qler/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=qler:ledninger&outputFormat=application/json

import sq from "@/assets/square.svg";


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
      lineProps: ['PVC', 'PE', 'PEM', 'xx', 'PEL'],
      lineColors: ['#B03A2E', '#424949', '#2874A6', '#117A65', '#D68910'],
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
    const measure = new MeasurementControl();
    const scaleLine = new ScaleLine({bar: true, text: true, minWidth: 125});


    const line = new MyVectorLayer({
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
      style: function (feature: Feature) {
        // console.log(feature.getProperties());
        // const color = feature.get('COLOR') || '#eeeeee';
        // style.getFill().setColor(color);

        let prop = feature.getProperties()["ler_udvendigMateriale"];
        let index = me.lineProps.indexOf(prop);
        if (index !== -1) {
          return new Style({
            stroke: new Stroke({
              color: me.lineColors[index],
              width: 3,
            })
          });
        }

        return me.getStyle();
      },
    });
    const point = new MyVectorLayer({
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
      style: function (feature: Feature) {

        // const color = feature.get('COLOR') || '#eeeeee';
        // style.getFill().setColor(color);


        // return new Style({
        //   text: new textStyle({
        //     text: '\uf1ad',
        //     font: '900 18px Font Awesome 6 Free',
        //     // textBaseline: 'Bottom',
        //     // fill: new Fill({
        //     //   color: 'white',
        //     // })
        //   })
        // });


        if (feature.getProperties().ler_type === 'tapsted') {

          return new Style({
            image: new Icon({
              src: sq,
              color: 'rgba(63, 205, 116, 0.7)',
              imgSize: [20, 20],
              crossOrigin: 'anonymous',
            }),
          });
        } else {
          return me.getStyle();
        }

      },
    });

    const map = new Map({
      controls: defaultControls().extend([
        // new MousePosition({projection: 'EPSG:4326'}),
        scaleLine,
        new PrintControl({scaleLine}),
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

        line,
        point

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
      // if (feature) {
      //   // feature.setStyle(oldStyle);
      // }
      me.props = [];
      me.overlay.setPosition(undefined);
      if (features.length == 0) {
        return;
      }
      feature = features[0];
      const coordinate = event.coordinate;
      const properties = feature.getProperties();

      // feature.setStyle(this.getStyle('hltColor'));
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

  }
})
</script>

<template>
  <!--  <div class="map" id="map"></div>-->

  <div class="wrapper">
    <div id="map" class="map">
      <div class="legend p-3 rounded bg-white">
        <div>Legend</div>
        <div class="legend-content">
          <div class="mb-2 ml-2">Line (Ler Udvendig Materiale)</div>
          <div v-for="(a, i) in lineProps" class="legend-item">
              <span class="mr-5 relative">
                <span class="line" :style="{backgroundColor: lineColors[i]+'!important'}"></span>
              </span>
            <span>{{ a }}</span>
          </div>
          <div class="legend-item">
              <span class="mr-5 relative">
                <span class="line"></span>
              </span>
            <span>Others</span>
          </div>

          <div class="my-2 ml-2">Point (Ler Type)</div>
          <div class="legend-item">
              <span class="mr-5 relative">
                <img src="@/assets/square.svg" class="square absolute left-2/4"/>
              </span>
            <span>Tapsted</span>
          </div>
          <div class="legend-item">
              <span class="mr-5 relative">
                <span class="point"></span>
              </span>
            <span>Others</span>
          </div>

        </div>
      </div>
    </div>
  </div>

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

<style scoped lang="scss">
.legend {
  position: absolute;
  right: 1rem;
  bottom: 2rem;
  z-index: 1;

  .legend-content {
    .line {
      width: 5px;
      height: 20px;
      background-color: rgba(164, 75, 222, 0.5);
      border: 1px solid rgba(164, 75, 222, 0.5);
      transform: rotate(45deg);
      position: absolute;
      left: 50%;
    }

    .point {
      width: 20px;
      height: 20px;
      background-color: rgba(63, 205, 116, 0.7);
      border: 3px solid rgba(3, 116, 47, 0.7);
      border-radius: 50%;
      position: absolute;
      left: 50%;
    }

    .legend-item {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
}


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
  right: .5rem;
  left: unset;
}

.ol-print {
  right: 2.5rem;
  left: unset;
}


.wrapper {
  max-width: var(--map-width);
  width: var(--map-width);
  height: var(--content-height);
  overflow: hidden;

  .map {
    width: 100%;
    height: 100%;
  }
}

</style>