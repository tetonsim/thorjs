
if (typeof window === 'undefined') {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

  var os = require('os');
  var path = require('path');

  var location = path.join(os.homedir(), '.thor');

  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage(location);
}

const _HelperCallbacks = {
  getToken: function(api, success, error) {
    return function() {
      if (this.error && error !== undefined) {
        error.bind(this)();
      } else {
        api.token = this.token;
        api.user = this.user;

        localStorage.setItem('token', JSON.stringify(api.token));

        if (success !== undefined) {
          success.bind(api.user)();
        }
      }
    }
  }
};

/**
 * An API error
 * @property {number} http_code The HTTP status code returned by the server
 * @property {string} message Generic message
 * @property {string} error Error message
 * @property {boolean} success
 */
class Message {
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
  /**
   * API Constructor
   * @param {Object} [config] API configuration
   * @param {string} config.host=https://api.smartslice.xyz API protocol and host name
   */
  constructor(config) {
    if (config === undefined) {
      config = {
        host: 'https://api.smartslice.xyz'
      };
    }

    this.host = config.host;
    this.error = function() {};

    this.user = null;
    this.token = null;
  }

  static get version() {
    return (typeof THOR_VERSION === 'undefined' ? '20.1' : THOR_VERSION);
  }

  /**
   * @returns The LocalStorage object used by the API
   */
  static get localStorage() {
    return localStorage;
  }

  get config() {
    return {
      host: this.host
    }
  }

  _request(method, route, success, error, data) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState === 4) {
        try {
          var response = JSON.parse(xhttp.responseText);
        } catch(err) {
          var response = xhttp.responseText;
        }

        let err = null;

        if (xhttp.status === 200) {
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
    }

    xhttp.open(method, this.host + route, true);

    xhttp.setRequestHeader('Accept-version', API.version);

    if (this.token !== null) {
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
    let parseVersion = function() {
      let sv = this.version.split('.');
      let cv = API.version.split('.');

      let sv_maj = parseInt(sv[0]);
      let sv_min = parseInt(sv[1]);

      let cv_maj = parseInt(cv[0]);
      let cv_min = parseInt(cv[1]);

      // Require the exact same version. As versions advance
      // how can we make this less restrictive?
      let compatible = (sv_maj === cv_maj && sv_min === cv_min);

      success(compatible, API.version, this.version);
    }

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
      // Check local storage for a token
      let saved_token = localStorage.getItem('token');

      if (saved_token === null || saved_token === undefined) {
        error.bind(new Message(401, 'No token available'))();
        return false;
      }

      this.token = JSON.parse(saved_token);

      getUserInfoFromServer = true;
    }

    if (this.user === null || getUserInfoFromServer) {
      let api = this;

      let clearUser = function() {
        api.user = null;
        api.token = null;
        error.bind(this)();
      }

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
        country: country
      }
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
      error, { email: email, password: password });
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
    var api = this;

    this._request('DELETE', '/auth/token',
      function() {
        if (this.success) {
          api.token = null;
          api.user = null;
          if (success !== undefined) {
            success();
          }

          localStorage.removeItem('token');
        } else {
          if (error !== undefined) {
            error.bind(new Message(400, 'Failed to logout'));
          }
        }
      },
      error
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
      { code: code }
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
      { email: email }
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
        confirm_password: newPassword
      }
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
      { email: email }
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
        confirm_password: password
      }
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
   */
  getSmartSliceSubscription(success, error) {
    this._request(
      'GET', '/smartslice/subscription',
      success,
      error
    );
  }


  /**
   * @typedef Job
   * @type {object}
   * @property {string} this.id
   * @property {string} this.status
   * @property {number} this.progress
   * @property {Object} this.result
   */

  /**
   *
   * @callback API~job-callback
   * @this {Job}
   */

  /**
   *
   * @callback API~job-poll-callback
   * @this {Job}
   * @returns {boolean} If true the job will be cancelled.
   */

  /**
   * Submit and start a new job with the given 3MF specified as a buffer
   * @param {Buffer} tmf
   * @param {API~job-callback} success
   * @param {API~error} error
   */
  submitSmartSliceJob(tmf, success, error) {
    this._request(
      'POST', '/smartslice',
      success,
      error,
      tmf
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
      error
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
    let api = this;
    const pollAgainStatuses = ['idle', 'queued', 'running'];
    const finishedStatuses = ['finished', 'aborted'];

    const maxPeriod = 30000;
    const periodMultiplier = 1.25;

    function pollJob(period) {
      return function() {
        let handleJobStatus = function() {
          console.debug(`Job ${jobId}: ${this.status} (${this.progress})`);
          if (pollAgainStatuses.includes(this.status)) {
            if (poll !== undefined) {
              let abort = poll.bind(this)();

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

        let errorHandler = function() {
          if (this.http_code == 429) {
            // If the error is a rate limit, then just continue polling.
            setTimeout(pollJob(period), period);
          } else {
            error.bind(this)();
          }
        }

        api.getSmartSliceJob(jobId, handleJobStatus, errorHandler, true);
      }
    }

    pollJob(1000)();
  }


  /**
   * Submit and start a new job with the given 3MF specified as a buffer,
   * and then poll it until it has completed or failed.
   * @param {Buffer} tmf
   * @param {API~error} error
   * @param {API~job-callback} finished
   * @param {API~job-callback} failed
   * @param {API~job-poll-callback} poll
   */
  submitSmartSliceJobAndPoll(tmf, error, finished, failed, poll) {
    let that = this;
    this.submitSmartSliceJob(
      tmf,
      function() {
        that.pollSmartSliceJob(this.id, error, finished, failed, poll);
      },
      error
    );
  }
}

module.exports = API;
