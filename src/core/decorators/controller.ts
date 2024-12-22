import { Injectable } from '../../di';

import { classDecoratorFactory, CONTROLLER_METADATA } from '../helpers';
import { ClassConstructor, ControllerOptions } from '../types';


/**
 * Registers controller for base url
 */
// export function Controller(
//   url: string,
//   middleware?: Middleware[]
// ): ClassDecorator;
// export function Controller(
//   url: string,
//   routerOptions?: RouterOptions,
//   middleware?: Middleware[]
// ): ClassDecorator;
// export function Controller(
//   url: string,
//   middlewareOrRouterOptions?: Middleware[] | RouterOptions,
//   middleware: Middleware[] = []
// ) {
//   return (target: Type) => {
//     const meta: ExpressMeta = getMeta(target.prototype as ExpressClass);

//     meta.url = url;
//     meta.middleware = Array.isArray(middlewareOrRouterOptions)
//       ? middlewareOrRouterOptions
//       : middleware;
//     meta.routerOptions = Array.isArray(middlewareOrRouterOptions)
//       ? null
//       : middlewareOrRouterOptions;

//     Injectable()(target);
//   };
// }

export function Controller(url = '', options?: ControllerOptions) {
  return (target: ClassConstructor) => {
    classDecoratorFactory(CONTROLLER_METADATA, { options, url })(target);
    Injectable()(target);
  };
}
