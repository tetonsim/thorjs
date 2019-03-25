const assert = require('assert');

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
            assert.ok('structural' in this.properties);
            done();
          },
          function() {
            done(this);
          }
        )

      }
    );

  });
});

describe('Supplier', function() {
  this.timeout(timeout);

  describe('Search', function() {
    it('default',
      function(done) {

        thor.supplierSearch(
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

        let supplierId = '7944f369f67e4ea58d9d27ef9a1e0434';

        thor.supplierGet(
          supplierId,
          function() {
            assert.strictEqual(this.id, supplierId);
            assert.strictEqual(this.name, "Stratasys");
            assert.ok(this.materials.length > 0);
            done();
          },
          function() {
            done(this);
          }
        )

      }
    );

  });
});
