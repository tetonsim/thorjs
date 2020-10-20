'use strict';

const version = typeof THOR_VERSION === 'undefined' ? 'dev' : THOR_VERSION;

const app = require('commander');
const { count } = require('console');
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

const mutableStdout = new Writable({
  write: function(chunk, encoding, callback) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  }
});

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
  .command('email')
  .command('verify')
  .option('-c, --code [code]', 'Verify email using code')
  .option('-r, --resend [email]', 'Resend verification email to email')
  .action(verifyEmail);

const password = app.command('password');

password
  .command('change')
  .action(changePassword)

password
  .command('forgot')
  .requiredOption('-e, --email [email]', 'Email of the account the password was forgotten for.')
  .action(forgotPassword);

password
  .command('reset')
  .requiredOption('-c, --code [code]', 'Password reset code')
  .action(resetPassword);

const smartslice = app.command('smartslice');

smartslice
  .command('submit <threemf>')
  .action(submitSmartSliceJob);

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

  api.releaseToken(function() {}, function() {});
}

function _getCredentials(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  mutableStdout.muted = false;

  rl.question('Email: ',
    function(email) {
      process.stdout.write('Password: ');

      mutableStdout.muted = true;

      rl.question('',
        function(pass) {
          console.log('');
          callback(email, pass);
          rl.close();
        }
      );
    }
  );
}

function _basicSuccessCallback() {
  console.log(this.message);
}

function _basicErrorCallback() {
  console.error(`(${this.http_code}) ${this.error}`);
}

function login() {
  var loginWithCreds = function(email, pass) {
    api.getToken(email, pass,
      function() {
        console.log('Hi ' + this.first_name + ', you are logged in.');
        console.log('Use the logout command to log out.');
      },
      _basicErrorCallback
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
        function() { console.log('Logged out'); },
        _basicErrorCallback
      );
    }
  );
}

function register() {
  var first_name;
  var last_name;
  var country;
  var company;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var registerWithCreds = function(email, pass) {
    api.register(
      first_name, last_name, email, pass, company, country,
      _basicSuccessCallback,
      function() {
        console.error('Failed to register');
        console.error(this.message);
        rl.close();
      }
    );
  }

  var countryAsk = function() {
    rl.question(
      'Country: ',
      function(answer) {
        country = answer;
        rl.close();
        _getCredentials(registerWithCreds);
      }
    );
  };

  var companyAsk = function() {
    rl.question(
      'Company: ',
      function(answer) {
        company = answer;
        countryAsk();
      }
    );
  };

  var lastNameAsk = function() {
    rl.question(
      'Last Name: ',
      function(answer) {
        last_name = answer;
        companyAsk();
      }
    );
  };

  rl.question(
    'First Name: ',
    function(answer) {
      first_name = answer;
      lastNameAsk();
    }
  );
}

function verifyEmail() {
  if (this.resend !== undefined) {
    api.verifyEmailResend(
      this.resend,
      _basicSuccessCallback,
      _basicErrorCallback
    );
  } else {
    api.verifyEmail(
      this.code,
      _basicSuccessCallback,
      _basicErrorCallback
    );
  }
}

function changePassword() {
  whoAmI(
    function() {
      const rl = readline.createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true
      });

      mutableStdout.muted = true;

      process.stdout.write('Old Password: ');

      rl.question('',
        function(oldPassword) {
          process.stdout.write('\nNew Password: ');

          rl.question('',
            function(newPassword) {
              console.log('');
              api.changePassword(
                oldPassword,
                newPassword,
                function() {
                  console.log(this.message);
                  console.log('You will need to log back in.');
                },
                _basicErrorCallback
              );

              rl.close();
            }
          );
        }
      );
    }
  );
}

function forgotPassword() {
  api.forgotPassword(
    this.email,
    _basicSuccessCallback,
    _basicErrorCallback
  );
}

function resetPassword() {
  let code = this.code;

  _getCredentials(
    function(email, password) {
      api.resetPassword(
        code,
        email,
        password,
        _basicSuccessCallback,
        _basicErrorCallback
      )
    }
  );
}

function submitSmartSliceJob() {
  let tmf = this.threemf;
}
