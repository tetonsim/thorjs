const Thor = require('../src/thor');

const assert = require('assert');

const thor = new Thor.API({
  //host: 'https://api.smartslice.xyz'
  host: 'http://127.0.0.1:5000'
});

before(function(done) {

  thor.getToken('tom.brady@mailinator.com', 'ilovegiz',
    function() {
      console.log(this.first_name + ' ' + this.last_name + ' logged in (' + this.id + ')');
      done();
    },
    function() {
      console.error('Login failed: ' + this);
      done(this.message);
    }
  );

});

after(function() {
  thor.releaseToken();
  console.log('Logged out');
});

describe('Main', function() {
  it('version-compatibility', function(done) {
    thor.verifyVersion(
      function(compatible, cv, sv) {
        assert.ok(compatible);
        done();
      },
      function() {
        done(this);
      }
    )
  });

  it ('whoAmI', function(done) {
    // use a fresh API
    let thor2 = new Thor.API(thor.config);
    thor2.whoAmI(
      function() {
        assert.ok(thor2.user !== null);
        assert.ok(thor2.token !== null);
        done();
      },
      function() {
        done(this);
      }
    )
  });
});

module.exports = thor;
