'use strict';

const version = typeof VERSION === 'undefined' ? 'dev' : VERSION;

const app = require('commander');
const fs = require('fs');
const path = require('path');
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

app
  .command('micro')
  .option('-i, --input [file]')
  .option('-t, --target [job]')
  .action(micro);

app
  .command('fea')
  .option('-i, --input [file]')
  .option('-p, --print [file]')
  .option('-m, --modified [new job name]')
  .action(fea);

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
        //console.error(this.http_code);
        //console.error(this.message);
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

function fea(req, opt) {
  let that = this;
  let lastStatus = '';
  let feaInput = that.input;

  if (that.print) {
    whoAmI(configureAndMakeModel);
  } else {
    whoAmI(makeModel);
  }

  function configureAndMakeModel() {
    if (!that.modified) {
      throw 'If a print configuration is supplied a new output file name must also be given (--modified)';
    }

    let modelContent = fs.readFileSync(feaInput);
    let model = JSON.parse(modelContent);

    let printConfigContent = fs.readFileSync(that.print);
    let printConfig = JSON.parse(printConfigContent);

    let material = new thor.Material.FEA(printConfig.material.name, printConfig.material.elastic);

    let p = thor.FEA.Builders.Model(
      api,
      {
        model: model
      },
      material,
      printConfig.config
    );

    feaInput = that.modified + '.json';

    p.then(
      function(modifiedModel) {
        fs.writeFileSync(feaInput, JSON.stringify(modifiedModel, null, 1));
        makeModel();
      }
    ).catch(
      e => console.error(e)
    );
  }

  function makeModel() {
    if (!fs.existsSync(feaInput)) {
      throw feaInput + ' does not exist';
    }

    let content = fs.readFileSync(feaInput);
    let input = JSON.parse(content);
    let target = that.target;

    api.feaModelCreate(input.name, input,
      function() {
        console.log('FEA model created: ' + this.id);
        makeRun(this.id);
      },
      function() {
        console.error('Failed to create FEA model: ' + this.message);
      }
    );
  }

  function makeRun(model_id) {
    api.feaRunCreate(model_id,
      function() {
        console.log('FEA run created: ' + this.run.id);
        submitRun(this.run.id);
      },
      function() {
        console.error('Failed to create FEA run: ' + this.message);
      }
    );
  }

  function submitRun(run_id) {
    api.feaRunSubmit(run_id,
      function() {
        console.log('FEA run submitted: ' + this.id);
        runCheck(run_id);
      },
      function() {
        console.error('Failed to submit FEA run: ' + this.message);
      }
    );
  }

  function deleteModelAndRuns(model_id) {
    api.feaModelDelete(model_id,
      function() {
        // do nothing
      },
      function() {
        console.warn('Unable to delete model: ', this.error);
      },
      true
    );
  }

  function runCheck(id) {
    api.feaRun(id,
      function() {
        if (this.status === 'finished') {
          let inpfile = path.parse(feaInput);
          let rstfile = path.join(inpfile.dir, inpfile.base + '.rst');

          console.log('Writing results to ' + rstfile);

          fs.writeFileSync(
            rstfile, JSON.stringify(this.result)
          );

          deleteModelAndRuns(this.femodel);
        } else if (this.status === 'aborted' || this.status === 'failed' || this.status === 'crashed') {
          console.error('Run failed: ', this.error);
        } else {
          setTimeout(function() { runCheck(id) }, 2000);
        }

        if (this.status !== lastStatus) {
          console.log('Status: ' + this.status);
          lastStatus = this.status;
        }
      }
    );
  }
}
