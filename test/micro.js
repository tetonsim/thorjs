const assert = require('assert');

const { Micro, Builders } = require('../src/micro');
const { Elastic, Material, Composite } = require('../src/material');
const { PrintConfig } = require('../src/print');

const thor = require('./main');

function runAndCheck(run, done, callback) {
  thor.microNewRun(run,
    function(resp) {
      thor.microRunStatusWait(resp.id, 
        function(resp2) {
          callback(resp2);
          done();
        },
        function(resp2) {
          callback(resp2);
          done();
        }, 
        function(error) {
          done(error);
        });
    },
    function(error) {
      done(error);
    }
  );
}

function defaultComposite(volume_fraction, L_over_D) {

  let fiber = new Material(
    'carbon', Elastic.Isotropic(200.0, 0.25)
  );
  
  let matrix = new Material(
    'pla', Elastic.Isotropic(3.5, 0.34)
  );
  
  return new Composite(matrix, fiber, volume_fraction, L_over_D);
}

describe('Micro', function() {
  describe('Hexpack', function() {
    this.timeout(10000);

    it('valid',
      function(done) {
        let hexpack = Builders.Hexpack(defaultComposite(15));

        runAndCheck(hexpack, done,
          function(resp) {
            assert.strictEqual(resp.status, 'completed');

            assert.ok(resp.hasOwnProperty('result'));

            let elas = resp.result.materials[0].elastic;

            assert.ok(elas.Ea > 0.0);
            assert.strictEqual(elas.iso_plane, 23);
          }
        );

      }
    );


    it('low_vf',
      function(done) {
        
        let hexpack = Builders.Hexpack(defaultComposite(4));

        runAndCheck(hexpack, done,
          function(resp) {
            assert.strictEqual(resp.status, 'failed');
          }
        );

      }
    );

  });
});

describe('Micro', function() {
  describe('ShortFiber', function() {
    this.timeout(15000);

    it('L/D = 50',
      function(done) {        
        let sf = Builders.ShortFiber(defaultComposite(15, 50));

        runAndCheck(sf, done,
          function(resp) {
            assert.strictEqual(resp.status, 'completed');

            assert.ok(resp.hasOwnProperty('result'));

            let elas = resp.result.materials[0].elastic;

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
    this.timeout(15000);

    it('pla',
      function(done) {        
        let layer = Builders.ExtrudedLayer(
          new Material('pla', Elastic.Isotropic(3.5, 0.34)),
          new PrintConfig()
        );

        runAndCheck(layer, done,
          function(resp) {
            assert.strictEqual(resp.status, 'completed');

            assert.ok(resp.hasOwnProperty('result'));

            let elas = resp.result.materials[0].elastic;

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
        let layer = Builders.ExtrudedLayer(
          defaultComposite(15, 50),
          new PrintConfig()
        );

        runAndCheck(layer, done,
          function(resp) {
            assert.strictEqual(resp.status, 'completed');

            assert.ok(resp.hasOwnProperty('result'));

            let elas = resp.result.materials[0].elastic;

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
    this.timeout(20000);

    it('grid-pla',
      function(done) {
        let print = new PrintConfig();

        print.infill_type = 'grid';
        print.infill_volume_fraction = 50;

        let infill = Builders.Infill( new Material('pla', Elastic.Isotropic(3.5, 0.34)), print );

        runAndCheck(infill, done,
          function(resp) {
            assert.strictEqual(resp.status, 'completed');

            assert.ok(resp.hasOwnProperty('result'));

            let elas = resp.result.materials[0].elastic;

            assert.ok(elas.Ea > 0.0);
            assert.strictEqual(elas.type, 'transverse_isotropic');
            assert.strictEqual(elas.iso_plane, 12);
          }
        );

      }
    );

  });
});