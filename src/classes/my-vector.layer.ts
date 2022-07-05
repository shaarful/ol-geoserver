import {Tile} from "ol/layer";
import VectorLayer from "ol/layer/Vector";

export class MyVectorLayer extends VectorLayer<any> {

    constructor(opt_options: any) {
        let option = {
            name: String,
            ...opt_options
        }
        super(option);
    }
}
