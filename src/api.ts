import * as zlib from 'zlib';
import {
  JobData,
  User,
  Callback,
  Encoding,
  EncodingTypes,
  EncodingValues,
  HTTPMethod,
  Token,
} from './types';

let XMLHttpRequest;

if (typeof window === 'undefined') {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}

const _HelperCallbacks = {
  getToken: function(api: API, success: Callback.GetToken, error: Callback.Error) {
    return function() {
      if (this.error && error !== undefined) {
        error.bind(this)();
      } else {
        api.token = this.token;
        api.user = this.user;

        if (success !== undefined) {
          success.bind(api.user)();
        }
      }
    };
  },
};


class Message {
  public http_code: number;
  public message: string;
  public success: boolean;
  public error: string;


  constructor(http_code, message) {
    this.http_code = http_code;
    this.message = message;
    if (http_code >= 400) {
      this.success = false;
      this.error = message;
    } else {
      this.success = true;
      this.error = null;
    }
  }
}

/**
 * Handles Thor API requests
 */
export class API {
  public host: string;
  public token: Token;
  public error: any;
  public user: User;
  public version: string | number;
  public success: any;
  public status: string;
  public http_code: number;
  public id: string;

  constructor(config?) {
    if (config === undefined) {
      config = {
        host: 'https://api.smartslice.xyz',
        token: null,
      };
    }

    this.host = config.host;
    this.token = config.token;

    this.error = function() { };
    this.user = null;
  }

  static get version() {
    return '21.0';
    // return (typeof THOR_VERSION === 'undefined' ? '21.0' : THOR_VERSION);
  }

  get config() {
    return {
      host: this.host,
    };
  }

  _request(method: HTTPMethod, route: string, success: Callback.Any, error: Callback.Error, data?, encoding?: Encoding) {
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      let response;

      if (xhttp.readyState === 4) {
        try {
          response = JSON.parse(xhttp.responseText);
        } catch (err) {
          response = xhttp.responseText;
        }

        if (xhttp.getResponseHeader(EncodingTypes.content) == EncodingValues.gzip) {
          zlib.gunzip(response, (_, data) => {
            response = JSON.parse(data.toString());
          });
        }

        let err = null;

        if (xhttp.status === 200 || xhttp.status === 202) {
          if (success !== undefined) {
            success.bind(response)();
          }
        } else if (xhttp.status === 401) {
          err = new Message(xhttp.status, 'Unauthorized');
        } else if (xhttp.status === 404) {
          err = new Message(xhttp.status, 'Not Found');
        } else if (xhttp.status === 500) {
          err = new Message(xhttp.status, 'Internal server error');
        } else {
          let message = null;

          if (typeof response === 'string') {
            message = response;
          } else {
            if ('error' in response) {
              message = response.error;
            }

            if (message === null) {
              message = response;
            }
          }

          err = new Message(xhttp.status, message);
        }

        if (err !== null && error !== undefined) {
          error.bind(err)();
        }
      }
    };

    xhttp.open(method, this.host + route, true);

    xhttp.setRequestHeader('Accept-version', API.version);

    if (encoding) {
      xhttp.setRequestHeader(encoding.name, encoding.value);
    }

    if (this.token) {
      xhttp.setRequestHeader('Authorization', 'Bearer ' + this.token.id);
    }

    if (method === 'GET' || data === undefined) {
      xhttp.send();
    } else if (data instanceof Buffer) {
      xhttp.setRequestHeader('Content-Type', 'model/3mf');
      if (xhttp.getRequestHeader(EncodingTypes.content) == EncodingValues.gzip) {
        zlib.gzip(data, (_, gz) => {
          xhttp.send(gz);
        });
      } else {
        xhttp.send(data);
      }
    } else {
      xhttp.setRequestHeader('Content-Type', 'application/json');

      if (xhttp.getRequestHeader(EncodingTypes.content) == EncodingValues.gzip) {
        zlib.gzip(JSON.stringify(data), (_, gz) => {
          xhttp.send(gz);
        });
      } else {
        xhttp.send(JSON.stringify(data));
      }
    }
  }


  verifyVersion(success: Callback.Version, error: Callback.Error) {
    const parseVersion = function() {
      const sv = this.version.split('.');
      const cv = API.version.split('.');

      const sv_maj = parseInt(sv[0]);
      const sv_min = parseInt(sv[1]);

      const cv_maj = parseInt(cv[0]);
      const cv_min = parseInt(cv[1]);

      // Require the exact same version. As versions advance
      // how can we make this less restrictive?
      const compatible = (sv_maj === cv_maj && sv_min === cv_min);

      success(compatible, API.version, this.version);
    };

    this._request(HTTPMethod.GET, '/', parseVersion, error);
  }

  /**
    * Checks if a token is already in use and
    * returns the user information if available, otherwise null
    */
  whoAmI(success: Callback.GetToken, error: Callback.Error) {
    let getUserInfoFromServer = false;

    if (this.token === null) {
      getUserInfoFromServer = true;

      error.bind(new Message(401, 'No token available'))();
      return false;
    }

    if (this.user === null || getUserInfoFromServer) {
      const api = this;

      const clearUser = function() {
        api.user = null;
        api.token = null;
        error.bind(this)();
      };

      this._request(HTTPMethod.GET, '/auth/whoami', _HelperCallbacks.getToken(api, success, error), clearUser);
    } else {
      success.bind(this.user)();
    }

    return true;
  }

  register(
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    company: string,
    country: string,
    success: Callback.Success,
    error: Callback.Error,
  ) {
    this._request(HTTPMethod.POST, '/auth/register', success, error,
      {
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: password,
        company: company,
        country: country,
      },
    );
  }

  /**
   * Retrieves API token
   */
  getToken(email: string, password: string, success: Callback.GetToken, error: Callback.Error) {
    this._request(HTTPMethod.POST, '/auth/token', _HelperCallbacks.getToken(this, success, error),
      error, {email: email, password: password});
  }

  /**
   *
   * @param {Token} token
   */
  setToken(token: Token) {
    this.token = token;
  }

  /**
   * Refreshes the API token. This is not usable for expired tokens. If a refresh
   * is attempted on an expired token the server will return 401 Unauthorized.
   */
  refreshToken(success: Callback.GetToken, error: Callback.Error) {
    if (this.token === null) {
      error.call('null token');
      return;
    }

    this._request(HTTPMethod.PUT, '/auth/token', _HelperCallbacks.getToken(this, success, error), error);
  }

  /**
   * Deletes the stored API token.
   */
  releaseToken(success: Callback.Success, error: Callback.Error) {
    const api = this;

    this._request(HTTPMethod.DELETE, '/auth/token',
      function() {
        if (this.success) {
          api.token = null;
          api.user = null;
          if (success !== undefined) {
            success.call(this);
          }
        } else {
          if (error !== undefined) {
            error.bind(new Message(400, 'Failed to logout'));
          }
        }
      },
      error,
    );
  }

  verifyEmail(code: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.POST, '/auth/verify',
      success,
      error,
      {code: code},
    );
  }

  verifyEmailResend(email: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.POST, '/auth/verify/resend',
      success,
      error,
      {email: email},
    );
  }

  changePassword(oldPassword: string, newPassword: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.POST, '/auth/password/change',
      success,
      error,
      {
        old_password: oldPassword,
        password: newPassword,
        confirm_password: newPassword,
      },
    );
  }

  /**
   * Begin the reset password process by requesting an email to reset your password.
   */
  forgotPassword(email: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.POST, '/auth/password/forgot',
      success,
      error,
      {email: email},
    );
  }

  /**
   * Use the code retrieved from the /auth/password/forgot call to reset password.
   */
  resetPassword(code: string, email: string, password: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.POST, '/auth/password/reset',
      success,
      error,
      {
        email: email,
        code: code,
        password: password,
        confirm_password: password,
      },
    );
  }

  /**
   * Retrieve the Smart Slice subscription the user has access to
   */
  getSmartSliceSubscription(
    success: Callback.Subscription,
    error: Callback.Error,
    team: string,
  ) {
    let url = '/smartslice/subscription';

    if (team) {
      url += `?team=${team}`;
    }

    this._request(
      HTTPMethod.GET, url,
      success,
      error,
    );
  }

  submitSmartSliceJob(job: JobData, success: Callback.Job, error: Callback.Error) {
    const encoding: Encoding = {
      name: EncodingTypes.content,
      value: EncodingValues.gzip,
    };

    this._request(
      HTTPMethod.POST, '/smartslice',
      success,
      error,
      job,
      encoding,
    );
  }

  cancelSmartSliceJob(jobId: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.DELETE, `/smartslice/${jobId}`,
      success,
      error,
    );
  }

  getSmartSliceJob(jobId: string, success: Callback.Job, error: Callback.Error, withResults: boolean) {
    let route = `/smartslice/${jobId}`;
    let encoding: Encoding;

    if (withResults) {
      route = `/smartslice/result/${jobId}`;
      encoding = {
        name: EncodingTypes.accept,
        value: EncodingValues.gzip,
      };
    }

    this._request(HTTPMethod.GET, route, success, error, encoding);
  }

  /**
   * Polls a running job until it has completed or failed.
   */
  pollSmartSliceJob(
    jobId: string,
    error: Callback.Error,
    finished: Callback.Job,
    failed: Callback.Job,
    poll: Callback.JobPoll,
  ) {
    const api: API = this;
    const pollAgainStatuses = ['idle', 'queued', 'running'];
    const finishedStatuses = ['finished', 'aborted'];

    const maxPeriod = 30000;
    const periodMultiplier = 1.25;

    function pollJob(period) {
      return function() {
        const handleJobStatus = function() {
          if (pollAgainStatuses.includes(this.status)) {
            if (poll !== undefined) {
              const abort = poll.bind(this)();

              if (abort) {
                api.cancelSmartSliceJob(jobId, () => { }, () => { });
              }
            }

            period = Math.min(maxPeriod, period * periodMultiplier);

            setTimeout(pollJob(period), period);
          } else if (finishedStatuses.includes(this.status)) {
            finished.bind(this)();
          } else {
            failed.bind(this)();
          }
        };

        const errorHandler = function() {
          if (this.http_code == 429) {
            // If the error is a rate limit, then just continue polling.
            setTimeout(pollJob(period), period);
          } else {
            error.bind(this)();
          }
        };

        api.getSmartSliceJob(jobId, handleJobStatus, errorHandler, true);
      };
    }

    pollJob(1000)();
  }

  /**
   * Submit and start a new job with the given 3MF specified as a buffer,
   * and then poll it until it has completed or failed.
   */
  submitSmartSliceJobAndPoll(
    job: JobData,
    error: Callback.Error,
    finished: Callback.Job,
    failed: Callback.Job,
    poll: Callback.JobPoll,
  ) {
    const that = this;
    this.submitSmartSliceJob(
      job,
      function() {
        that.pollSmartSliceJob(this.id, error, finished, failed, poll);
      },
      error,
    );
  }

  listSmartSliceJobs(
    limit: number,
    page: number,
    success: Callback.ListJob,
    error: Callback.Error,
  ) {
    const route = `/smartslice/jobs?limit=${limit}&page=${page}`;

    this._request(HTTPMethod.GET, route, success, error);
  }

  /**
   * Create a new team.
   */
  createTeam(name: string, fullName: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.POST, '/teams',
      success,
      error,
      {
        name: name,
        full_name: fullName,
      },
    );
  }

  /**
   * Get a list of the teams the logged in user is a member of
   */
  teamMemberships(success: Callback.Success, error: Callback.Error) {
    this._request(HTTPMethod.GET, '/teams', success, error);
  }

  /**
   * Get a list of the members for the given team.
   */
  teamMembers(team: string, success: Callback.TeamMembers, error: Callback.Error) {
    this._request(HTTPMethod.GET, `/teams/${team}/members`, success, error);
  }

  /**
   * Invite a user to the given team, by email.
   */
  inviteToTeam(team: string, email: string, success: Callback.Success, error: Callback.Error) {
    this._request(HTTPMethod.POST, `/teams/${team}/invite`, success, error, {email: email});
  }

  /**
   * Revoke an existing invitation to a user, by email. If the user has already accepted the invite, this will not remove them from the team.
   */
  revokeTeamInvite(team: string, email: string, success: Callback.Success, error: Callback.Error) {
    this._request(HTTPMethod.DELETE, `/teams/${team}/invite`, success, error, {email: email});
  }

  /**
   * Accept an invite to the given team.
   */
  acceptTeamInvite(team: string, success: Callback.Success, error: Callback.Error) {
    this._request(HTTPMethod.GET, `/teams/${team}/invite`, success, error);
  }

  /**
   * Remove a user from the team and all of their roles.
   */
  removeTeamMember(team: string, email: string, success: Callback.Success, error: Callback. Error) {
    this._request(HTTPMethod.DELETE, `/teams/${team}/member`, success, error, {email: email});
  }

  /**
   * Add a role to a member of a given team.
   */
  addTeamMemberRole(team: string, email: string, role: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.POST, `/teams/${team}/role`,
      success,
      error,
      {
        email: email,
        role: role,
      },
    );
  }

  /**
   * Remove a role from a member of a given team.
   */
  revokeTeamMemberRole(team: string, email: string, role: string, success: Callback.Success, error: Callback.Error) {
    this._request(
      HTTPMethod.DELETE, `/teams/${team}/role`,
      success,
      error,
      {
        email: email,
        role: role,
      },
    );
  }

  /**
   * Creates a new customer support issue.
   */
  createSupportIssue(description: string, success: Callback.SupportIssue, error: Callback.Error, jobId: string) {
    if (jobId === undefined) {
      jobId = null;
    }

    this._request(
      HTTPMethod.POST, '/support/issue',
      success,
      error,
      {
        description: description,
        job: jobId,
      },
    );
  }
}
