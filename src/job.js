const fs = require('fs');


/**
 * builds smart job object
 */
class Job {
  constructor(
      type,
      meta,
      chop,
      bulk,
      extruders,
      optimization,
      problemRegion
  ) {
    this.job = {}
    this.setType(type)
    this.setMeta(meta)
    this.setChop(chop)
    this.setExtruders(extruders)
    this.setBulk(bulk)
    this.setOptimization(optimization)
    this.setProblemRegion(problemRegion)

    this.buildSmartFile()
  }

  /**
  * @param {string} type
  */
  setType(type){
    this.job.type = type;
  }

  /**
  * @typedef Build
  * @type object
  * @param {string} date
  * @param {string} machine
  * @param {string} hash
  * @param {string} branch
  */

  /**
  * @typedef Meta
  * @type object
  * @param {Build} build
  */

  /**
  *
  * @param {Meta} meta
  */
  setMeta(meta) {
    this.job.meta = meta;
  }

  /**
   * @typedef Meshes
   * @type object
   */

  /**
   * @typedef Steps
   * @type object
   */

  /**
   * @typedef Slicer
   * @type object
   */

  /**
   * @typedef Mesher
   * @type object
   */

  /**
   * @typedef Chop
   * @type object
   * @param {Meshes} meshes
   * @param {Steps} steps
   * @param {Slicer} slicer
   * @param {Mesher} mesher
   */

  /**
   *
   * @param {Chop} chop
   */

  setChop(chop) {
    this.job.chop = chop;
  }

  /**
   * @typedef Bulk
   * @type array
   */

  /**
   *
   * @param {Bulk} bulk
   */

  setBulk(bulk) {
    this.job.bulk = bulk;
  }

  /**
   * @typedef Extruders
   * @type array
   */

  /**
   *
   * @param {Extruders} extruders
   */

  setExtruders(extruders) {
      this.job.extruders = extruders;
  }

  /**
   * @typedef Optimization
   * @type object
   */

  /**
   *
   * @param {Optimization} optimization
   */

  setOptimization(optimization) {
      this.job.optimization = optimization;
  }

  /**
   * @typedef ProblemRegion
   * @type array
   */

  /**
   *
   * @param {ProblemRegion} problemRegion
   */

  setProblemRegion(problemRegion) {
      this.job.problem_regions = problemRegion;
  }

  buildSmartFile() {
    fs.writeFileSync('fast-job.smart', JSON.stringify(this.job), 'utf-8');
  }
}

module.exports = Job