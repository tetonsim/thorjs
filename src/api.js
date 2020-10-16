
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

        console.log(xhttp.responseText);

        try {
          var response = JSON.parse(xhttp.responseText);
        } catch(err) {
          var response = new Message(400, err.message);
        }

        let err = null;

        if (xhttp.status === 200) {
          if (success !== undefined) {
            success.bind(response)();
          }
        } else if (xhttp.status === 401) {
          err = new Message(xhttp.status, 'Unauthorized');
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

            if ('exception' in response) {
              message = message + ' :: ' + response.exception;
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
      success.bind({
        success: true,
        user: this.user,
        token: this.token
      })();
    }

    return true;
  }

  register(first_name, last_name, email, password, success, error) {
    this._request('POST', '/auth/register', success, error,
      {
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: password
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
}

module.exports = API;
