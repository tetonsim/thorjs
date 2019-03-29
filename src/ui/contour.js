const THREE = require('three');

class Contour {
  constructor(geom, params) {
    this.geom = geom;
    this.min = params.min;
    this.max = params.max;
    this.ncolors = 12;
    this.limitColor = new THREE.Color(0xffffff);
    this.NaNColor = new THREE.Color(0xffffff);
    this.hues = [];

    let hue_min = 0.;
    let hue_max = 2. / 3.;

    let dhue = (hue_max - hue_min) / (this.ncolors - 1);

    let hue = hue_min;
    for (let h = 0; h < this.ncolors; h++) {
        this.hues.push(hue);
        hue = hue + dhue;
    }
  }

  static paramsFromResult(result, component=0) {
    if (typeof component === 'string' && component.toUpperCase() === 'MAGNITUDE') {
      return {
        component: component,
        min: result.meta.magnitude.min,
        max: result.meta.magnitude.max,
      };
    }

    return {
      component: component,
      min: result.meta.min[component],
      max: result.meta.max[component],
    };
  }

  setMin(min) {
    this.min = min;
    this.updateVertexColors();
  }

  setMax(max) {
    this.max = max;
    this.updateVertexColors();
  }

  color(data) {
    if (data < this.min || data > this.max) {
      return this.limitColor;
    }

    if (isNaN(data)) {
      return this.NaNColor;
    }

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
    return this.valueNormalized(i / (this.ncolors - 1));
  }

  valueNormalized(n) {
    if (n <= 0) {
      return this.min;
    } else if (n >= this.ncolors) {
      return this.max;
    }

    return this.min + (this.max - this.min) * n;
  }
}

class FaceContour extends Contour {
  updateVertexColors() {
    for (let f of this.geom.faces) {
      let c = this.color(f.resultValue);
      f.vertexColors[0].set(c);
      f.vertexColors[1].set(c);
      f.vertexColors[2].set(c);
    }

    this.geom.colorsNeedUpdate = true;
  }
};

class VertexContour extends Contour {
  updateVertexColors() {
    for (let f of this.geom.faces) {
      f.vertexColors[0].set( this.color(this.geom.vertices[f.a].resultValue) );
      f.vertexColors[1].set( this.color(this.geom.vertices[f.b].resultValue) );
      f.vertexColors[2].set( this.color(this.geom.vertices[f.c].resultValue) );
    }

    this.geom.colorsNeedUpdate = true;
  }
};

module.exports = { Contour, FaceContour, VertexContour };