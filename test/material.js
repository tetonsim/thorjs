const assert = require('assert');

const { Elastic, Material, Composite } = require('../src/material');

const thor = require('./main');

let timeout = 1000;

describe('Material', function() {
  this.timeout(timeout);

  describe('Search', function() {
    it('default',
      function(done) {

        thor.materialSearch(
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
    it('default',
      function(done) {

        let matId = '11ce5cfd6d0645b58f5e4ff88185d09d';

        thor.materialGet(
          matId,
          function() {
            assert.strictEqual(this.id, matId);
            assert.ok('elastic' in this.properties);
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
