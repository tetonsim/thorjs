
class Face {
  constructor(id, nodes) {
    this.id = id;
    this.nodes = nodes;
    //this.triangulation = triangulation;
  }

  triangulate(connectivity) {
    if (this.nodes.length === 3) {
      return [
        [ connectivity[this.nodes[0]], connectivity[this.nodes[1]], connectivity[this.nodes[2]] ]
      ];
    } else if (this.nodes.length === 4) {
      return [
        [ connectivity[this.nodes[0]], connectivity[this.nodes[1]], connectivity[this.nodes[3]] ],
        [ connectivity[this.nodes[2]], connectivity[this.nodes[3]], connectivity[this.nodes[1]] ]
      ];
    }
    throw 'Unexpected node count in face ' + this.nodes.length;
  }

  nodeKey(connectivity) {
    let gnodes = [];
    for (let n of this.nodes) {
      gnodes.push(connectivity[n]);
    }
    gnodes.sort();
    return gnodes.toString();
  }
};

const ElementTypes = {
  HEXL8: {
    EDGE_INDICES: [[1, 2], [2, 3], [3, 4], [4, 1], [1, 5], [2, 6], [3, 7], [4, 8], [5, 6], [6, 7], [7, 8], [8, 5]],
    FACES: [
      new Face(1, [1, 4, 3, 2]),
      new Face(2, [5, 6, 7, 8]),
      new Face(3, [1, 2, 6, 5]),
      new Face(4, [2, 3, 7, 6]),
      new Face(5, [4, 8, 7, 3]),
      new Face(6, [4, 1, 5, 8])
    ]
  },

  WEDL6: {
    EDGE_INDICES: [[1, 2], [2, 3], [3, 1], [4, 5], [5, 6], [6, 4], [4, 1], [5, 2], [6, 3]],
    FACES: [
      new Face(1, [1, 3, 2]),
      new Face(2, [4, 5, 6]),
      new Face(3, [1, 2, 5, 4]),
      new Face(4, [2, 3, 6, 5]),
      new Face(5, [1, 4, 6, 3])
    ]
  },

  TETL4: {
    EDGE_INDICES: [[1, 2], [2, 3], [3, 1], [4, 1], [4, 2], [4, 3]],
    FACES: [
      new Face(1, [2, 1, 3]),
      new Face(2, [1, 2, 4]),
      new Face(3, [2, 3, 4]),
      new Face(4, [1, 4, 3])
    ]
  }
};

const Mesh = {
  ElementTypes: ElementTypes,

  elementTypeFromString: function(elemType) {
    let u = elemType.toUpperCase();
    
    if (u === 'HEXL8') {
      return ElementTypes.HEXL8;
    } else if (u === 'WEDL6') {
      return ElementTypes.WEDL6;
    } else if (u === 'TETL4') {
      return ElementTypes.TETL4;
    }

    return null;
  }
}

module.exports = Mesh;