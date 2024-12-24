import { Injectable } from '../../di';

import { classDecoratorFactory, CONTROLLER_METADATA } from '../helpers';
import { ClassConstructor, ControllerOptions } from '../types';
import { RouterOptions } from 'express';
import { Middleware } from '../middleware';


export function Controller(
  url: string,
  middleware?: Middleware[]
): ClassDecorator;
export function Controller(
  url: string,
  routerOptions?: RouterOptions,
  middleware?: Middleware[]
): ClassDecorator;
export function Controller(
    url: string,
    options?: Middleware[] | RouterOptions | ControllerOptions,
    middleware: Middleware[] = []) {
  return (target: ClassConstructor) => {
    const meta = {} as any
    meta.url = url;
    meta.middleware = Array.isArray(options) ? options : middleware;
    meta.options = Array.isArray(options) ? null : options;
    classDecoratorFactory(CONTROLLER_METADATA, meta)(target);

    Injectable()(target);
  };
}
