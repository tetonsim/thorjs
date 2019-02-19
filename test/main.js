const Thor = require('../src/thor');
const { Micro, Builders } = require('../src/micro');
const { Elastic, Material } = require('../src/material');
//import { Thor } from '../src/thor';

const assert = require('assert');

const thor = new Thor.API({
  host: 'https://api.fea.cloud' //'http://127.0.0.1:8000'
});

before(function(done) {
  
  thor.getToken('tom.brady@mailinator.com', 'ilovegiz',
    function(user) {
      console.log(user.first_name + ' ' + user.last_name + ' logged in (' + user.id + ')');
      done();
    },
    function(error) {
      console.error('Login failed: ' + error);
      done(error);
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
      function(error) {
        console.error(error);
        assert.ok(false);
        done();
      }
    )
  });
});

module.exports = thor;
