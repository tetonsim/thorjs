const THREE = require('three');

class Node {
  constructor(result, component=0) {
    this.name = result.name;
    this.min = Infinity;
    this.max = -Infinity;
    this.ncolors = 12;
    this.hues = [];
    this.colors = [];

    for (let val of result.values) {
        //let magn = Math.hypot(...(val.data));
        let magn = val.data[component];
        this.min = Math.min(this.min, magn);
        this.max = Math.max(this.max, magn)
    }

    let hue_min = 0.;
    let hue_max = 2. / 3.;

    let dhue = (hue_max - hue_min) / (this.ncolors - 1);

    let hue = hue_min;
    for (let h = 0; h < this.ncolors; h++) {
        this.hues.push(hue);
        hue = hue + dhue;
    }

    /*for (var v in result.values) {
        this.colors.push(
            this.color(result.values[v].data)
        );
    }*/
  }

  color(data) {
    //let value = Math.hypot(...data);
    let value = data;
    let ihue = (this.ncolors - 1) * (value - this.max) / (this.min - this.max);
    ihue = Math.round(ihue);

    let lightness = 0.5;

    let c = new THREE.Color(0x000000);
    c.setHSL(this.hues[ihue], 1., lightness);

    return c;
  }

  value(i) {
      if (i <= 0) {
          return this.min;
      } else if (i >= this.ncolors) {
          return this.max;
      }

      return this.min + (this.max - this.min) * (i / this.ncolors);
  }
}

const Contour = {
  Node: Node
};

module.exports = Contour;