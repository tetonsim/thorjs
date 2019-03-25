const assert = require('assert');

const Hardware = require('../src/hardware');

const thor = require('./main');

let timeout = 1000;

describe('Hardware', function() {
  describe('Machine', function() {
    describe('Search', function() {
      this.timeout(timeout);

      it('default',
        function(done) {

          thor.machineSearch(
            function() {
              assert.ok(this.length > 0);
              done();
            },
            function() {
              throw this;
            }
          )

        }
      );

    });


    describe('Get', function() {
      this.timeout(timeout);

      it('default',
        function(done) {

          let machId = '9fff79c379ff4fdca56e1c0d4e76cbbe';

          thor.machineGet(
            machId,
            function() {
              assert.strictEqual(this.id, machId);
              assert.strictEqual(this.process, "FDM");
              assert.ok(this.materials.length > 0);
              done();
            },
            function() {
              throw this;
            }
          )

        }
      );

    });
  });

  describe('Vendor', function() {
    describe('Search', function() {
      this.timeout(timeout);

      it('default',
        function(done) {

          thor.vendorSearch(
            function() {
              assert.ok(this.length > 0);
              done();
            },
            function() {
              throw this;
            }
          )

        }
      );

    });


    describe('Get', function() {
      this.timeout(timeout);

      it('default',
        function(done) {

          let vendorId = '65df4ebf3c834dd4b7f31609bf59aab3';

          thor.vendorGet(
            vendorId,
            function() {
              assert.strictEqual(this.id, vendorId);
              assert.strictEqual(this.name, "Stratasys");
              assert.ok(this.machines.length > 0);
              done();
            },
            function() {
              throw this;
            }
          )

        }
      );

    });
  });
});