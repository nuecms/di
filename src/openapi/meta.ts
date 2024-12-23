import { OpenApiMeta, SchemaMeta } from './types';

import { createMetadata } from '@core';

import { SWAGGER_CONFIG_METADATA, SWAGGER_SCHEMA_METADATA  } from './helpers/constants/constants';



// get metadata and create proxy base on OpenApiMeta
function getOpenApiProxy<T>(target: object, key: string | symbol): T {
  // base OpenApiMeta create deep proxy
  const proxy = createMetadata(target, key, () => ({}));
  return proxy as T;
}




export function getOpenApiMeta(target: object): OpenApiMeta {
  const methodMeta = getOpenApiProxy<OpenApiMeta>(target, SWAGGER_CONFIG_METADATA);
  return methodMeta;
}

export function getSchemaMeta(target: object): SchemaMeta {
  const methodMeta = getOpenApiProxy<SchemaMeta>(target, SWAGGER_SCHEMA_METADATA);
  return methodMeta;
}
