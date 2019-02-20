const assert = require('assert');

const { Elastic, Material, Composite } = require('../src/material');

const thor = require('./main');

let timeout = 1000;

describe('Material', function() {
  describe('Search', function() {
    this.timeout(timeout);

    it('default',
      function(done) {

        thor.materialSearch(
          function() {
            assert.ok(this.length > 0);
            done();
          },
          function(error) {
            throw error;
          }
        )

      }
    );

  });


  describe('Get', function() {
    this.timeout(timeout);

    it('default',
      function(done) {

        let matId = '11ce5cfd6d0645b58f5e4ff88185d09d';

        thor.materialGet(
          matId,
          function() {
            assert.strictEqual(this.id, matId);
            assert.ok(this.elastic instanceof Elastic);
            done();
          },
          function(error) {
            throw error;
          }
        )

      }
    );

  });
});
