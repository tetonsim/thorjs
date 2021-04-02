#! /usr/bin/env node
export {};

'use strict';

const version =  'dev';

const app = require('commander');
const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const readline = require('readline');
const Writable = require('stream').Writable;
const thor = require('./thor');

const location = path.join(os.homedir(), '.thor');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage(location);

// default configuration
const HOST = 'https://api.smartslice.xyz';
let config = {
  host: HOST,
  token: null,
};

const jconfig = storage.getItem('config');

if (jconfig !== null) {
  config = JSON.parse(jconfig);
}

const api = new thor.API(config);

const mutableStdout = new Writable({
  write: function(chunk, encoding, callback) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  },
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
  .action(changePassword);

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
  .command('submit3MF <file>')
  .description('Submit 3MF file for validation/optimization')
  .action((job) => {
    whoAmI(submitSmartSliceJob, job, true);
  });

smartslice
  .command('submit <file>' )
  .description('Submit JSON file for validation/optimization')
  .action((job) => {
    whoAmI(submitSmartSliceJob, job, false);
  });

smartslice
  .command('cancel <id>')
  .action((jobId) => whoAmI(cancelSmartSliceJob, jobId));

smartslice
  .command('jobs <page>')
  .option('-l, --limit [limit]', 'Number of jobs to retrieve')
  .action(
    function(page) {
      whoAmI(listSmartSliceJobs, page, this.limit);
    },
  );

const teams = app.command('teams');

teams
  .command('create')
  .action((_) => whoAmI(createTeam));

teams
  .command('memberships')
  .action((_) => whoAmI(listMemberships));

teams
  .command('members <team>')
  .action((team) => whoAmI(listTeamMembers, team));

teams
  .command('invite <team> <email>')
  .option('-r, --revoke', 'Revoke an existing invitation')
  .action(
    function(team, email) {
      whoAmI(manageTeamInvite, team, email, this.revoke);
    },
  );

teams
  .command('accept-invite <team>')
  .action((team) => whoAmI(acceptTeamInvite, team));

teams
  .command('remove-member <team> <email>')
  .action((team, email) => whoAmI(removeTeamMember, team, email));

teams
  .command('add-member-role <team> <email> <role>')
  .action((team, email, role) => whoAmI(addTeamMemberRole, team, email, role));

teams
  .command('revoke-member-role <team> <email> <role>')
  .action((team, email, role) => whoAmI(revokeTeamMemberRole, team, email, role));

app.parse(process.argv);

function configure() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Input the parameters to re-configure Thor.');
  console.log('Leave inputs empty to use the default, specified in parentheses.');
  console.log('If you were previously logged in, this process will log you out.');

  const new_config = {
    host: HOST,
    token: null,
  };

  rl.question('Host (' + HOST + '): ',
    function(host) {
      if (host.length > 0) {
        new_config.host = host;
      }

      storage.setItem('config', JSON.stringify(new_config));

      rl.close();
    },
  );

  api.releaseToken(function() {}, function() {});
}

function _multipleQuestions(questions, callback) {
  const answers = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function askQuestion(i) {
    rl.question(
      questions[i],
      (answer) => {
        answers.push(answer);
        if (questions.length > (i + 1)) {
          askQuestion(i + 1);
        } else {
          rl.close();
          callback(...answers);
        }
      },
    );
  }

  askQuestion(0);
}

function _getCredentials(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
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
        },
      );
    },
  );
}

function _basicSuccessCallback() {
  console.log(this.message);
}

function _basicErrorCallback() {
  console.error(`(${this.http_code}) ${this.error}`);
}

function login() {
  const loginWithCreds = function(email, pass) {
    api.getToken(email, pass,
      function() {
        const new_config = {
          host: api.config.host,
          token: api.token,
        };
        storage.setItem('config', JSON.stringify(new_config));
        console.log('Hi ' + this.first_name + ', you are logged in.');
        console.log('Use the logout command to log out.');
      },
      _basicErrorCallback,
    );
  };

  _getCredentials(loginWithCreds);
}

function whoAmI(callback, ...args) {
  api.whoAmI(
    (_) => callback(...args),
    function() {
      console.error('No user is currently logged in');
    },
  );
}

function logout() {
  whoAmI(
    function() {
      api.releaseToken(
        function() {
          console.log('Logged out');
        },
        _basicErrorCallback,
      );
    },
  );
}

function register() {
  let first_name;
  let last_name;
  let country;
  let company;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const registerWithCreds = function(email, pass) {
    api.register(
      first_name, last_name, email, pass, company, country,
      _basicSuccessCallback,
      function() {
        console.error('Failed to register');
        console.error(this.message);
        rl.close();
      },
    );
  };

  const countryAsk = function() {
    rl.question(
      'Country: ',
      function(answer) {
        country = answer;
        rl.close();
        _getCredentials(registerWithCreds);
      },
    );
  };

  const companyAsk = function() {
    rl.question(
      'Company: ',
      function(answer) {
        company = answer;
        countryAsk();
      },
    );
  };

  const lastNameAsk = function() {
    rl.question(
      'Last Name: ',
      function(answer) {
        last_name = answer;
        companyAsk();
      },
    );
  };

  rl.question(
    'First Name: ',
    function(answer) {
      first_name = answer;
      lastNameAsk();
    },
  );
}

function verifyEmail() {
  if (this.resend !== undefined) {
    api.verifyEmailResend(
      this.resend,
      _basicSuccessCallback,
      _basicErrorCallback,
    );
  } else {
    api.verifyEmail(
      this.code,
      _basicSuccessCallback,
      _basicErrorCallback,
    );
  }
}

function changePassword() {
  whoAmI(
    function() {
      const rl = readline.createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true,
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
                _basicErrorCallback,
              );

              rl.close();
            },
          );
        },
      );
    },
  );
}

function forgotPassword() {
  api.forgotPassword(
    this.email,
    _basicSuccessCallback,
    _basicErrorCallback,
  );
}

function resetPassword() {
  const code = this.code;

  _getCredentials(
    function(email, password) {
      api.resetPassword(
        code,
        email,
        password,
        _basicSuccessCallback,
        _basicErrorCallback,
      );
    },
  );
}

function submitSmartSliceJob(job, is3mf) {
  const outputFile = path.join(
    path.dirname(job),
    path.basename(job).slice(0, job.lastIndexOf('.')) + '.out.json',
  );

  fs.readFile(
    job,
    (error, data) => {
      if (error) {
        console.error(error);
      } else {
        if (!is3mf) {
          try {
            data = JSON.parse(data);
          } catch (error) {
            throw new Error('JSON failed to parse. If this is a 3MF file use the submit3MF command');
          }
        }

        console.log('CTRL+C to cancel job');

        let abort = false;

        process.on('SIGINT', (_) => {
          abort = true;
        });

        api.submitSmartSliceJobAndPoll(
          data,
          function() {
            console.error(this);
          },
          function() {
            if (this.status === 'finished') {
              console.log(`Job finished, writing result to ${outputFile}`);
              fs.writeFileSync(outputFile, JSON.stringify(this.result));
            } else {
              console.log(`Job ${this.status}`);
            }
          },
          function() {
            console.error('Job failed');
            for (const e of this.errors) {
              console.error(e);
            }
          },
          function() {
            const now = new Date();
            console.debug(`${now.toLocaleTimeString()} - Job ${this.id}: ${this.status} (${this.progress})`);
            return abort;
          },
        );
      }
    },
  );
}

function cancelSmartSliceJob(jobId) {
  api.cancelSmartSliceJob(
    jobId,
    function() {
      console.log(`Job status: ${this.status}`);
    },
    _basicErrorCallback,
  );
}

function listSmartSliceJobs(page, limit) {
  if (limit === undefined) {
    limit = 10;
  }

  page = Math.max(1, page);
  limit = Math.max(1, limit);

  const success = function() {
    console.log(`Page ${this.page}/${this.total_pages}`);
    for (const job of this.jobs) {
      console.log(`${job.id} : ${job.status} (${job.progress})`);
    }
    console.log(`Page ${this.page}/${this.total_pages}`);
  };

  api.listSmartSliceJobs(limit, page, success, _basicErrorCallback);
}

function createTeam() {
  _multipleQuestions(
    ['Team Name (lowercase a-z, 0-9, "_", and "-" only, 3-64 characters): ', 'Full Team Name: '],
    function(name, fullName) {
      api.createTeam(
        name,
        fullName,
        _basicSuccessCallback,
        _basicErrorCallback,
      );
    },
  );
}

function listMemberships() {
  api.teamMemberships(
    function() {
      console.log(this);
    },
    _basicErrorCallback,
  );
}

function listTeamMembers(team) {
  api.teamMembers(
    team,
    function() {
      console.log(this);
    },
    _basicErrorCallback,
  );
}

function manageTeamInvite(team, email, revoke) {
  if (revoke) {
    api.revokeTeamInvite(team, email, _basicSuccessCallback, _basicErrorCallback);
  } else {
    api.inviteToTeam(team, email, _basicSuccessCallback, _basicErrorCallback);
  }
}

function acceptTeamInvite(team) {
  api.acceptTeamInvite(team, _basicSuccessCallback, _basicErrorCallback);
}

function removeTeamMember(team, email) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    `Are you sure you want to remove ${email} from ${team} (y/N): `,
    (answer) => {
      if (answer.length == 1 && answer.toLowerCase()[0] == 'y') {
        api.removeTeamMember(team, email, _basicSuccessCallback, _basicErrorCallback);
      } else {
        console.log('Member removal action canceled');
      }
      rl.close();
    },
  );
}

function addTeamMemberRole(team, email, role) {
  api.addTeamMemberRole(team, email, role, _basicSuccessCallback, _basicErrorCallback);
}

function revokeTeamMemberRole(team, email, role) {
  api.revokeTeamMemberRole(team, email, role, _basicSuccessCallback, _basicErrorCallback);
}
