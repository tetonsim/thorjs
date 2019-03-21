const THREE = require('three');

class Contour {
  constructor(result, component=0) {
    this.name = result.name;
    this.min = result.meta.min[component];
    this.max = result.meta.max[component];
    this.ncolors = 12;
    this.hues = [];
    this.colors = [];

    if (typeof component === 'string' && component.toUpperCase() === 'MAGNITUDE') {
      this.min = result.meta.magnitude.min;
      this.max = result.meta.magnitude.max;
    }

    let hue_min = 0.;
    let hue_max = 2. / 3.;

    let dhue = (hue_max - hue_min) / (this.ncolors - 1);

    let hue = hue_min;
    for (let h = 0; h < this.ncolors; h++) {
        this.hues.push(hue);
        hue = hue + dhue;
    }
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

  legend() {

  }
}

module.exports = Contour;