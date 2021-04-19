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

export interface Callback {
  (...any): void
}

export interface APIUser {

}

export interface APIConfig {
  host: string;
  token: Token;
}
