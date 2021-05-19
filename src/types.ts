import {Job} from './smartslice/job/job';

interface XHTTPHeader<N, V> {
  name: N;
  value: V;
}

type BasicPrimitive = string | number | boolean | null | undefined

type BasicObject = Record<string, unknown>

export type Token = {
  expires: string
  id: string
}

export enum EncodingTypes {
  content = 'Content-Encoding',
  accept = 'Accept-Encoding'
}

export enum EncodingValues {
  gzip = 'gzip'
}

export type Encoding = XHTTPHeader<EncodingTypes, EncodingValues>


export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
  PUT = 'PUT'
}

export interface User {
  email: string
  email_verified: boolean
  id: string
  first_name: string
  last_name: string
}

export interface APIConfig {
  host: string;
  token: Token;
}

export namespace Response {
  export interface Version {
    version: string
  }

  export interface Message {
    status: string
    http_code: string
    message: string
    success: boolean
    error: string
  }

  export interface GetToken {
    user: User
    token: Token
  }

  export interface Subscription {
    success: boolean
    status: string
    start: string
    end: string
    trial_start: string
    trial_end: string
    products: Array<Record<string, unknown>>
  }

  export interface Job {
    id: string
    status: string
    progress: number
    result: BasicObject
    errors: any
  }

  export interface Team {
    id: string
    name: string
    full_name: string
    roles: Array<string>
  }

  export interface Invite {
    email: string
  }

  export interface Membership {
    email: string
    first_name: string
    last_name: string
    roles: Array<string>
  }

  export interface ListJob {
    jobs: Response.Job[]
    page: number
    total_pages: number
  }

  export interface SupportIssue {
    message: string,
    issue: {
      id: number,
      description: string
    }
  }

  export interface TeamMembers {
    members: Membership[],
    invites: Invite[]
  }

  export interface TeamMember {
    full_name: string,
    id: string
    name: string
    roles: Array<string>
  }

  export interface Memberships {
    memberships: Array<TeamMember>
  }

  export type Any =
    | Membership
    | Invite
    | Team
    | Job
    | Subscription
    | GetToken
    | Message
    | Version
    | Buffer
    | TeamMembers
    | SupportIssue
    | ListJob
    | Memberships
}

export namespace Callback {
  export type Success = { (this: Response.Message): void }

  export type Error = { (this: Response.Message): void }

  export type Version = {
    (compatible: boolean, client_version: string, server_version: string): void
  }

  export type GetToken = { (this: Response.GetToken, ...args): void }

  export type Subscription = { (this: Response.Subscription): void }

  export type Job = { (this: Response.Job): void }

  export type JobPoll = { (response:Response.Job): boolean | void }

  export type ListJob = {
    (this: {
      jobs: Response.Job[]
      page: number
      total_pages: number
    }): void
  }

  export type TeamMembers = {
    (this: {
      members: Response.Membership[],
      invites: Response.Invite[]
    }): void
  }

  export type Teams = {
    (this: {
      teams: Response.Team[]
    }): void
  }

  export type SupportIssue = {
    (this: {
      message: string,
      issue: {
        id: number,
        description: string
      }
    }): void
  }

  export type Any =
    Subscription | SupportIssue | Success |
    Error | Job | TeamMembers | Teams |
    JobPoll | ListJob | Version | GetToken
}

export type JobData = Buffer | Job

