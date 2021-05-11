import * as zlib from 'zlib';
import * as dotenv from 'dotenv';
import {
  JobData,
  User,
  Callback,
  Encoding,
  EncodingTypes,
  EncodingValues,
  HTTPMethod,
  Token,
  Response,
} from './types';


if (typeof window === 'undefined') {
  var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}


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

dotenv.config();
const thorVersion = process.env.THOR_VERSION ?? '21.0';


/**
 * Handles Thor API requests
 */
export class API {
  public host: string;
  public token: Token;
  public error: any;
  public user: User;
  public success: any;
  public status: string;
  public http_code: number;
  public id: string;


  constructor(config?: { host: string, token: Token }) {
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
    return thorVersion;
  }

  get config() {
    return {
      host: this.host,
    };
  }


  /**
   *
   * @returns Promise that resolves or rejects to a thor response
   */
  private _request(
    method: HTTPMethod,
    route: string,
    data?,
    encoding?: Encoding,
  ): Promise<Response.Any> {
    return new Promise((resolve, reject) => {
      const xhttp = new XMLHttpRequest();

      xhttp.onreadystatechange = function() {
        let response: Response.Any;

        if (xhttp.readyState === 4) {
          try {
            response = JSON.parse(xhttp.responseText);
          } catch (err) {
            response = xhttp.responseText;
          }

          if (xhttp.getResponseHeader(EncodingTypes.content) == EncodingValues.gzip) {
            zlib.gunzip(response as Buffer, (_, data) => {
              response = JSON.parse(data.toString());
            });
          }

          let err: Message = null;
          if (xhttp.status === 200 || xhttp.status === 202) {
            resolve(response);
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

          if (err !== null) {
            reject(err);
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
        if (encoding && encoding.value == EncodingValues.gzip) {
          zlib.gzip(data, (_, gz) => {
            xhttp.send(gz);
          });
        } else {
          xhttp.send(data);
        }
      } else {
        xhttp.setRequestHeader('Content-Type', 'application/json');
        if (encoding && encoding.value == EncodingValues.gzip) {
          zlib.gzip(JSON.stringify(data), (_, gz) => {
            xhttp.send(gz);
          });
        } else {
          xhttp.send(JSON.stringify(data));
        }
      }
    });
  }

  async verifyVersion() {
    const sv = (await this._request(HTTPMethod.GET, '/') as Response.Version)
      .version.split('.');
    const cv = API.version.split('.');

    const sv_maj = parseInt(sv[0]);
    const sv_min = parseInt(sv[1]);

    const cv_maj = parseInt(cv[0]);
    const cv_min = parseInt(cv[1]);

    // Require the exact same version. As versions advance
    // how can we make this less restrictive?
    return (sv_maj === cv_maj && sv_min === cv_min);
  }

  /**
    * @returns Promise that resolves to Response.GetToken and rejects to Response.Message
    * @example
    * ```ts
    * async function whoAmI() {
    *  let response = await api.whoAmI()
    *    .catch((err: Message) => {
    *      console.log(err)
    *    });
    *  console.log(response)
    * }
    * ```
    */
  async whoAmI(): Promise<Response.GetToken> {
    const success = (response: Response.GetToken) => {
      this.user = response.user;
      this.token = response.token;
      return response;
    };

    const error = () => {
      this.user = null;
      this.token = null;
      return new Message(401, 'No token available');
    };

    return await this._request(HTTPMethod.GET, '/auth/whoami')
      .then(success, error) as Response.GetToken;
  }

  /**
   *
    * @returns Promise that resolves to Response.Message and rejects to Response.Message
   */
  async register(
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    company: string,
    country: string,
  ): Promise<Response.Message> {
    const data = {
      email: email,
      first_name: first_name,
      last_name: last_name,
      password: password,
      company: company,
      country: country,
    };

    return await this._request(HTTPMethod.POST, '/auth/register', data) as Response.Message;
  }

  /**
   *
   * @returns Promise that resolves to Response.GetToken and rejects to  Response.Message
   * @example
   *
   * ```ts
   * async function getToken(email:string, pass: string) {
   *  let response = await api.getToken(email, pass)
   *    .catch((err: Response.Message) => {
   *      console.log(err)
   *     }) as Response.GetToken
   *  console.log(response)
   * }
   * ```
   * */
  async getToken(email: string, password: string): Promise<Response.GetToken> {
    const success = (response: Response.GetToken) => {
      this.token = response.token;
      this.user = response.user;
      return response;
    };

    return await this._request(HTTPMethod.POST, '/auth/token', {email: email, password: password}).then(success) as Response.GetToken;
  }


  setToken(token: Token) {
    this.token = token;
  }

  async refreshToken(): Promise<Response.GetToken> {
    if (this.token === null) {
      return;
    }

    return await this._request(HTTPMethod.PUT, '/auth/token') as Response.GetToken;
  }

  /**
   * Deletes the stored API token.
   */
  async releaseToken(): Promise<Response.Message> {
    return await this._request(HTTPMethod.DELETE, '/auth/token') as Response.Message;
  }

  async verifyEmail(code: string): Promise<Response.Message> {
    return await this._request(HTTPMethod.POST, '/auth/verify', {code: code}) as Response.Message;
  }

  async verifyEmailResend(email: string): Promise<Response.Message> {
    return await this._request(HTTPMethod.POST, '/auth/verify/resend', {email: email}) as Response.Message;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<Response.Message> {
    return await this._request(
      HTTPMethod.POST, '/auth/password/change',
      {
        old_password: oldPassword,
        password: newPassword,
        confirm_password: newPassword,
      },
    ) as Response.Message;
  }

  async forgotPassword(email: string): Promise<Response.Message> {
    return await this._request(
      HTTPMethod.POST,
      '/auth/password/forgot',
      {email: email},
    ) as Response.Message;
  }

  async resetPassword(code: string, email: string, password: string): Promise<Response.Message> {
    return await this._request(
      HTTPMethod.POST, '/auth/password/reset',
      {
        email: email,
        code: code,
        password: password,
        confirm_password: password,
      },
    ) as Response.Message;
  }

  /**
   *
   * @returns Promise that resolves to Response.Subscription and rejects to Response.Message
   */
  async getSmartSliceSubscription(team: string): Promise<Response.Subscription> {
    let url = '/smartslice/subscription';

    if (team) {
      url += `?team=${team}`;
    }

    return await this._request(HTTPMethod.GET, url) as Response.Subscription;
  }

  /**
   * @returns Promise that resolves to Response.Job and rejects to Response.Message
   */
  async submitSmartSliceJob(job: JobData): Promise<Response.Job> {
    const encoding: Encoding = {
      name: EncodingTypes.content,
      value: EncodingValues.gzip,
    };

    return await this._request(
      HTTPMethod.POST, '/smartslice', job, encoding,
    ) as Response.Job;
  }

  async cancelSmartSliceJob(jobId: string): Promise<Response.Message> {
    return await this._request(HTTPMethod.DELETE, `/smartslice/${jobId}`) as Response.Message;
  }

  /**
   *
   * @returns Promise that resolves to Response.Job and rejects to Response.Message
   */
  async getSmartSliceJob(jobId: string, withResults: boolean): Promise<Response.Job> {
    let route = `/smartslice/${jobId}`;
    let encoding: Encoding;

    if (withResults) {
      route = `/smartslice/result/${jobId}`;
      encoding = {
        name: EncodingTypes.accept,
        value: EncodingValues.gzip,
      };
    }

    return await this._request(HTTPMethod.GET, route, null, encoding) as Response.Job;
  }

  async pollSmartSliceJob(response: Response.Job, callback: Callback.JobPoll) {
    const api: API = this;
    const pollAgainStatuses = ['idle', 'queued', 'running'];
    const finishedStatuses = ['finished', 'aborted'];

    const period = 1000;
    const maxPeriod = 30000;
    const periodMultiplier = 1.25;

    async function handleJobStatus() {
      if (pollAgainStatuses.includes(response.status)) {
        if (callback !== undefined) {
          const abort = callback.bind(response)();

          if (abort) {
            api.cancelSmartSliceJob(response.id);
          }
        }

        response = await api.getSmartSliceJob(response.id, true)
          .catch(() => errorHandler());

        callback(response);

        const timeoutPeriod = Math.min(maxPeriod, period * periodMultiplier);
        setTimeout(handleJobStatus, timeoutPeriod);
      } else  {
        return response;
      }
    }

    async function errorHandler() {
      if (this.http_code == 429) {
        // If the error is a rate limit, then just continue polling.
        setTimeout(handleJobStatus, maxPeriod);
      } else if (response) {
        return response;
      }
    }

    return await handleJobStatus()
  }

  async submitSmartSliceJobAndPoll(
    job: JobData,
    poll: Callback.JobPoll,
  ) {
    const that = this;

    const success = async (response: Response.Job) => {
      return await that.pollSmartSliceJob(response, poll);
    };

    const error = (response: Response.Message) => {
      return response;
    };

    const response = await this.submitSmartSliceJob(job)
    return await that.pollSmartSliceJob(response, poll)
  }

  async listSmartSliceJobs(
    limit: number,
    page: number,
  ) {
    const route = `/smartslice/jobs?limit=${limit}&page=${page}`;

    return await this._request(HTTPMethod.GET, route) as Response.ListJob;
  }

  /**
   * Create a new team.
   */
  async createTeam(name: string, fullName: string) {
    return await this._request(
      HTTPMethod.POST, '/teams',
      {
        name: name,
        full_name: fullName,
      },
    ) as Response.Message;
  }

  /**
   * Get a list of the teams the logged in user is a member of
   */
  async teamMemberships() {
    return await this._request(HTTPMethod.GET, '/teams') as Response.Memberships;
  }

  /**
   * Get a list of the members for the given team.
   */
  async teamMembers(team: string) {
    return await this._request(
      HTTPMethod.GET, `/teams/${team}/members`
    ) as Response.TeamMembers;
  }

  /**
   * Invite a user to the given team, by email.
   */
  async inviteToTeam(team: string, email: string) {
    return await this._request(HTTPMethod.POST, `/teams/${team}/invite`,
      {
        email: email
      }
    ) as Response.Message;
  }

  /**
   * Revoke an existing invitation to a user, by email. If the user has already accepted the invite, this will not remove them from the team.
   */
  async revokeTeamInvite(team: string, email: string) {
    return await this._request(HTTPMethod.DELETE, `/teams/${team}/invite`,
      {
        email: email
      }
    ) as Response.Message;
  }

  /**
   * Accept an invite to the given team.
   */
  async acceptTeamInvite(team: string) {
    return await this._request(
      HTTPMethod.GET, `/teams/${team}/invite`
    ) as Response.Message;
  }

  /**
   * Remove a user from the team and all of their roles.
   */
  async removeTeamMember(team: string, email: string) {
    return await this._request(HTTPMethod.DELETE, `/teams/${team}/member`,
      {
        email: email
      }
    ) as Response.Message;
  }

  /**
   * Add a role to a member of a given team.
   */
  async addTeamMemberRole(team: string, email: string, role: string) {
    return await this._request(
      HTTPMethod.POST, `/teams/${team}/role`,
      {
        email: email,
        role: role,
      },
    ) as Response.Message;
  }

  /**
   * Remove a role from a member of a given team.
   */
  async revokeTeamMemberRole(team: string, email: string, role: string) {
    return await this._request(
      HTTPMethod.DELETE, `/teams/${team}/role`,
      {
        email: email,
        role: role,
      },
    ) as Response.Message;
  }

  /**
   * Creates a new customer support issue.
   */
  async createSupportIssue(description: string, jobId: string) {
    if (jobId === undefined) {
      jobId = null;
    }

    return await this._request(
      HTTPMethod.POST, '/support/issue',
      {
        description: description,
        job: jobId,
      },
    ) as Response.SupportIssue;
  }
}
