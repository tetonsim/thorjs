
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
 * @property {string} message Error message if one is available
 * @property {number} http_code The HTTP status code returned by the server
 * @property {string|number} app_code An error code returned by the back end application, if applicable
 */
class Error {
  constructor(message, http_code, app_code) {
    this.message = message;
    this.http_code = http_code;
    this.app_code = app_code;
  }
}

/**
 * Handles Thor API requests
 */
class API {
  /**
   * API Constructor
   * @param {Object} [config] API configuration
   * @param {string} config.host=https://api.fea.cloud API protocol and host name
   */
  constructor(config) {
    if (config === undefined) {
      config = {
        host: 'https://api.fea.cloud'
      };
    }

    this.host = config.host;
    this.error = function() {};

    this.user = null;
    this.token = null;
  }

  static get version() {
    return '19.0';
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
          var response = err.message;
        }

        let err = null;

        if (xhttp.status === 200) {
          if (success !== undefined) {
            success.bind(response)();
          }
        } else if (xhttp.status === 401) {
          err = new Error('Unauthorized', xhttp.status);
        } else if (xhttp.status === 500) {
          err = new Error('Internal server error', xhttp.status);
        } else {
          err = new Error(response, xhttp.status);
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

    if (method === 'GET') {
      xhttp.send();
    } else {
      xhttp.setRequestHeader('Content-Type', 'application/json');
      xhttp.send(JSON.stringify(data));
    }
  }

  /**
   * API error callback
   * @callback API~error
   * @this {Error}
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
    * @returns {Object}
    * @todo Implement token retrieval
    */
   whoAmI(success, error) {
    let getUserInfoFromServer = false;

    if (this.token === null) {
      // Check local storage for a token
      let saved_token = localStorage.getItem('token');

      if (saved_token === null || saved_token === undefined) {
        error.bind(new Error('No token available', 401))();
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
   * Logout successful callback.
   * @callback API~releaseToken-success
   */

  /**
   * Deletes the stored API token.
   * @param {API~releaseToken-success} success 
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
            error.bind(new Error('Failed to logout'));
          }
        }
      },
      error);
  }

  /**
   * 
   * @callback API~materialSearch-success
   * @this {Material.Material[]}
   */
  
  /**
   * Retrieves all Material definitions
   * @param {API~materialSearch-success} success 
   * @param {API~error} error 
   */
  materialSearch(success, error) {
    this._request('GET', '/material/search', success, error);
  }

  /**
   * 
   * @callback API~materialGet-success
   * @this {Material.Material}
   */
  
  /**
   * Retrieves the Material definition for the given id
   * @param {API~materialGet-success} success 
   * @param {API~error} error 
   */
  materialGet(id, success, error) {
    this._request('GET', '/material/' + id, success, error);
  }

  /**
   * 
   * @callback API~machineSearch-success
   * @this {Hardware.Machine[]}
   */
  
  /**
   * Retrieves all Machine definitions
   * @param {API~machineSearch-success} success 
   * @param {API~error} error 
   */
  machineSearch(success, error) {
    this._request('GET', '/machine/search', success, error);
  }
  /**
   * 
   * @callback API~machineGet-success
   * @this {Hardware.Machine}
   */
  
  /**
   * Retrieves the Machine definition for the given id
   * @param {API~machineGet-success} success 
   * @param {API~error} error 
   */
  machineGet(id, success, error) {
    this._request('GET', '/machine/' + id, success, error);
  }

  /**
   * 
   * @callback API~microRun
   * @this {Micro.Run}
   */

  /**
   * 
   * @param {Micro.Run} run 
   * @param {API~microRun} success 
   * @param {API~error} error 
   */
  microNewRun(run, success, error) {
    this._request('POST', '/micro/run',
      success, error, run
    );
  }

  /**
   * Retrieve MicroRun for given id
   * @param {string} id 
   * @param {API~microRun} success 
   * @param {API~error} error 
   */
  microRunStatus(id, success, error) {
    this._request('GET', '/micro/run/' + id,
      success, error
    );
  }

  /**
   * Checks the run status of the run with the given id until
   * it comes back as completed or failed and calls the appropriate
   * callback. Status is checked periodically at the given interval
   * and will give up and call the error callback if the status does
   * not come back as completed or failed within the timeout.
   * @param {string} id 
   * @param {API~microRun} completed 
   * @param {API~microRun} failed 
   * @param {API~error} error 
   * @param {number} [interval] Interval in ms to re-check status
   * @param {number} [timeout] Time in ms to stop checking for status update
   */
  microRunStatusWait(id, completed, failed, error, interval=1000, timeout=30000) {
    var api = this;

    function getStatus() {
      api.microRunStatus(id, success, error);
    }

    function success() {
      if (this.status === 'waiting' || this.status === 'running') {
        setTimeout(getStatus, interval);
      } else if (this.status === 'completed') {
        completed.bind(this)();
      } else if (this.status === 'failed') {
        failed.bind(this)();
      }
    }

    getStatus();
  }

  /**
   * 
   * @callback API~feaTemplate
   * @this {FEA.Template}
   */

   /**
    * Get list of FEA templates (model definitions will be excluded/null)
    * @param {API~feaTemplate} success 
    * @param {API~error} error 
    * @param {number} start 
    * @param {number} take 
    */
  feaTemplateList(success, error, start=0, take=20) {
    this._request('GET', '/fea/templates?s=' + start + '&t=' + take,
      success, error);
  }

   /**
    * Get a full FEA template definition
    * @param {string} id unique Id of FEA template to retrieve
    * @param {API~feaTemplate} success 
    * @param {API~error} error
    */
  feaTemplate(id, success, error) {
    this._request('GET', '/fea/template/' + id,
      success, error);
  }

  /**
   * 
   * @callback API~feaModel
   * @this {FEA.Model}
   */

  /**
   * 
   * @param {string} name
   * @param {FEA.Model} model 
   * @param {API~feaModel} success 
   * @param {API~error} error 
   */
  feaModelCreate(name, model, success, error) {
    model.id = null;

    this._request('POST', '/fea/model', success, error, { name: name, model: model });
  }

  feaModelSave(id, model, success, error) {
    this._request('PUT', '/fea/model', success, error, { id: id, model: model });
  }

  feaModel(id, success, error) {
    this._request('GET', '/fea/model/' + id, success, error);
  }

  feaRunCreate(model_id, success, error) {
    this._request('POST', '/fea/run', success, error, { model_id: model_id });
  }

  feaRun(id, success, error) {
    this._request('GET', '/fea/run/' + id, success, error);
  }

  feaRunSubmit(id, success, error, force=false) {
    this._request('POST', '/fea/run/submit', success, error, { id: id, force: force });
  }

  feaRunWait(id, completed, failed, error, interval=1000, timeout=undefined) {

  }
}

module.exports = API;
