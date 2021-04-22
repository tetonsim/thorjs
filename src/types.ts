interface Message {
  http_code: string
  message: string
  success: boolean
  error: string
}

interface GetTokenresponse {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface SubscriptionResponse {
  success: boolean
  status: string
  start: string
  end: string
  trial_start: string
  trial_end: string
  products: Array<Record<string, unknown>>
}

interface JobResponse {
  id: string
  status: string
  progress: number
  result: BasicObject
  errors: any
}

interface Team {
  id: string
  name: string
  full_name: string
  roles: Array<string>
}

interface Invite {
  email: string
}

interface Membership {
  email: string
  first_name: string
  last_name: string
  roles: Array<string>
}

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

export type ObjectOrPrimitive = BasicObject | BasicPrimitive


export namespace Callback {
  export type Success = { (this: Message): void | { (ObjectOrPrimitive): void } } & {(): void}

  export type Error = { (this: Message): void | { (ObjectOrPrimitive): void } } & {(ObjectOrPrimitive): void}

  export type Version = {
    (compatible: boolean, client_version: string, server_version: string): void
  }

  export type GetToken = { (this: GetTokenresponse, ...args): void }

  export type Subscription = { (this: SubscriptionResponse): void }

  export type Job = { (this: JobResponse): void }

  export type JobPoll = { (this: JobResponse): boolean }

  export type ListJob = {
    (this: {
      jobs: JobResponse[]
      page: number
      total_pages: number
    }): void
  }

  export type TeamMembers = {
    (this: {
      members: Membership[],
      invites: Invite[]
    }): void
  }

  export type Teams = {
    (this: {
      teams: Team[]
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

export type APIJob = Buffer | BasicObject
