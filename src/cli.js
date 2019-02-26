'use strict';

const version = typeof VERSION === 'undefined' ? 'dev' : VERSION;

const app = require('commander');
const fs = require('fs');
const readline = require('readline');
const Writable = require('stream').Writable;
const thor = require('./thor');

// default configuration
const HOST = 'https://api.fea.cloud';
let config = {
  host: HOST
};

let jconfig = thor.API.localStorage.getItem('config');

if (jconfig !== null) {
  config = JSON.parse(jconfig);
}

let api = new thor.API({host: 'http://127.0.0.1:5000'});

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
  .command('micro')
  .option('-i, --input [file]')
  .option('-t, --target [job]')
  .action(micro);

//console.log(process.argv);

app.parse(process.argv);

function configure() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('Input the parameters to re-configure Thor.');
  console.log('Leave inputs empty to use the default, specified in parantheses.');
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

function login() {
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
          api.getToken(email, pass,
            function() {
              console.log('Hi ' + this.first_name + ', you are logged in.');
              console.log('Use the logout command to log out.');
            },
            function() {
              console.error('Failed to login');
              //console.error(this.http_code);
              //console.error(this.message);
            }
          );

          rl.close();
        }
      );
    }
  );
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

function micro(req, opt) {
  let that = this;
  let lastStatus = '';

  function runCheck(id) {
    api.microRunStatus(id,
      function() {
        if (this.status === 'completed') {
          console.log(JSON.stringify(this.result, null, 2));
        } else {
          if (this.status !== lastStatus) {
            console.log('Status: ' + this.status);
            lastStatus = this.status;
          }
          setTimeout(function() { runCheck(id) }, 1000);
        }
      }
    );
  }

  whoAmI(
    function() {
      if (!fs.existsSync(that.input)) {
        throw that.input + ' does not exist';
      }

      let content = fs.readFileSync(that.input);
      let input = JSON.parse(content);
      let target = that.target;

      let run = new thor.Micro.Run(input, target);

      api.microNewRun(run,
        function() {
          console.log('Micro run submitted: ' + this.id);
          runCheck(this.id);
        },
        function() {
          console.error('Failed to submit micro run: ' + this.message);
        }
      );

    }
  );
}
