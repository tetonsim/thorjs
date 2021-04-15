export type Token = {
  expires: string
  id: string
}

export interface XHTTPHeader<T, V> {
  type: T;
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
