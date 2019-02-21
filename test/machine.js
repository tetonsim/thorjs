const assert = require('assert');

const { Config, Vendor, Machine } = require('../src/machine');

const thor = require('./main');

let timeout = 1000;

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
