
const ElementTypes = {
  HEXL8: {
    FACE_INDICES: [[4, 3, 1], [2, 1, 3], [2, 3, 6], [7, 6, 3], [3, 4, 7], [8, 7, 4], [4, 1, 8], [5, 8, 1], [1, 2, 5], [6, 5, 2], [5, 6, 8], [7, 8, 6]],
    EDGE_INDICES: [[1, 2], [2, 3], [3, 4], [4, 1], [1, 5], [2, 6], [3, 7], [4, 8], [5, 6], [6, 7], [7, 8], [8, 5]]
  },

  WEDL6: {
    FACE_INDICES: [[1, 2, 4], [5, 4, 2], [2, 3, 5], [6, 5, 3], [1, 4, 3], [6, 3, 4], [1, 3, 2], [4, 5, 6]],
    EDGE_INDICES: [[1, 2], [2, 3], [3, 1], [4, 5], [5, 6], [6, 4], [4, 1], [5, 2], [6, 3]]
  },

  TETL4: {
    FACE_INDICES: [[1, 3, 2], [1, 2, 4], [1, 4, 3], [3, 4, 2]],
    EDGE_INDICES: [[1, 2], [2, 3], [3, 1], [4, 1], [4, 2], [4, 3]]
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