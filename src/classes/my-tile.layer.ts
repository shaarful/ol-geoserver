import {Tile} from "ol/layer";

export class MyTileLayer extends Tile<any> {

  constructor(opt_options: any) {
    let option = {
      name: String,
      ...opt_options
    }
    super(option);
  }
}
