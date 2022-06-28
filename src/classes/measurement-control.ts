import {Control} from "ol/control";
import {Draw} from "ol/interaction";
import {Fill, Stroke, Style} from "ol/style";
import CircleStyle from "ol/style/Circle";
import {LineString, Polygon} from "ol/geom";
import {unByKey} from "ol/Observable";
import VectorSource from "ol/source/Vector";
import {MyVectorLayer} from "@/classes/my-vector-layer";
import {getArea, getLength} from "ol/sphere";
import {Overlay} from "ol";

export default class MeasurementControl extends Control {
    sketch: any;
    helpTooltipElement: any;
    helpTooltip: any;
    measureTooltipElement: any;
    measureTooltip: any;
    continuePolygonMsg = 'Click to continue drawing the polygon';
    continueLineMsg = 'Click to continue drawing the line';

    source = new VectorSource();

    constructor(opt_options: any) {
        const options = opt_options || {};

        const line = document.createElement('button');
        const polygon = document.createElement('button');

        line.className = 'fa-solid fa-ruler'
        polygon.className = 'fa-solid fa-draw-polygon'

        line.setAttribute('type', 'LineString');
        polygon.setAttribute('type', 'Polygon');

        polygon.getAttribute('type')

        const element = document.createElement('div');
        element.className = 'ol-measurement ol-unselectable ol-control';
        element.appendChild(line);
        element.appendChild(polygon);

        super({
            element: element,
            target: options.target,
        });


        this.setProperties({
            lineInteraction: this.getInteraction('LineString'),
            polygonInteraction: this.getInteraction('Polygon'),
            active: false,
            type: 'toggle',
            drawType: 'LineString',
            destroyFunction: function (evt: any) {
                if (evt.element === this) {
                    this.removeInteraction(this.get('lineInteraction'));
                    this.removeInteraction(this.get('polygonInteraction'));
                }
            }
        });


        line.addEventListener('click', this.handleMeasurement.bind(this) );
        polygon.addEventListener('click', this.handleMeasurement.bind(this));


        this.on('propertychange', this.onPropertyChange.bind(this))
    }

    handleMeasurement(evt: any) {
        evt.stopPropagation();

        this.set('drawType', evt.target.getAttribute('type'));
        if (evt.target.dataset.active == 'true') {
            this.set('active', false);
        } else {
            this.set('active', true);
        }

        for (let i = 0; i < this.element.children.length; i++) {
            this.element.children[i].classList.remove('active')
        }


        if (this.get('active')) {
            evt.target.dataset.active = true;
            evt.target.classList.add('active');
        } else {
            evt.target.dataset.active = false;
            evt.target.classList.remove('active');
        }

    }

    onPropertyChange(evt: any) {
        if (this.get('drawType') === 'LineString') {
            this.get('lineInteraction').setActive(this.get('active'));
            this.get('polygonInteraction').setActive(false);

        } else {
            this.get('lineInteraction').setActive(false);
            this.get('polygonInteraction').setActive(this.get('active'));
        }

        if (this.get('active')) {
            // this.getMap()?.on('pointermove', this.pointerMoveHandler);
            this.element.classList.add('active');
            this.getMap()?.getControls().forEach((controlToDisable: Control) => {
                if (controlToDisable.get('type') === 'toggle' && controlToDisable !== this) {
                    controlToDisable.set('active', false);
                }
            });
        } else {
            // this.getMap()?.un('pointermove', this.pointerMoveHandler);
            this.element.classList.remove('active');
            this.source.clear();
            this.getMap()?.removeOverlay(this.measureTooltip);
        }


    }

    getInteraction(drawType: string) {
        let draw
        draw = new Draw({
            source: this.source,
            type: drawType,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)',
                }),
                stroke: new Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2,
                }),
                image: new CircleStyle({
                    radius: 5,
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 0, 0.7)',
                    }),
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.2)',
                    }),
                }),
            }),
        });

        this.createMeasureTooltip();
        this.createHelpTooltip();

        let listener: any;
        let me = this;
        draw.on('drawstart', function (evt: any) {
            me.sketch = evt.feature;
            let tooltipCoord = evt.coordinate;
            me.source.clear();
            me.getMap()?.removeOverlay(me.measureTooltip);
            me.createMeasureTooltip();

            listener = me.sketch.getGeometry().on('change', function (evt: any) {
                const geom = evt.target;
                let output;
                if (geom instanceof Polygon) {
                    output = me.formatArea(geom);
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof LineString) {
                    output = me.formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                }

                me.measureTooltipElement.innerHTML = output;
                me.measureTooltip.setPosition(tooltipCoord);
            });
        });

        draw.on('drawend', function () {
            me.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
            me.measureTooltip.setOffset([0, -7]);
            me.sketch = null;
            me.measureTooltipElement = null;
            // me.createMeasureTooltip();
            unByKey(listener);
        });

        return draw;
    }

    formatLength(line: any) {
        const length = getLength(line);
        let output;
        if (length > 100) {
            output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
        } else {
            output = Math.round(length * 100) / 100 + ' ' + 'm';
        }
        return output;
    };

    formatArea(polygon: any) {
        const area = getArea(polygon);
        let output;
        if (area > 10000) {
            output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
        } else {
            output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
        }
        return output;
    };

    createHelpTooltip() {
        if (this.helpTooltipElement) {
            this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
        }
        this.helpTooltipElement = document.createElement('div');
        this.helpTooltipElement.className = 'ol-tooltip hidden';
        this.helpTooltip = new Overlay({
            element: this.helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left',
        });
        this.getMap()?.addOverlay(this.helpTooltip);
    }

    createMeasureTooltip() {
        if (this.measureTooltipElement) {
            this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
        }
        this.measureTooltipElement = document.createElement('div');
        this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
        this.measureTooltip = new Overlay({
            element: this.measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center',
            stopEvent: false,
            insertFirst: false,
        });
        this.getMap()?.addOverlay(this.measureTooltip);
    }

    pointerMoveHandler = this.pointerMoveHandlerLocal.bind(this)

    pointerMoveHandlerLocal(evt: any) {
        if (evt.dragging) {
            return;
        }
        let helpMsg = 'Click to start drawing';
        if (this.sketch) {
            const geom = this.sketch.getGeometry();
            if (geom instanceof Polygon) {
                helpMsg = this.continuePolygonMsg;
            } else if (geom instanceof LineString) {
                helpMsg = this.continueLineMsg;
            }
        }
        this.helpTooltipElement.innerHTML = helpMsg;
        this.helpTooltip.setPosition(evt.coordinate);
        this.helpTooltipElement.classList.remove('hidden');

    };


    setMap(map: any) {
        Control.prototype.setMap.call(this, map);
        const vector = new MyVectorLayer({
            source: this.source,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)',
                }),
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2,
                }),
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: '#ffcc33',
                    }),
                }),
            }),
        });
        vector.setMap(map);
        let lineInteraction = this.get('lineInteraction');
        let polygonInteraction = this.get('polygonInteraction');
        if (map === null) {
            unByKey(this.get('eventId'));
        } else if (map.getInteractions().getArray().indexOf(lineInteraction) === -1) {
            map.addInteraction(lineInteraction);
            map.addInteraction(polygonInteraction);
            lineInteraction.setActive(false);
            polygonInteraction.setActive(false);
            this.set('eventId', map.getControls().on('remove', this.get('destroyFunction'), map));
            // vector.setMap(null);
        }
    };
}