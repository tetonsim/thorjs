'use strict';

const version = typeof THOR_VERSION === 'undefined' ? 'dev' : THOR_VERSION;

const app = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Writable = require('stream').Writable;
const thor = require('./thor');

// default configuration
const HOST = 'https://api.smartslice.xyz';
let config = {
  host: HOST
};

let jconfig = thor.API.localStorage.getItem('config');

if (jconfig !== null) {
  config = JSON.parse(jconfig);
}

let api = new thor.API(config);

app
  .version(version)
  .command('login')
  .action(login);

app
  .command('logout')
  .action(logout);

app
  .command('config')
  .action(configure);

app
  .command('register')
  .action(register);

app.parse(process.argv);

function configure() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('Input the parameters to re-configure Thor.');
  console.log('Leave inputs empty to use the default, specified in parentheses.');
  console.log('If you were previously logged in, this process will log you out.');

  let new_config = {
    host: HOST
  };

  rl.question('Host (' + HOST + '): ',
    function(host) {

      if (host.length > 0) {
        new_config.host = host;
      }

      thor.API.localStorage.setItem('config', JSON.stringify(new_config));

      rl.close();
    }
  );

  api.releaseToken();
}

function _getCredentials(callback) {
  var mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
      if (!this.muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    }
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  rl.question('Email: ',
    function(email) {
      process.stdout.write('Password: ');

      mutableStdout.muted = true;

      rl.question('',
        function(pass) {
          callback(email, pass);
          rl.close();
        }
      );
    }
  );
}

function login() {
  var loginWithCreds = function(email, pass) {
    api.getToken(email, pass,
      function() {
        console.log('Hi ' + this.first_name + ', you are logged in.');
        console.log('Use the logout command to log out.');
      },
      function() {
        console.error('Failed to login');
        console.error(this.error);
      }
    );
  }

  _getCredentials(loginWithCreds);
}

function whoAmI(callback) {
  api.whoAmI(callback,
    function() {
      console.error('No user is currently logged in');
    }
  );
}

function logout() {
  whoAmI(
    function() {
      api.releaseToken(
        function() {
          console.log('Logged out');
        },
        function() {
          console.error('Failed to log out');
        }
      );
    }
  );
}

function register() {
  var first_name;
  var last_name;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var registerWithCreds = function(email, pass) {
    api.register(first_name, last_name, email, pass,
      function() {
        console.log('Successful registration. Use login command to log in.');
      },
      function() {
        console.error('Failed to register');
        console.error(this.message);
        rl.close();
      }
    );
  }

  rl.question('First Name: ',
    function(first_name_ans) {
      first_name = first_name_ans;
      rl.question('Last Name: ',
        function(last_name_ans) {
          last_name = last_name_ans;

          rl.close();

          _getCredentials(registerWithCreds);
        }
      );
    }
  );
}
