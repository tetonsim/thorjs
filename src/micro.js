const { Elastic, Material, Composite } = require('./material');
const { PrintConfig } = require('./print');

class JobMaterial {
  constructor(name, source, source_name) {
    this.name = name;
    this.source = source;
    this.source_name = source_name;
  }

  static FromMaterial(name, source_name) {
    return new JobMaterial(name, 'materials', source_name);
  }

  static FromJob(name, source_name) {
    return new JobMaterial(name, 'job', source_name);
  }
}

class UnitCell {
  constructor(unit_cell) {
    this.unit_cell = unit_cell;
  }
}

class Hexpack extends UnitCell {
  constructor(volume_fraction) {
    super("continuous_hexagonal_pack");
    this.volume_fraction = volume_fraction;
  }
}

class ParticulateBCC extends UnitCell {
  constructor(volume_fraction) {
    super("spherical_particulate_bcc");
    this.volume_fraction = volume_fraction;
  }
}

class ShortFiber extends UnitCell {
  constructor(volume_fraction, L_over_D) {
    super("short_fiber");
    this.volume_fraction = volume_fraction;
    this.L_over_D = L_over_D;
  }
}

class ExtrudedLayer extends UnitCell {
  constructor(print) {
    super("solid_layer");
    this.layer_width = print.layer_width;
    this.layer_height = print.layer_height;
    this.overlap = print.overlap;
    this.mesh_seed = 0.1; // TODO how can we get a good default based on print config?
  }
}

class InfillSquare extends UnitCell {
  constructor(volume_fraction, layer_width) {
    super("infill_square");
    this.volume_fraction = volume_fraction;
    this.layer_width = layer_width;
    this.mesh_seed = 0.5;
  }
}

class InfillTriangle extends UnitCell {
  constructor(volume_fraction, layer_width) {
    super("infill_triangle");
    this.volume_fraction = volume_fraction;
    this.layer_width = layer_width;
    this.mesh_seed = 0.5;
  }
}

class Job {
  constructor(name, geometry) {
    this.name = name;
    this.geometry = geometry;
    this.materials = [];
  }
}

class Micro {
  constructor() {
    this.materials = [];
    this.jobs = [];
  }
}

/**
 * Represents a micromechanics run
 */
class MicroRun {
  constructor(micro, target) {
    this.input = micro;
    this.target = target;
  }
}

const JobBuilders = {
  Hexpack: function(composite) {
    let hexpack = new Hexpack(composite.volume_fraction);
    let jhexpack = new Job('hexpack', hexpack);

    jhexpack.materials.push(
      JobMaterial.FromMaterial('fiber', composite.fiber.name),
      JobMaterial.FromMaterial('matrix', composite.matrix.name)
    );

    return jhexpack;
  },

  Particulate: function(composite) {
    let part = new ParticulateBCC(composite.volume_fraction);
    let jpart = new Job('particulate', part);

    jpart.materials.push(
      JobMaterial.FromMaterial('fiber', composite.fiber.name),
      JobMaterial.FromMaterial('matrix', composite.matrix.name)
    );

    return jpart;
  },

  ShortFiber: function(jhexpack, jpart, composite) {
    let sf = new ShortFiber(composite.volume_fraction, composite.L_over_D);
    let jsf = new Job('short_fiber', sf);

    jsf.materials.push(
      JobMaterial.FromJob('infinite', jhexpack.name),
      JobMaterial.FromJob('end', jpart.name)
    );

    return jsf;
  },

  ExtrudedLayer: function(source, print) {
    let layer = new ExtrudedLayer(print);
    let jlayer = new Job('layer', layer);

    if (source instanceof Material) {
      jlayer.materials.push(
        JobMaterial.FromMaterial('plastic', source.name)
      );
    } else if (source instanceof Job) {
      jlayer.materials.push(
        JobMaterial.FromJob('plastic', source.name)
      );
    } else {
      throw 'Invalid type';
    }

    return jlayer;
  },

  Infill: function(jlayer, print) {
    if (print.infill_type === 'grid' || print.infill_type === 'square') {
      var infill = new InfillSquare(print.infill_volume_fraction, print.layer_width);
    } else if (print.infill_type === 'triangle') {
      var infill = new InfillTriangle(print.infill_volume_fraction, print.layer_width);
    }
    
    let jinfill = new Job('infill', infill);

    jinfill.materials.push(
      JobMaterial.FromJob('extrusion', jlayer.name)
    );

    return jinfill;
  }
}

/**
 * Helper functions to build up the Micro run for common use cases
 * @namespace
 */
const Builders = {
  /**
   * Builds a Micro run with a target Hexpack job
   * @param {Composite} composite Composite , fiber and matrix must have Elastic definitions
   */
  Hexpack: function(composite) {
    var micro = new Micro();
    
    micro.materials.push(composite.matrix, composite.fiber);

    var jhexpack = JobBuilders.Hexpack(composite);

    micro.jobs.push(jhexpack);

    var run = new MicroRun(micro, jhexpack.name);

    return run;
  },

  /**
   * Builds a Micro run with a target Spherical Particulate BCC job
   * @param {Composite} composite Composite , fiber and matrix must have Elastic definitions
   */
  Particulate: function(composite) {
    var micro = new Micro();

    micro.materials.push(composite.matrix, compositefiber);

    var jpart = JobBuilders.Particulate(composite);

    micro.jobs.push(jpart);

    var run = new MicroRun(micro, jpart.name);

    return run;
  },

  /**
   * Builds a Micro run with a target ShortFiber job
   * @param {Composite} composite Composite , fiber and matrix must have Elastic definitions
   */
  ShortFiber: function(composite) {
    var micro = new Micro();

    micro.materials.push(composite.matrix, composite.fiber);

    var jhexpack = JobBuilders.Hexpack(composite);
    var jpart = JobBuilders.Particulate(composite);
    var jsf = JobBuilders.ShortFiber(jhexpack, jpart, composite);

    micro.jobs.push(jhexpack, jpart, jsf);

    return new MicroRun(micro, jsf.name);
  },

  /**
   * Builds a Micro run with a target Extruded Layer job
   * @param {(Material|Composite)} material Print material
   * @param {Print} print
   */
  ExtrudedLayer: function(material, print) {
    var micro = new Micro();

    if (material instanceof Material) {
      micro.materials.push(material);

      var jlayer = JobBuilders.ExtrudedLayer(material, print);

      micro.jobs.push(jlayer);
    } else if (material instanceof Composite) {
      micro.materials.push(material.matrix, material.fiber);

      let jhexpack = JobBuilders.Hexpack(material);
      let jpart = JobBuilders.Particulate(material);

      // Hexpack and particulate feed into short fiber
      let jsf = JobBuilders.ShortFiber(jhexpack, jpart, material);

      // short fiber feeds into extruded layer model
      var jlayer = JobBuilders.ExtrudedLayer(jsf, print);

      micro.jobs.push(jhexpack, jpart, jsf, jlayer);
    }

    return new MicroRun(micro, jlayer.name);
  },

  /**
   * Builds a Micro run with a target Infill job. Infill configuration is picked
   * up from the print configuration.
   * @param {(Material|Composite)} material Print material
   * @param {Print} print
   */
  Infill: function(material, print) {
    var micro = new Micro();

    if (material instanceof Material) {
      micro.materials.push(material);

      let jlayer = JobBuilders.ExtrudedLayer(material, print);

      // extrusion layer feeds into infill unit cell
      var jinfill = JobBuilders.Infill(jlayer, print);

      micro.jobs.push(jlayer, jinfill);

    } else if (material instanceof Composite) {
      micro.materials.push(material.matrix, material.fiber);

      let jhexpack = JobBuilders.Hexpack(material);
      let jpart = JobBuilders.Particulate(material);

      // Hexpack and particulate feed into short fiber
      let jsf = JobBuilders.ShortFiber(jhexpack, jpart, material);

      // short fiber feeds into extruded layer unit cell
      let jlayer = JobBuilders.ExtrudedLayer(jsf, print);

      // extrusion layer feeds into infill unit cell
      var jinfill = JobBuilders.Infill(jlayer, print);

      micro.jobs.push(jhexpack, jpart, jsf, jlayer, jinfill);
    }

    return new MicroRun(micro, jinfill.name);
  }
};

module.exports = { Micro, Builders };
