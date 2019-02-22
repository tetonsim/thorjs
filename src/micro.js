const Material = require('./material');
const Hardware = require('./hardware');

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

/**
 * Input to a micromechanics run
 * @memberof Micro
 * @property {Material.FEA[]} materials
 * @property {Micro.Job[]} jobs
 */
class Input {
  constructor() {
    this.materials = [];
    this.jobs = [];
  }
}

/**
 * Represents a micromechanics run
 * @memberof Micro
 * @property {string} id
 * @property {string} error Error message, if applicable
 * @property {Input} input Full micromechanics input definition
 * @property {string} target The name of a job in micro that results will be calculated for
 * @property {string} status Status of the run (waiting, running, completed, or failed)
 * @property {Result} result Result of the run, if available 
 */
class Run {
  /**
   * 
   * @param {Input} input 
   * @param {string} target The name of a job in micro that results will be calculated for
   */
  constructor(input, target) {
    this.id = null;
    this.error = null;
    this.expires = null;
    this.input = input;
    this.target = target;
    this.status = null;
    this.result = null;
  }
}

/**
 * The results from a successful run of MicroRun
 * @typedef {Object} Result
 * @memberof Micro
 * @property {Object} meta Meta information about the run
 * @property {Material.Material[]} materials
 */


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

    if (source instanceof Material.FEA) {
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
 * @memberof Micro
 */
const Builders = {
  /**
   * Builds a Micro run with a target Hexpack job
   * @param {Material.Composite} composite Composite, fiber and matrix must have Elastic definitions
   */
  Hexpack: function(composite) {
    var micro = new Input();
    
    micro.materials.push(composite.matrix, composite.fiber);

    var jhexpack = JobBuilders.Hexpack(composite);

    micro.jobs.push(jhexpack);

    var run = new Run(micro, jhexpack.name);

    return run;
  },

  /**
   * Builds a Micro run with a target Spherical Particulate BCC job
   * @param {Material.Composite} composite Composite, fiber and matrix must have Elastic definitions
   */
  Particulate: function(composite) {
    var micro = new Input();

    micro.materials.push(composite.matrix, composite.fiber);

    var jpart = JobBuilders.Particulate(composite);

    micro.jobs.push(jpart);

    var run = new Run(micro, jpart.name);

    return run;
  },

  /**
   * Builds a Micro run with a target ShortFiber job
   * @param {Material.Composite} composite Composite, fiber and matrix must have Elastic definitions
   */
  ShortFiber: function(composite) {
    var micro = new Input();

    micro.materials.push(composite.matrix, composite.fiber);

    var jhexpack = JobBuilders.Hexpack(composite);
    var jpart = JobBuilders.Particulate(composite);
    var jsf = JobBuilders.ShortFiber(jhexpack, jpart, composite);

    micro.jobs.push(jhexpack, jpart, jsf);

    return new Run(micro, jsf.name);
  },

  /**
   * Builds a Micro run with a target Extruded Layer job
   * @param {Material.FEA|Material.Composite} material Print material
   * @param {Hardware.Config} printConfig
   */
  ExtrudedLayer: function(material, printConfig) {
    var micro = new Input();

    if (material instanceof Material.FEA) {
      micro.materials.push(material);

      var jlayer = JobBuilders.ExtrudedLayer(material, printConfig);

      micro.jobs.push(jlayer);
    } else if (material instanceof Material.Composite) {
      micro.materials.push(material.matrix, material.fiber);

      let jhexpack = JobBuilders.Hexpack(material);
      let jpart = JobBuilders.Particulate(material);

      // Hexpack and particulate feed into short fiber
      let jsf = JobBuilders.ShortFiber(jhexpack, jpart, material);

      // short fiber feeds into extruded layer model
      var jlayer = JobBuilders.ExtrudedLayer(jsf, printConfig);

      micro.jobs.push(jhexpack, jpart, jsf, jlayer);
    }

    return new Run(micro, jlayer.name);
  },

  /**
   * Builds a Micro run with a target Infill job. Infill configuration is picked
   * up from the print configuration.
   * @param {Material.FEA|Material.Composite} material Print material
   * @param {Hardware.Config} printConfig
   */
  Infill: function(material, printConfig) {
    var micro = new Input();

    if (material instanceof Material.FEA) {
      micro.materials.push(material);

      let jlayer = JobBuilders.ExtrudedLayer(material, printConfig);

      // extrusion layer feeds into infill unit cell
      var jinfill = JobBuilders.Infill(jlayer, printConfig);

      micro.jobs.push(jlayer, jinfill);

    } else if (material instanceof Material.Composite) {
      micro.materials.push(material.matrix, material.fiber);

      let jhexpack = JobBuilders.Hexpack(material);
      let jpart = JobBuilders.Particulate(material);

      // Hexpack and particulate feed into short fiber
      let jsf = JobBuilders.ShortFiber(jhexpack, jpart, material);

      // short fiber feeds into extruded layer unit cell
      let jlayer = JobBuilders.ExtrudedLayer(jsf, printConfig);

      // extrusion layer feeds into infill unit cell
      var jinfill = JobBuilders.Infill(jlayer, printConfig);

      micro.jobs.push(jhexpack, jpart, jsf, jlayer, jinfill);
    }

    return new Run(micro, jinfill.name);
  }
};

/**
 * @namespace Micro
 */
const Micro = {
  Input: Input,
  Run: Run,
  Builders: Builders
};

module.exports = Micro;
