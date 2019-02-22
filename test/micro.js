const assert = require('assert');

const Micro = require('../src/micro');
const Material = require('../src/material');
const Hardware = require('../src/hardware');

const thor = require('./main');

function runAndCheck(run, done, callback) {
  thor.microNewRun(run,
    function() {
      thor.microRunStatusWait(this.id, 
        function() {
          callback(this);
          done();
        },
        function() {
          callback(this);
          done();
        }, 
        function() {
          done(this);
        });
    },
    function() {
      done(this);
    }
  );
}

function defaultComposite(volume_fraction, L_over_D) {

  let fiber = new Material.FEA(
    'carbon', Material.Elastic.Isotropic(200.0, 0.25)
  );
  
  let matrix = new Material.FEA(
    'pla', Material.Elastic.Isotropic(3.5, 0.34)
  );
  
  return new Material.Composite(matrix, fiber, volume_fraction, L_over_D);
}

let timeout = 60 * 1000;

describe('Micro', function() {
  describe('Hexpack', function() {
    this.timeout(timeout);

    it('valid',
      function(done) {
        let hexpack = Micro.Builders.Hexpack(defaultComposite(15));

        runAndCheck(hexpack, done,
          function(run) {
            assert.strictEqual(run.status, 'completed');

            assert.ok(run.hasOwnProperty('result'));

            let elas = run.result.materials[0].elastic;

            assert.ok(elas.Ea > 0.0);
            assert.strictEqual(elas.iso_plane, 23);
          }
        );

      }
    );


    it('low_vf',
      function(done) {
        
        let hexpack = Micro.Builders.Hexpack(defaultComposite(4));

        runAndCheck(hexpack, done,
          function(run) {
            assert.strictEqual(run.status, 'failed');
          }
        );

      }
    );

  });
});

describe('Micro', function() {
  describe('ShortFiber', function() {
    this.timeout(timeout);

    it('L/D = 50',
      function(done) {        
        let sf = Micro.Builders.ShortFiber(defaultComposite(15, 50));

        runAndCheck(sf, done,
          function(run) {
            assert.strictEqual(run.status, 'completed');

            assert.ok(run.hasOwnProperty('result'));

            let elas = run.result.materials[0].elastic;

            assert.ok(elas.Ea > 0.0);
            assert.strictEqual(elas.iso_plane, 23);
          }
        );

      }
    );
  });
});

describe('Micro', function() {
  describe('ExtrudedLayer', function() {
    this.timeout(timeout);

    it('pla',
      function(done) {        
        let layer = Micro.Builders.ExtrudedLayer(
          new Material.FEA('pla', Material.Elastic.Isotropic(3.5, 0.34)),
          new Hardware.Config()
        );

        runAndCheck(layer, done,
          function(run) {
            assert.strictEqual(run.status, 'completed');

            assert.ok(run.hasOwnProperty('result'));

            let elas = run.result.materials[0].elastic;

            assert.ok(elas.E11 > 0.0);
            assert.ok(elas.E22 > 0.0);
            assert.ok(elas.E33 > 0.0);
            assert.strictEqual(elas.type, 'orthotropic');
          }
        );

      }
    );

    it('pla-cf',
      function(done) {        
        let layer = Micro.Builders.ExtrudedLayer(
          defaultComposite(15, 50),
          new Hardware.Config()
        );

        runAndCheck(layer, done,
          function(run) {
            assert.strictEqual(run.status, 'completed');

            assert.ok(run.hasOwnProperty('result'));

            let elas = run.result.materials[0].elastic;

            assert.ok(elas.E11 > 0.0);
            assert.ok(elas.E22 > 0.0);
            assert.ok(elas.E33 > 0.0);
            assert.strictEqual(elas.type, 'orthotropic');
          }
        );

      }
    );

  });
});

describe('Micro', function() {
  describe('Infill', function() {
    this.timeout(timeout);

    it('grid-pla',
      function(done) {
        let print = new Hardware.Config();

        print.infill_type = 'grid';
        print.infill_volume_fraction = 50;

        let pla = new Material.FEA('pla', Material.Elastic.Isotropic(3.5, 0.34));

        let infill = Micro.Builders.Infill(pla, print);

        runAndCheck(infill, done,
          function(run) {
            assert.strictEqual(run.status, 'completed');

            assert.ok(run.hasOwnProperty('result'));

            let elas = run.result.materials[0].elastic;

            assert.ok(elas.Ea > 0.0);
            assert.strictEqual(elas.type, 'transverse_isotropic');
            assert.strictEqual(elas.iso_plane, 12);
          }
        );

      }
    );

  });
});