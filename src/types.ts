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
