const THREE = require('three');

class Sizer {
  constructor(geom) {
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    this.box = geom.boundingBox;
    this.sphere = geom.boundingSphere;

    this.dim = new THREE.Vector3();
    this.box.getSize(this.dim);

    let maxdim = Math.max(this.dim.x, this.dim.y, this.dim.z);

    this.cone = 0.025 * maxdim;
    this.arrow = 0.025 * maxdim;
    this.axesHelper = 0.5 * maxdim;
    this.center = this.box.getCenter();

    const zoom = 3;
    const pos = zoom * maxdim;

    this.camera = {
        near: 0.01 * maxdim,
        far: 100 * maxdim,
        position: new THREE.Vector3(pos, pos, pos)
    };
  }

  maxDimension() {
    return Math.max(this.dim.x, this.dim.y, this.dim.z);
  }
}

module.exports = Sizer;