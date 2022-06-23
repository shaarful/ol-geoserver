import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import './main.scss'
import 'ol/ol.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
