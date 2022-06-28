import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import './main.scss'
import 'ol/ol.css'
import makeTitle from "@/directives/makeTitle";

import {library} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'

import {faDrawPolygon} from "@fortawesome/free-solid-svg-icons";

library.add(faDrawPolygon)

// import "@fortawesome/fontawesome-free/js/all"

import "@fortawesome/fontawesome-free/scss/fontawesome.scss";
import "@fortawesome/fontawesome-free/scss/solid.scss";
import "@fortawesome/fontawesome-free/scss/brands.scss";

const app = createApp(App)

app.use(createPinia())
app.component('font-awesome-icon', FontAwesomeIcon)

app.directive('makeTitle', makeTitle)

app.mount('#app')
