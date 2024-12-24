import { OpenApiMeta, SchemaMeta } from './types';

import { createMetadata } from '@core';

import { SWAGGER_CONFIG_METADATA, SWAGGER_SCHEMA_METADATA, SWAGGER_DOC_METADATA  } from './helpers/constants/constants';



// get metadata and create proxy base on OpenApiMeta
function getOpenApiProxy<T>(target: object, key: string | symbol, initdata?: object): T {
  // base OpenApiMeta create deep proxy
  const proxy = createMetadata(target, key, () => (initdata || {}));
  return proxy as T;
}


export function getOpenApiDoc(target: object): any {
  const methodMeta = getOpenApiProxy<any>(target, SWAGGER_DOC_METADATA, {
    openapi: '3.0.3',
    tags: [],
    paths: {},
    security: [],
    components: {},
  });
  return methodMeta;
}



export function getOpenApiMeta(target: object): OpenApiMeta {
  const methodMeta = getOpenApiProxy<OpenApiMeta>(target, SWAGGER_CONFIG_METADATA);
  return methodMeta;
}

export function getSchemaMeta(target: object): SchemaMeta {
  const methodMeta = getOpenApiProxy<SchemaMeta>(target, SWAGGER_SCHEMA_METADATA);
  return methodMeta;
}
