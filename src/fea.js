const Micro = require('./micro');

/**
 * @typedef {Object} Model
 * @memberof FEA
 */

/**
 * @typedef {Object} Results
 * @memberof FEA
 */

/**
 * @typedef {Object} Template
 * @memberof FEA
 * @property {string} id
 * @property {string} name
 * @property {string} thumbnail base 64 encoded PNG
 * @property {FEA.Model} model FEA model definition
 * @property {Hardware.Config} manufacturing_config
 */

const Builders = {  
  
  /**
  * Builds an FEA model from the FEA template, chosen print material, and print configuration
  * @param {API} api An API with a valid token
  * @param {FEA.Template} material Print material
  * @param {Material.FEA|Material.Composite} material Print material
  * @param {Hardware.Config} printConfig
  * @returns {FEA.Model}
  */
  Model: function(api, template, material, printConfig) {
    let promise = new Promise(
      (resolve, reject) => {
        // create a deep copy of the template model
        let newModel = JSON.parse(JSON.stringify(template.model));

        // if the print coordinate system was defined set it up in the model
        if (printConfig.orientation !== undefined) {
          // TODO
          //newModel.process = 
        }

        // the model must have sections named infill, wall, bottom_layer, and top_layer
        let sections = newModel.sections;

        let findSectionOrReject = function(sectionName) {
          let sect = sections.find(s => s.name === sectionName);
          if (sect === undefined) {
            reject('Missing section ' + name);
          }
          return sect;
        }

        let infillSection = findSectionOrReject('infill');
        let wallSection = findSectionOrReject('wall');
        let bottomLayerSection = findSectionOrReject('bottom_layer');
        let topLayerSection = findSectionOrReject('top_layer');

        let apiError = function() {
          reject(this);
        }

        // now that we know we have the proper sections let's 
        // get the wall and layer material properties
        let layerRunPromise = api.microRunPromise( Micro.Builders.ExtrudedLayer(material, printConfig) );

        // and now let's get the infill properties
        let infillRunPromise = api.microRunPromise( Micro.Builders.Infill(material, printConfig) );

        Promise
          .all([layerRunPromise, infillRunPromise])
          .then(
            function(mats) {
              let layerMat = mats[0].result.materials[0];
              let infillMat = mats[1].result.materials[0];

              // TODO where to get strengths from?

              let replaceOrAddMaterial = function(mat) {
                let i = newModel.materials.findIndex(m => m.name === mat.name);
                if (i >= 0) {
                  newModel.materials[i] = mat;
                } else {
                  newModel.materials.push(mat);
                }
              }

              replaceOrAddMaterial(layerMat);
              replaceOrAddMaterial(infillMat);

              infillSection.type = 'fdm_infill';
              infillSection.material = infillMat.name;
              infillSection.angle = printConfig.infill.orientation;

              wallSection.type = 'fdm_wall';
              wallSection.material = layerMat.name;
              wallSection.wall_count = 1; //printConfig.walls;

              wallSection.section_points = (wallSection.wall_count === 1) ? 3 : 1;

              // setup the bottom and top layer sections
              let setupLayeredSection = function(section, layerConfig) {
                section.type = 'fdm_layer';
                section.layers = [];

                for (let i = 0; i < layerConfig.layers.length; i++) {
                  section.layers.push( [layerMat.name, layerConfig.layers[i].orientation, 1.0] );
                }

                section.section_points = (section.layers.length === 1) ? 3 : 1;

                // delete any homogeneous material if there was one
                delete section.material;
              }

              setupLayeredSection(bottomLayerSection, printConfig.bottom_layer);
              setupLayeredSection(topLayerSection, printConfig.top_layer);

              // simply override the outputs to make sure we have all the outputs we need
              newModel.outputs = [
                {
                  name: 'displacement', locations: ['node']
                },
                {
                  name: 'stress', locations: ['gauss_point']
                },
                {
                  name: 'safety_factor', locations: ['gauss_point']
                }
              ];

              resolve(newModel);
            }
          )
          .catch(
            error => reject(error)
          );
      }
    )
    return promise;
  }
}

/**
 * @namespace FEA
 */
const FEA = {
  Builders: Builders
};

module.exports = FEA;