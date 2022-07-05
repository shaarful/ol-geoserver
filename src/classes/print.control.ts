import {Control, ScaleLine} from "ol/control";
import {getPointResolution} from "ol/proj";
import html2canvas from "html2canvas";
import {jsPDF} from "jspdf";
import type {Coordinate} from "ol/coordinate";
import type Map from "ol/Map";

export default class PrintControl extends Control {
    format: HTMLSelectElement;
    resolution: HTMLSelectElement;
    scale: HTMLSelectElement;
    scaleLine: ScaleLine;

    constructor(opt_options?: any) {
        const options = opt_options || {};

        const button = document.createElement('button');

        button.className = "fa-solid fa-print";
        button.setAttribute('type', 'LineString');
        const printControlContainer = document.createElement('div');
        const format = document.createElement('select');
        const formatOption = `<option value="a0">A0</option>
                              <option value="a1">A1</option>
                              <option value="a2">A2</option>
                              <option value="a3">A3</option>
                              <option value="a4" selected>A4</option>
                              <option value="a5">A5</option>`;
        format.insertAdjacentHTML('beforeend', formatOption);

        const resolution = document.createElement('select');
        const resolutionOption = `<option value="72">72 dpi</option>
                                  <option value="150">150 dpi</option>
                                  <option value="200" selected>200 dpi</option>
                                  <option value="300">300 dpi</option>`;
        resolution.insertAdjacentHTML('beforeend', resolutionOption);

        const scale = document.createElement('select');
        const scaleOption = `<option value="500">1:500000</option>
                              <option value="250">1:250000</option>
                              <option value="100">1:100000</option>
                              <option value="50">1:50000</option>
                              <option value="25">1:25000</option>
                              <option value="10">1:10000</option>`;
        scale.insertAdjacentHTML('beforeend', scaleOption);


        const form = document.createElement('form');
        form.appendChild(format);
        form.appendChild(resolution);
        form.appendChild(scale);


        // const controlHtml = `<form class="print-form">
        //                            <label for="format">Page size</label>
        //                             <select id="format">
        //                               <option value="a0">A0</option>
        //                               <option value="a1">A1</option>
        //                               <option value="a2">A2</option>
        //                               <option value="a3">A3</option>
        //                               <option value="a4" selected>A4</option>
        //                               <option value="a5">A5</option>
        //                             </select>
        //                             <label for="resolution">Resolution</label>
        //                             <select id="resolution">
        //                               <option value="72">72 dpi</option>
        //                               <option value="150">150 dpi</option>
        //                               <option value="200" selected>200 dpi</option>
        //                               <option value="300">300 dpi</option>
        //                             </select>
        //                             <label for="scale">Scale</label>
        //                             <select id="scale">
        //                               <option value="500">1:500000</option>
        //                               <option value="250" selected>1:250000</option>
        //                               <option value="100">1:100000</option>
        //                               <option value="50">1:50000</option>
        //                               <option value="25">1:25000</option>
        //                               <option value="10">1:10000</option>
        //                             </select>
        //                               <button class="fa-solid fa-file-export"></button>
        //                           </form>`;
        // printControlContainer.insertAdjacentHTML('beforeend', controlHtml);
        printControlContainer.appendChild(form);

        const element = document.createElement('div');
        element.className = 'ol-print ol-unselectable ol-control';
        element.appendChild(printControlContainer);
        element.appendChild(button);

        super({
            element: element,
            target: options.target,
        });

        this.format = format;
        this.resolution = resolution;
        this.scale = scale;
        this.scaleLine = options.scaleLine;

        button.addEventListener('click', this.handlePrint.bind(this));

    }


    handlePrint(evt: any) {

        evt.target.disabled = true;
        document.body.style.cursor = 'progress';
        const map = this.getMap()!;
        const dims: { [key: string]: any } = {
            a0: [1189, 841],
            a1: [841, 594],
            a2: [594, 420],
            a3: [420, 297],
            a4: [297, 210],
            a5: [210, 148],
        };
        const format = this.format.value;
        const resolution: number = +this.resolution.value;
        const scale: number = +this.scale.value;
        const dim = dims[format];
        const width = Math.round((dim[0] * resolution) / 25.4);
        const height = Math.round((dim[1] * resolution) / 25.4);
        const viewResolution = map.getView().getResolution();
        const scaleResolution =
            scale / getPointResolution(
            map.getView().getProjection(),
            resolution / 25.4,
            map.getView().getCenter()!);

        const exportOptions = {
            useCORS: true,
            ignoreElements: function (element: any) {
                const className = element.className || '';
                return !(
                    className.indexOf('ol-control') === -1 ||
                    className.indexOf('ol-scale') > -1 ||
                    (className.indexOf('ol-attribution') > -1 &&
                        className.indexOf('ol-uncollapsible'))
                );
            },
            width: width,
            height: height
        };

        const me = this;
        map.once('rendercomplete', function () {
            exportOptions.width = width;
            exportOptions.height = height;
            html2canvas(map.getViewport(), exportOptions).then(function (canvas: any) {
                const pdf = new jsPDF('landscape', undefined, format);
                pdf.addImage(
                    canvas.toDataURL('image/jpeg'),
                    'JPEG',
                    0,
                    0,
                    dim[0],
                    dim[1]
                );
                pdf.save('map.pdf');
                // @ts-ignore
                me.scaleLine.setDpi();
                map.getTargetElement().style.width = '';
                map.getTargetElement().style.height = '';
                map.updateSize();
                map.getView().setResolution(viewResolution);
                evt.target.disabled = false;
                document.body.style.cursor = 'auto';
            });
        });

        this.scaleLine.setDpi(resolution);
        map.getTargetElement().style.width = width + 'px';
        map.getTargetElement().style.height = height + 'px';
        map.updateSize();
        map.getView().setResolution(scaleResolution);

    }


    getScaleFromResolution = function (resolution: any, units: any, opt_round: any) {

        const INCHES_PER_UNIT: { [key: string]: number } = {
            'm': 39.37,
            'dd': 4374754
        };
        const DOTS_PER_INCH = 25.4 / 0.28;

        let scale = INCHES_PER_UNIT[units] * DOTS_PER_INCH * resolution;
        if (opt_round) {
            scale = Math.round(scale);
        }
        return scale;
    };


    getScale() {
        const resolution = getPointResolution(this.getMap()!.getView().getProjection(),
            this.getMap()!.getView().getResolution() as number, this.getMap()!.getView().getCenter() as Coordinate,
            this.getMap()!.getView().getProjection().getUnits());
        const dpi = 25.4 / 0.28;
        const inchesPerMeter = 1000 / 25.4;
        return parseFloat(resolution.toString()) * inchesPerMeter * dpi;
    };

    handleChangeResolution(event: any) {
        // console.log(this.getScale());

        this.scale.removeChild(this.scale.lastChild!);
        this.addCurrentScale();
    }

    addCurrentScale() {
        const option: HTMLOptionElement = document.createElement('option');
        option.selected = true;
        option.value = Math.round(this.getScale() / 1000).toString();
        option.innerText = `1: ${Math.round(this.getScale())}`;
        this.scale.appendChild(option)
    }

    setMap(map: Map) {
        super.setMap(map);
        this.addCurrentScale();
        map.getView().on('change:resolution', this.handleChangeResolution.bind(this))
    }

}