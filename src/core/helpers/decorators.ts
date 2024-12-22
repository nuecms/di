import { ExpressMeta } from '@core/meta';
import { MethodMetadata, ParamMetadata } from '../types';
import { extractParamNames } from '../utils';
import { CONTROLLER_METADATA, METHOD_METADATA, PARAM_TYPE_METADATA, PARAMS_METADATA, RETURN_TYPE_METADATA } from './constants';
import { Context } from './context';
import { createMetadata } from './metadata-store';




// get metadata and create proxy
function getMetaAndCreateProxy(target: object, key: string | symbol, methodName?: string) {
  const initialData = () => ({ params: {}, methods: [] })
  const meta = createMetadata(target, key, initialData) as any
  if (methodName) {
    let methodMeta = meta.methods.find((m: any) => m.methodName === methodName);
    if (!methodMeta) {
      methodMeta = { methodName, params: [] };
      meta.methods.push(methodMeta);
    }
  }
  return meta;
}


export function getTargetMeta(target: object): ExpressMeta {
  const methodMeta = Reflect.getMetadata(METHOD_METADATA, target);
  const controllerMeta = Reflect.getMetadata(CONTROLLER_METADATA, target);
  const paramsMeta = Reflect.getMetadata(PARAMS_METADATA, target);
  return {
    ...controllerMeta,
    methods: methodMeta,
    params: paramsMeta,
  };
}



export function classDecoratorFactory(key: string, metadata: Partial<MethodMetadata> & { [key: string]: any; }): ClassDecorator {
  return function (target: object) {
    // make sure class metadata exists and can be updated automatically through Proxy
    const classMeta = getMetaAndCreateProxy(target, key);
    // update class metadata
    Object.assign(classMeta, metadata);
  };
}


export function middlewareDecoratorFactory(middleware: Function): MethodDecorator {
  return function (target: object, methodName: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    const methodMeta = getMetaAndCreateProxy(target.constructor, METHOD_METADATA, methodName as string);
    methodMeta.middleware = [middleware, ...methodMeta.middleware];
    return descriptor;
  };
}


export function methodDecoratorFactory(metadata: Partial<MethodMetadata>  & { [key: string]: any; }): MethodDecorator {
  return function (target: object, methodName: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    // make sure method metadata exists and can be updated automatically through Proxy
    const methodMeta = getMetaAndCreateProxy(target.constructor, METHOD_METADATA, methodName as string);

    const returnType = Reflect.getMetadata(RETURN_TYPE_METADATA, target, methodName);

    // update method metadata
    Object.assign(methodMeta, {
      returnType: returnType === Promise ? null : returnType,
      source: target.constructor.name,
      type: metadata.type || 'GET',
      url: metadata.url || '/',
      ...metadata,
    });

    return descriptor;
  };
}

export function paramDecoratorFactory(metadata: Partial<ParamMetadata> & { [key: string]: any; }) {
  return function (target: InstanceType<any>, methodName: string, index: number) {
    const params = getMetaAndCreateProxy(target[methodName], PARAMS_METADATA);

    // get parameter type and name
    const argType = Reflect.getMetadata(PARAM_TYPE_METADATA, target, methodName)[index];
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
