import {defineStore} from 'pinia'
import type Map from 'ol/Map';


export const useMapStore = defineStore({
    id: 'map',
    state: () => ({
        map: undefined as Map | undefined,
    }),
    getters: {
        getMap: (state) => state.map
    },
    actions: {
        setMap(map: Map) {
            this.map = map;
        }
    }
})
