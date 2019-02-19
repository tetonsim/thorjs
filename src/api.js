
if (XMLHttpRequest === undefined) {
  var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
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

  _request(method, route, success, error, data) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState === 4) {

        try {
          var response = JSON.parse(xhttp.responseText);
        } catch(err) {
          var response = err.message;
        }

        if (xhttp.status === 200) {
          if (success !== undefined) {
            success(response);
          }
        } else if (xhttp.status === 401) {
          if (error !== undefined) {
            error('Unauthorized');
          }  
        } else if (xhttp.status === 500) {
          if (error !== undefined) {
            error('Internal server error');
          }
        } else {
          if (error !== undefined) {
            error(response);
          }
        }
      }
    }

    xhttp.open(method, this.host + route, false);

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
   * @param {string} error
   */

   /**
    * Checks if a token is already in use and
    * returns the user information if available, otherwise null
    * @returns {Object}
    */
   whoAmI() {
    let getUserInfoFromServer = false;

    if (this.token === null) {
      // Check local storage for a token

      getUserInfoFromServer = true;

      return null;
    }

    if (this.user === null || getUserInfoFromServer) {

    }

    return this.user;
  }

  /**
   * Login successful callback.
   * @callback API~getToken-success
   * @param {Object} user
   * @param {string} user.id
   * @param {string} user.email
   * @param {string} user.first_name
   * @param {string} user.last_name
   */

  /**
   * Retrieves and stores an API token
   * @param {string} email Email address
   * @param {string} password Password
   * @param {API~getToken-success} success Callback function if token is obtained.
   * @param {API~error} error Callback function if token creation fails.
   */
  getToken(email, password, success, error) {
    var api = this;

    var getToken = function(response) {
      if (response.error) {
        if (error !== undefined) {
          error(response.error);
        }
      } else {
        api.token = response.token;
        api.user = response.user;

        if (success !== undefined) {
          success(api.user);
        }
      }
    };

    this._request('POST', '/auth/token', getToken, error, { email: email, password: password });
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

    this._request('PUT', '/auth/token', success, error);
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
      function(response) {
        if (response.success) {
          api.token = null;
          api.user = null;
          if (success !== undefined) {
            success();
          }
        } else {
          if (error !== undefined) {
            error('Failed to logout');
          }
        }
      },
      error);
  }

  /**
   * 
   * @param {MicroRun} run 
   * @param {API~microNewRun-success} success 
   * @param {API~error} error 
   */
  microNewRun(run, success, error) {
    this._request('POST', '/micro/v1/run',
      success, error, run
    );
  }

  /**
   * Retrieve micromechanics run status
   * @param {*} id 
   * @param {*} success 
   * @param {*} error 
   */
  microRunStatus(id, success, error) {
    this._request('GET', '/micro/v1/run/' + id,
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
   * @param {*} completed 
   * @param {*} failed 
   * @param {API~error} error 
   * @param {number} [interval] Interval in ms to re-check status
   * @param {number} [timeout] Time in ms to stop checking for status update
   */
  microRunStatusWait(id, completed, failed, error, interval=1000, timeout=30000) {
    var api = this;

    function getStatus() {
      api.microRunStatus(id, success, error);
    }

    function success(resp) {
      if (resp.status === 'waiting' || resp.status === 'running') {
        setTimeout(getStatus, interval);
      } else if (resp.status === 'completed') {
        completed(resp);
      } else if (resp.status === 'failed') {
        failed(resp);
      }
    }

    getStatus();
  }

  feaTemplateList(success, error, start=0, take=20) {
    this._request('GET', '/fea/v1/templates?s=' + start + '&t=' + take,
      success, error);
  }

  feaTemplate(id, success, error) {
    this._request('GET', '/fea/v1/template/' + id,
      success, error);
  }

  feaModelCreate(model, success, error) {

  }

  feaModelUpdate(id, model, success, error) {

  }

  feaModel(id, success, error) {

  }

  feaRunCreate(model_id, success, error) {

  }

  feaRun(id, success, error) {

  }

  feaRunSubmit(id, success, error) {

  }

  feaRunWait(id, completed, failed, error, interval=1000, timeout=undefined) {

  }
}

module.exports = API;
