import { InjectionToken } from '@di';

export const HTTP_ADAPTER = new InjectionToken('__server_http__:adapter');


export const METHOD_TEMPLATE_METADATA = '__server__:method:template';


export enum HttpMethodType {
  ALL = 'all',
  DELETE = 'delete',
  GET = 'get',
  HEAD = 'head',
  OPTIONS = 'options',
  PATCH = 'patch',
  POST = 'post',
  PUT = 'put',
}


export enum ParameterType {
  BODY = 'body',
  COOKIE = 'cookie',
  HEADER = 'header',
  PARAM = 'path',
  QUERY = 'query',
  REQUEST = 'request',
  RESPONSE = 'response',
  NEXT = 'next',
}



export const SOURCE_TYPE = 'http';

