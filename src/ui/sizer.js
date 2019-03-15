const THREE = require('three');

class Sizer {
  constructor(box_or_geom) {
    if (box_or_geom instanceof THREE.Geometry) {
      box_or_geom.computeBoundingBox();
      var box = box_or_geom.boundingBox;
    } else {
      var box = box_or_geom;
    }

    const dim = new THREE.Vector3();
    box.getSize(dim);

    var maxdim = Math.max(dim.x, dim.y, dim.z);

    this.box = box;
    this.cone = 0.025 * maxdim;
    this.arrow = 0.025 * maxdim;
    this.axesHelper = 0.5 * maxdim;

    const zoom = 3;
    const pos = zoom * maxdim;

    this.camera = {
        near: 0.01 * maxdim,
        far: 100 * maxdim,
        position: new THREE.Vector3(pos, pos, pos),
        lookAt: new THREE.Vector3(
            0.5 * (box.min.x + box.max.x),
            0.5 * (box.min.y + box.max.y),
            0.5 * (box.min.z + box.max.z))
    };
  }
}

module.exports = Sizer;