import { RouterOptions } from 'express';

import { Middleware } from './middleware';

import { CONTROLLER_METADATA, METHOD_METADATA, MIDDLEWARE_METADATA, PARAMS_METADATA } from './helpers';
import { Type } from './types';

/**
 * All possible parameter decorator types
 *
 * @export
 * @enum {number}
 */
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

/**
 * Cached(meta) parameter configuration
 *
 * @export
 * @interface ParameterConfiguration
 */
export interface ParameterConfiguration {
  index: number;
  paramType: ParameterType;
  paramName?: string;
  data?: any;
}

/**
 * Cached(meta) route configuration
 *
 * @export
 * @interface Route
 */
export interface Route {
  method: string;
  url: string;
  middleware: Middleware[];
}

/**
 * Method metadata object
 */
export interface MethodMeta {
  routes: Route[];
  status?: number;
}

/**
 * Express decorators controller metadata
 *
 * @export
 * @interface ExpressMeta
 */
export interface ExpressMeta {
  url: string;

  routerOptions?: RouterOptions;

  routes: {
    [instanceMethodName: string]: MethodMeta;
  };

  middleware: Middleware[];

  params: {
    [key: string]: ParameterConfiguration[];
  };
}

/**
 * Express decorators controller
 *
 * @export
 * @interface ExpressMeta
 */
export interface ExpressClass {
  __express_meta__?: ExpressMeta;
}

/**
 * Get or initiate metadata on a target
 *
 * @returns {ExpressMeta}
 */
export function getMeta(target: Type): ExpressMeta {
  let meta = {} as ExpressMeta;
  const controllerMeta = Reflect.getMetadata(CONTROLLER_METADATA, target);
  meta.url = controllerMeta.url;
  meta.routerOptions = {};
  meta.routes = {};
  const middlewareMeta = Reflect.getMetadata(MIDDLEWARE_METADATA, target) || {};
  const methodMeta = Reflect.getMetadata(METHOD_METADATA, target);
  if (methodMeta) {
    for (const method of methodMeta) {
      // if use tsx method.methodName is not a string
      // convert it to string
      if (typeof method.methodName !== 'string') {
        method.methodName = method.methodName.name;
      }
      meta.routes[method.methodName] = meta.routes[method.methodName] || { routes: [] };
      meta.routes[method.methodName].routes.push({
        method: method.type,
        url: method.url,
        middleware: middlewareMeta[method.methodName] || [],
      });
    }
  }

  meta.middleware = controllerMeta.middleware || [];
  meta.params = {};
  for (const methodName of Object.getOwnPropertyNames(target.prototype)) {
    const params = Reflect.getMetadata(PARAMS_METADATA, target.prototype[methodName]);
    if (params) {
      meta.params[methodName] = meta.params[methodName] || [];
      meta.params[methodName].push(...params);
    }
  }
  return meta as ExpressMeta;
}
