const Thor = require('../src/thor');
const { Micro, Builders } = require('../src/micro');
const { Elastic, Material } = require('../src/material');
//import { Thor } from '../src/thor';

const assert = require('assert');

const thor = new Thor.API({
  //host: 'https://api.fea.cloud' //'http://127.0.0.1:8000'
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
        console.error(this);
        assert.ok(false);
        done();
      }
    )
  });
});

module.exports = thor;
