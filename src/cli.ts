#! /usr/bin/env node

('use strict');

import app = require('commander');
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';
import * as readline from 'readline';
import * as stream from 'stream';
import {thor} from './thor';
import {LocalStorage} from 'node-localstorage';
import {APIConfig} from './types';
import {Response} from './types';

// add muted property to writable
declare module 'stream' {
  export interface Writable {
      muted?: boolean
  }
}

const location = path.join(os.homedir(), '.thor');
const storage = new LocalStorage(location);

import * as dotenv from 'dotenv';


// default configuration
dotenv.config();
const version = process.env.THOR_VERSION ?? '21.0';
const HOST = 'https://api.smartslice.xyz';

let config: APIConfig = {
  host: HOST,
  token: null,
};

const jconfig = storage.getItem('config');

if (jconfig !== null) {
  config = JSON.parse(jconfig);
}

const api = new thor.API(config);

const mutableStdout = new stream.Writable({
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
  .command('submit <file>')
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

async function configure() {
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

  await api.releaseToken().catch(() => {});
}

function _multipleQuestions(questions: Array<any>, callback: (...args) => void) {
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

function _getCredentials(callback: (...args) => void) {
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

function _basicSuccessResponse(message: Response.Message) {
  console.log(message.message);
}

// Using node process to handle basic promise rejections
process.on('unhandledRejection', (reason: Response.Message) => {
  console.error(`(${reason.http_code}) ${reason.error}`);
  process.exit(1);
});


async function login() {
  const loginWithCreds = async function(email, pass) {
    const response = await api.getToken(email, pass);
    const new_config = {
      host: api.config.host,
      token: response.token,
    };
    storage.setItem('config', JSON.stringify(new_config));
    console.log('Hi ' + response.user.first_name + ', you are logged in.');
    console.log('Use the logout command to log out.');
  };

  _getCredentials(loginWithCreds);
}

async function whoAmI(callback: (...ObjectOrPrimitive) => void, ...args) {
  try {
      await api.whoAmI();
      callback(...args);
  } catch (error) {
      console.error('no user logged in');
  }
}

function logout() {
  whoAmI(
    async function() {
      await api.releaseToken();
      console.log('Logged out');
    },
  );
}

function register() {
  let first_name: string;
  let last_name: string;
  let country: string;
  let company: string;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const registerWithCreds = async function(email: string, pass: string) {
    // try {
    await api.register(first_name, last_name, email, pass, company, country)
      .then((r) => {
        _basicSuccessResponse(r);
      })
      .catch((e) => {
        console.error('Failed to register');
        console.error(e.message);
        rl.close();
      });
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

async function verifyEmail() {
  if (this.resend !== undefined) {
    const response = await api.verifyEmailResend(this.resend);
    _basicSuccessResponse(response);
  } else {
    const response = await api.verifyEmail(this.code);
    _basicSuccessResponse(response);
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
            async function(newPassword) {
              console.log('');
              const response = await api.changePassword(oldPassword, newPassword);
              console.log(response.message);
              console.log('You will need to log back in');

              rl.close();
            },
          );
        },
      );
    },
  );
}

async function forgotPassword() {
  const response = await api.forgotPassword(this.email);
  _basicSuccessResponse(response);
}

function resetPassword() {
  const code = this.code;

  _getCredentials(
    async function(email, password) {
      const response = await api.resetPassword(code, email, password);
      _basicSuccessResponse(response);
    },
  );
}

function submitSmartSliceJob(job: string, is3mf: boolean) {
  const outputFile = path.join(
    path.dirname(job),
    path.basename(job).slice(0, job.lastIndexOf('.')) + '.out.json',
  );

  fs.readFile(
    job,
    async (error, data: any) => {
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

        const jobPoll = (response: Response.Job): boolean => {
          const now = new Date();
          console.debug(`${now.toLocaleTimeString()} - Job ${response.id}: ${response.status} (${response.progress})`);
          return abort;
        };

        try {
          const response: Response.Job = await api.submitSmartSliceJobAndPoll(data, jobPoll);
          if (response.status === 'finished') {
            console.log(`Job finished, writing result to ${outputFile}`);
            fs.writeFileSync(outputFile, JSON.stringify(response.result));
          }
        } catch (error) {
          console.error('Job Failed');
          console.error(error);
        }
      }
    },
  );
}

async function cancelSmartSliceJob(jobId: string) {
  const response = await api.cancelSmartSliceJob(jobId);
  console.log(`Job status: ${response.status}`);
}

async function listSmartSliceJobs(page: number, limit: number) {
  if (limit === undefined) {
    limit = 10;
  }

  page = Math.max(1, page);
  limit = Math.max(1, limit);

  const response = await api.listSmartSliceJobs(limit, page);
  console.log(`Page ${response.page}/${response.total_pages}`);
  for (const job of response.jobs) {
    console.log(`${job.id} : ${job.status} (${job.progress})`);
  }
  console.log(`Page ${response.page}/${response.total_pages}`);
}

function createTeam() {
  _multipleQuestions(
    ['Team Name (lowercase a-z, 0-9, "_", and "-" only, 3-64 characters): ', 'Full Team Name: '],
    async function(name, fullName) {
      const response = await api.createTeam(name, fullName);
      _basicSuccessResponse(response);
    },
  );
}

async function listMemberships() {
  const response = await api.teamMemberships();
  console.log(response);
}

async function listTeamMembers(team: string) {
  const response = await api.teamMembers(team);
  console.log(response);
}

async function manageTeamInvite(team: string, email: string, revoke: boolean) {
  if (revoke) {
    await api.revokeTeamInvite(team, email).then((r) => _basicSuccessResponse(r));
  } else {
    await api.inviteToTeam(team, email).then((r) => _basicSuccessResponse(r));
  }
}

async function acceptTeamInvite(team: string) {
  await api. acceptTeamInvite(team).then((r) => _basicSuccessResponse(r));
}

function removeTeamMember(team: string, email: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    `Are you sure you want to remove ${email} from ${team} (y/N): `,
    async (answer) => {
      if (answer.length == 1 && answer.toLowerCase()[0] == 'y') {
        await api.removeTeamMember(team, email).then((r) => _basicSuccessResponse(r));
      } else {
        console.log('Member removal action canceled');
      }
      rl.close();
    },
  );
}

async function addTeamMemberRole(team: string, email: string, role: string) {
  await api.addTeamMemberRole(team, email, role).then((r) => _basicSuccessResponse(r));
}

async function revokeTeamMemberRole(team: string, email: string, role: string) {
  await api.revokeTeamMemberRole(team, email, role).then((r) => _basicSuccessResponse(r));
}
