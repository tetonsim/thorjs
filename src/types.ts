import internal = require('node:stream')
import {API} from './api';

export type Token = {
  expires: string
  id: string
}

export interface XHTTPHeader<N, V> {
  name: N;
  value: V;
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

export interface APIUser {

}

export interface APIConfig {
  host: string;
  token: Token;
}

type BasicPrimitive = string | number | boolean | null | undefined
type BasicObject = Record<string, unknown>
type ObjectOrPrimitive = BasicObject | BasicPrimitive

export namespace Callback {
  type OneParamCallback<T1, T2 = void> = {
    (param1: T1): T2
  }

  export type Success = OneParamCallback<void>
  export type Error = OneParamCallback<ObjectOrPrimitive>

  export type Version = {
    (compatible: boolean, client_version: string, server_version: string): void
  }

  export type GetToken = {
    id?: string
    email?: string
    first_name?: string
    last_name?: string
    (ObjectOrPrimitive): void
  }

  export type sub = { (): void }

  export type Subscription = {
    status?: string
    start?: string
    end?: string
    trial_start?: string
    trial_end?: string
    products?: Array<BasicObject>
    (arg0: ObjectOrPrimitive): void
  }

  export type Job = {
    id: string
    status: string
    progress: number
    result: BasicObject
  }

  export type JobCallback = {
    this?: Job,
    (arg0: ObjectOrPrimitive): void
  }

  export type JobPoll = {
    this?: Job
    (arg0: ObjectOrPrimitive): boolean
  }

  export type ListJob = {
    this?: Job[]
    page?: number
    total_pages?: number
    (arg0: ObjectOrPrimitive): void
  }

  interface APITeam {
    id: string
    name: string
    full_name: string
    roles: Array<string>
  }

  interface APIInvite {
    email: string
  }

  interface APIMembership {
    email: string
    first_name: string
    last_name: string
    roles: Array<string>
  }

  export type APIMembers = {
    members?: APIMembership[]
    invites?: APIInvite[]
    (arg0: ObjectOrPrimitive): void
  }

  export type APITeams = {
    teams?: APITeam[]
    (arg0: ObjectOrPrimitive): void
  }

  export type APISupportIssue = {
    message?: string
    issue?: {
      id: number
      description: string
    }
    (arg0: ObjectOrPrimitive): void
  }

  export type All = Subscription | Success | Error | JobCallback | APIMembers | APITeams | JobPoll | ListJob
}
``;
export type APIJob = Buffer | BasicObject
