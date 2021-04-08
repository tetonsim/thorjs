export {};
let XMLHttpRequest;
if (typeof window === 'undefined') {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}

const _HelperCallbacks = {
  getToken: function(api, success, error) {
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

/**
 * An API error
 * @property {number} http_code The HTTP status code returned by the server
 * @property {string} message Generic message
 * @property {string} error Error message
 * @property {boolean} success
 */
class Message {
	public http_code: any;
	public message: any;
	public success: any;
	public error: any;

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
class API {
	public host: any;
	public token: any;
	public error: any;
	public user: any;
	public version: any;
	public success: any;
	public status: any;
	public http_code: any;
	public id: any;

  /** @typedef Token
   * @property {string} expires Token expiration date
   * @property {string} id Token id
   */

  /**
   * API Constructor
   * @param {Object} [config] API configuration
   * @param {string} config.host=https://api.smartslice.xyz API protocol and host name
   * @param {Token} config.token Authorization bearer token to use in API calls
   */
  constructor(config) {
    if (config === undefined) {
      config = {
        host: 'https://api.smartslice.xyz',
        token: null,
      };
    }

    this.host = config.host;
    this.token = config.token;

    this.error = function() {};
    this.user = null;
  }

  static get version() {
    return '21.0'
    // return (typeof THOR_VERSION === 'undefined' ? '21.0' : THOR_VERSION);
  }

  get config() {
    return {
      host: this.host,
    };
  }

  _request(method, route, success, error, data?) {
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
      let response;
      
      if (xhttp.readyState === 4) {
        try {
          response = JSON.parse(xhttp.responseText);
        } catch (err) {
          response = xhttp.responseText;
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

    if (this.token) {
      xhttp.setRequestHeader('Authorization', 'Bearer ' + this.token.id);
    }

    if (method === 'GET' || data === undefined) {
      xhttp.send();
    } else if (data instanceof Buffer) {
      xhttp.setRequestHeader('Content-Type', 'model/3mf');
      xhttp.send(data);
    } else {
      xhttp.setRequestHeader('Content-Type', 'application/json');
      xhttp.send(JSON.stringify(data));
    }
  }

  /**
   * API general success callback to indicate a successful
   * API call when no particular object information is returned.
   * For example - to indicate a successful object deletion.
   * @callback API~success
   * @this {Object}
   * @this {Message}
   */

  /**
   * API error callback
   * @callback API~error
   * @this {Message}
   */

  /**
    * Verify version successfull callback
    * @callback API~verify-version
    * @param {boolean} compatible True if the host version is compatible with this client library
    * @param {string} client_version The client version - also available through API.version
    * @param {string} server_version The server version
    */

  /**
  *
  * @param {API~verify-version} success
  * @param {API~error} error
  */
  verifyVersion(success, error) {
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

    this._request('GET', '/', parseVersion, error);
  }

  /**
    * Checks if a token is already in use and
    * returns the user information if available, otherwise null
    * @param {API~getToken-success} success
    * @param {API~error} error
    */
  whoAmI(success, error) {
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

      this._request('GET', '/auth/whoami', _HelperCallbacks.getToken(api, success, error), clearUser);
    } else {
      success.bind(this.user)();
    }

    return true;
  }

  register(first_name, last_name, email, password, company, country, success, error) {
    this._request('POST', '/auth/register', success, error,
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
   * Login successful callback.
   * @callback API~getToken-success
   * @this {Object}
   * @param {string} this.id
   * @param {string} this.email
   * @param {string} this.first_name
   * @param {string} this.last_name
   */

  /**
   * Retrieves and stores an API token
   * @param {string} email Email address
   * @param {string} password Password
   * @param {API~getToken-success} success Callback function if token is obtained.
   * @param {API~error} error Callback function if token creation fails.
   */
  getToken(email, password, success, error) {
    this._request('POST', '/auth/token', _HelperCallbacks.getToken(this, success, error),
      error, {email: email, password: password});
  }

  /**
   *
   * @param {Token} token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Refreshes the API token. This is not usable for expired tokens. If a refresh
   * is attempted on an expired token the server will return 401 Unauthorized.
   * @param {API~getToken-success} success Callback function if refresh is successful.
   * @param {API~error} error Callback function if refresh is unsuccessful.
   */
  refreshToken(success, error) {
    if (this.token === null) {
      error('null token');
      return;
    }

    this._request('PUT', '/auth/token', _HelperCallbacks.getToken(this, success, error), error);
  }

  /**
   * Deletes the stored API token.
   * @param {API~success} success
   * @param {API~error} error
   */
  releaseToken(success, error) {
    const api = this;

    this._request('DELETE', '/auth/token',
      function() {
        if (this.success) {
          api.token = null;
          api.user = null;
          if (success !== undefined) {
            success();
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

  /**
   * Verifies registered email using the given code which is sent in the post-registration email.
   * @param {string} code
   * @param {API~success} success
   * @param {API~error} error
   */
  verifyEmail(code, success, error) {
    this._request(
      'POST', '/auth/verify',
      success,
      error,
      {code: code},
    );
  }

  /**
   * Requests a resend of the post-registration email.
   * @param {API~success} success
   * @param {API~error} error
   */
  verifyEmailResend(email, success, error) {
    this._request(
      'POST', '/auth/verify/resend',
      success,
      error,
      {email: email},
    );
  }

  /**
   * Change password of logged in user
   * @param {string} oldPassword
   * @param {string} newPassword
   * @param {API~success} success
   * @param {API~error} error
   */
  changePassword(oldPassword, newPassword, success, error) {
    this._request(
      'POST', '/auth/password/change',
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
   * @param {string} email
   * @param {API~success} success
   * @param {API~error} error
   */
  forgotPassword(email, success, error) {
    this._request(
      'POST', '/auth/password/forgot',
      success,
      error,
      {email: email},
    );
  }

  /**
   * Use the code retrieved from the /auth/password/forgot call to reset password.
   * @param {string} code
   * @param {string} email
   * @param {string} password
   * @param {API~success} success
   * @param {API~error} error
   */
  resetPassword(code, email, password, success, error) {
    this._request(
      'POST', '/auth/password/reset',
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
   *
   * @callback API~subscription-callback
   * @this {Object}
   * @param {string} this.status
   * @param {string} this.start
   * @param {string} this.end
   * @param {string} this.trial_start
   * @param {string} this.trial_end
   * @param {Object[]} this.products
   */

  /**
   * Retrieve the Smart Slice subscription the user has access to
   * @param {API~subscription-callback} success
   * @param {API~error} error
   * @param {string} team Optional team name (short name) to retrieve subscription for
   */
  getSmartSliceSubscription(success, error, team) {
    let url = '/smartslice/subscription';

    if (team) {
      url += `?team=${team}`;
    }

    this._request(
      'GET', url,
      success,
      error,
    );
  }

  /**
   * @typedef API~Job
   * @type {object}
   * @property {string} id
   * @property {string} status
   * @property {number} progress
   * @property {Object} result
   */

  /**
   *
   * @callback API~job-callback
   * @this {API~Job}
   */

  /**
   *
   * @callback API~job-poll-callback
   * @this {API~Job}
   * @returns {boolean} If true the job will be cancelled.
   */

  /**
   *
   * @callback API~list-job-callback
   * @this {Object}
   * @property {API~Job[]} this.jobs
   * @property {integer} this.page
   * @property {integer} this.total_pages
   */

  /**
   * Submit and start a new job with the given 3MF specified as a buffer
   * @param {Buffer | Object} job
   * @param {API~job-callback} success
   * @param {API~error} error
   */
  submitSmartSliceJob(job, success, error) {
    this._request(
      'POST', '/smartslice',
      success,
      error,
      job,
    );
  }

  /**
   * Cancellation requestion of a running job
   * @param {string} jobId
   * @param {API~success} success
   * @param {API~error} error
   */
  cancelSmartSliceJob(jobId, success, error) {
    this._request(
      'DELETE', `/smartslice/${jobId}`,
      success,
      error,
    );
  }

  /**
   * Retrieve a job by it's unique id
   * @param {string} jobId
   * @param {API~job-callback} success
   * @param {API~error} error
   * @param {boolean} withResults The job will include the result attribute if true
   */
  getSmartSliceJob(jobId, success, error, withResults) {
    let route = `/smartslice/${jobId}`;

    if (withResults) {
      route = `/smartslice/result/${jobId}`;
    }

    this._request('GET', route, success, error);
  }

  /**
   * Polls a running job until it has completed or failed.
   * @param {string} jobId
   * @param {API~error} error
   * @param {API~job-callback} finished
   * @param {API~job-callback} failed
   * @param {API~job-poll-callback} poll
   */
  pollSmartSliceJob(jobId, error, finished, failed, poll) {
    const api = this;
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
                api.cancelSmartSliceJob(jobId, () => {}, () => {});
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
   * @param {Buffer} job
   * @param {API~error} error
   * @param {API~job-callback} finished
   * @param {API~job-callback} failed
   * @param {API~job-poll-callback} poll
   */
  submitSmartSliceJobAndPoll(job, error, finished, failed, poll) {
    const that = this;
    this.submitSmartSliceJob(
      job,
      function() {
        that.pollSmartSliceJob(this.id, error, finished, failed, poll);
      },
      error,
    );
  }

  /**
   *
   * @param {integer} limit Number of jobs to retrieve
   * @param {integer} page The page of jobs to retrieve (offset)
   * @param {API~list-job-callback} success
   * @param {API~error} error
   */
  listSmartSliceJobs(limit, page, success, error) {
    const route = `/smartslice/jobs?limit=${limit}&page=${page}`;

    this._request('GET', route, success, error);
  }

  /**
   * @typedef API~Team
   * @type {object}
   * @property {string} id
   * @property {string} name
   * @property {string} full_name
   * @property {string[]} roles
   */

  /**
   * @typedef API~Membership
   * @type {object}
   * @property {string} email
   * @property {string} first_name
   * @property {string} last_name
   * @property {string[]} roles
   */

  /**
   * @typedef API~Invite
   * @type {object}
   * @property {string} email
   */

  /**
   *
   * @callback API~teams-callback
   * @this {Object}
   * @property {API~Team[]} this.memberships
   */

  /**
   *
   * @callback API~members-callback
   * @this {Object}
   * @property {API~Membership[]} this.members
   * @property {API~Invite[]} this.invites
   */

  /**
   * Create a new team.
   * @param {string} name The short name of the team. Must be between 3-64 characters. Only lowercase a-z, 0-9, "_" and "-" are acceptable.
   * @param {string} fullName The full name of the team.
   * @param {API~success} success
   * @param {API~error} error
   */
  createTeam(name, fullName, success, error) {
    this._request(
      'POST', '/teams',
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
   * @param {API~teams-callback} success
   * @param {API~error} error
   */
  teamMemberships(success, error) {
    this._request('GET', '/teams', success, error);
  }

  /**
   * Get a list of the members for the given team.
   * @param {string} team Team name (short).
   * @param {API~members-callback} success
   * @param {API~error} error
   */
  teamMembers(team, success, error) {
    this._request('GET', `/teams/${team}/members`, success, error);
  }

  /**
   * Invite a user to the given team, by email.
   * @param {string} team Team name (short).
   * @param {string} email Email of user to invite. This can be the email of an existing user or a user who has not registered yet.
   * @param {API~success} success
   * @param {API~error} error
   */
  inviteToTeam(team, email, success, error) {
    this._request('POST', `/teams/${team}/invite`, success, error, {email: email});
  }

  /**
   * Revoke an existing invitation to a user, by email. If the user has already accepted the invite, this will not remove them from the team.
   * @param {string} team Team name (short).
   * @param {string} email Email of user to for which to revoke an existing invitation.
   * @param {API~success} success
   * @param {API~error} error
   */
  revokeTeamInvite(team, email, success, error) {
    this._request('DELETE', `/teams/${team}/invite`, success, error, {email: email});
  }

  /**
   * Accept an invite to the given team.
   * @param {string} team Team name (short).
   * @param {API~success} success
   * @param {API~error} error
   */
  acceptTeamInvite(team, success, error) {
    this._request('GET', `/teams/${team}/invite`, success, error);
  }

  /**
   * Remove a user from the team and all of their roles.
   * @param {string} team Team name (short).
   * @param {string} email Email of user to remove.
   * @param {API~success} success
   * @param {API~error} error
   */
  removeTeamMember(team, email, success, error) {
    this._request('DELETE', `/teams/${team}/member`, success, error, {email: email});
  }

  /**
   * Add a role to a member of a given team.
   * @param {string} team Team name (short).
   * @param {string} email Email of user to add the given role to.
   * @param {string} role The name of the role to add to the given user.
   * @param {API~success} success
   * @param {API~error} error
   */
  addTeamMemberRole(team, email, role, success, error) {
    this._request(
      'POST', `/teams/${team}/role`,
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
   * @param {string} team Team name (short).
   * @param {string} email Email of user to add the given role to.
   * @param {string} role The name of the role to add to the given user.
   * @param {API~success} success
   * @param {API~error} error
   */
  revokeTeamMemberRole(team, email, role, success, error) {
    this._request(
      'DELETE', `/teams/${team}/role`,
      success,
      error,
      {
        email: email,
        role: role,
      },
    );
  }

  /**
   *
   * @callback API~support-issue-callback
   * @this {Object}
   * @property {string} this.message
   * @property {Object} this.issue
   * @property {integer} this.issue.id
   * @property {string} this.issue.description
   */

  /**
   * Creates a new customer support issue.
   * @param {string} description Description of issue/request
   * @param {API~support-issue-callback} success
   * @param {API~error} error
   * @param {string} jobId Id of job the issue is related to. Can be null if the issue is not related to a job.
   */
  createSupportIssue(description, success, error, jobId) {
    if (jobId === undefined) {
      jobId = null;
    }

    this._request(
      'POST', '/support/issue',
      success,
      error,
      {
        description: description,
        job: jobId,
      },
    );
  }
}

module.exports = API;
