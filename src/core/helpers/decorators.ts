import { MethodMetadata, ParamMetadata } from '../types';
import { extractParamNames } from '../utils';
import { CONTROLLER_METADATA, METHOD_METADATA, MIDDLEWARE_METADATA, PARAM_TYPE_METADATA, PARAMS_METADATA, RETURN_TYPE_METADATA } from './constants';
import { Context } from './context';
import { createMetadata } from './metadata-store';




// get metadata and create proxy
function getMetaAndCreateProxy(target: object, key: string | symbol, initdata: object = {}): any {
  const meta = createMetadata(target, key, ()=>(initdata)) as any
  return meta;
}


export function getTargetMeta(target: { new (...args: any[]): any }): any {
  const methodMeta = Reflect.getMetadata(METHOD_METADATA, target);
  const controllerMeta = Reflect.getMetadata(CONTROLLER_METADATA, target);
  const middlewareMeta = Reflect.getMetadata(MIDDLEWARE_METADATA, target);
  const paramsMeta = []
  for (const methodName of Object.getOwnPropertyNames(target.prototype)) {
    const params = Reflect.getMetadata(PARAMS_METADATA, target.prototype[methodName]);
    if (params) {
      paramsMeta.push(...params);
    }
  }
  return {
    controller: controllerMeta,
    methods: methodMeta,
    params: paramsMeta,
    middleware: middlewareMeta,
  };
}



export function classDecoratorFactory(key: string, metadata: Partial<MethodMetadata> & { [key: string]: any; }): ClassDecorator {
  return function (target: object) {
    // make sure class metadata exists and can be updated automatically through Proxy
    const classMeta = getMetaAndCreateProxy(target, key);
    classMeta.options = metadata.options;
    classMeta.url = metadata.url;
  };
}


export function middlewareDecoratorFactory(middleware: Function): MethodDecorator {
  return function (target: object, methodName: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    const methodMeta = getMetaAndCreateProxy(target.constructor, MIDDLEWARE_METADATA, {});
    methodMeta[methodName] = methodMeta[methodName] || [];
    methodMeta[methodName].push(middleware);
    return descriptor;
  };
}


export function methodDecoratorFactory(metadata: Partial<MethodMetadata>  & { [key: string]: any; }): MethodDecorator {
  return function (target: object, methodName: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    // make sure method metadata exists and can be updated automatically through Proxy
    const methods = getMetaAndCreateProxy(target.constructor, METHOD_METADATA, []);

    const returnType = Reflect.getMetadata(RETURN_TYPE_METADATA, target, methodName);

    methods.push({
      methodName,
      returnType: returnType === Promise ? null : returnType,
      ...metadata,
    })

    return descriptor;
  };
}

export function paramDecoratorFactory(metadata: Partial<ParamMetadata> & { [key: string]: any; }) {
  return function (target: InstanceType<any>, methodName: string, index: number) {
    const params = getMetaAndCreateProxy(target[methodName], PARAMS_METADATA, []);
    // get parameter type and name
    const argType = Reflect.getMetadata(PARAM_TYPE_METADATA, target, methodName)[index]
    const argName = extractParamNames(target[methodName])[index];

    // create parameter metadata
    const paramMetadata = {
      argName,
      argType,
      index,
      methodName,
      ...metadata,
    };
    // update parameter metadata
    params[index] = paramMetadata;
    params
    .filter((param: ParamMetadata) => param.paramType === metadata.paramType)
    .forEach((param: ParamMetadata, index: number) => {
      param.callIndex = index;
    });
  };
}

// paramDecoratorFactory alias decoratorFactory
export const decoratorFactory = paramDecoratorFactory;



/**
 * Creates a custom parameter decorator
 *
 * Example:
 *
 * ...
 * export function AccessParam() {
 *   return createParamDecorator((context: HttpContext) => {
 *     const req = context.getRequest<Request>();
 *
 *     return req.query.access;
 *  });
 * }
 *
 * ...
 * authorize(@AccessParam() access: string)
 * ...
 */
export function createParamDecorator(factory: (context: Context) => Promise<any> | any) {
  return paramDecoratorFactory({ factory: (context: Context) => () => factory(context) });
}

/**
 * Creates a custom method or class decorator
 *
 * Example:
 *
 * ...
 * export function Access(access: string) {
 *   return Decorate('access', access);
 * }
 * ...
 *
 * @Access('granted')
 * create()
 * ...
 *
 * Also can be used without a wrapper:
 *
 * ...
 * @Decorate('access', granted)
 * create()
 * ...
 */
export function Decorate(key: string, value: unknown) {
  return (target: object, propertyKey?: any, descriptor?: any) => {
    const metaTarget = descriptor?.value ?? target;

    Reflect.defineMetadata(key, value, metaTarget, descriptor ? undefined : propertyKey);

    if (descriptor) {
      return descriptor;
    }
  };
}
