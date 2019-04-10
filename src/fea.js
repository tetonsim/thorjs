const Micro = require('./micro');

/**
 * @typedef {Object} Model
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

              infillSection.material = infillMat.name;
              wallSection.material = layerMat.name
              bottomLayerSection.material = layerMat.name
              topLayerSection.material = layerMat.name;

              // create a new coordinate system for the infill, if it is rotated
              if (printConfig.infill.orientation != 0.0) {
                let infillCsys = {
                  name: '_infill',
                  type: 'single_rotation',
                  axis: 3,
                  angle: printConfig.infill.orientation
                }

                newModel.coordinate_systems.push(infillCsys);
                infillSection.coordinate_system = infillCsys.name;
              }

              infillSection.type = 'homogeneous';

              // setup the wall section
              wallSection.type = 'layered';
              wallSection.layers = Array(printConfig.walls).fill( [layerMat.name, 0, 1] );
              if (printConfig.walls > 1) {
                wallSection.section_points = 1;
              }

              // setup the bottom and top layer sections
              let setupLayeredSection = function(section, layerConfig) {
                section.type = 'layered';
                section.layers = [];

                for (let i = 0; i < layerConfig.layers.length; i++) {
                  section.layers.push( [layerMat.name, layerConfig.layers[i], 1.0] );
                }

                if (section.layers.length > 1) {
                  section.section_points = 1;
                }
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