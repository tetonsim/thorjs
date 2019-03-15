const THREE = require('three');

class Node {
  constructor(result) {
    this.name = result.name;
    this.min = Infinity;
    this.max = -Infinity;
    this.ncolors = 12;
    this.hues = [];
    this.colors = [];

    for (var v in result.values) {
        var magn = Math.hypot(...(result.values[v].data));
        this.min = Math.min(this.min, magn);
        this.max = Math.max(this.max, magn)
    }

    var hue_min = 0.;
    var hue_max = 2. / 3.;

    var dhue = (hue_max - hue_min) / (this.ncolors - 1);

    var hue = hue_min;
    for (h = 0; h < this.ncolors; h++) {
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
    var value = Math.hypot(...data);
    var ihue = (this.ncolors - 1) * (value - this.max) / (this.min - this.max);
    ihue = Math.round(ihue);

    var lightness = 0.5;

    var c = new THREE.Color(0x000000);
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