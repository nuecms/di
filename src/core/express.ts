import {
  RequestHandler,
  Application,
  Router,
  Express,
  Request,
  Response,
  NextFunction,
} from 'express';

import { Type } from './types';
import { Container } from './container';
import {
  getMeta,
  ParameterType,
  ExpressClass,
  ParameterConfiguration,
} from './meta';
import {
  middlewareHandler,
  errorMiddlewareHandler,
  MiddlewareFunction,
} from './middleware';
import { middlewareDecoratorFactory } from './helpers';

/**
 * Attach controllers to express application
 */
export async function attachControllers(
  app: Express | Router,
  controllers: Type[]
) {
  const promises = controllers.map((controller: Type) =>
    registerController(app, controller, getController)
  );

  await Promise.all(promises);

  // error middleware must be registered as the very last one
  app.use(errorMiddlewareHandler());
}

/**
 * Attach controller instances to express application
 */
export async function attachControllerInstances(
  app: Express | Router,
  controllers: InstanceType<Type>[]
) {
  const promises = controllers.map((controller: InstanceType<Type>[]) =>
    registerController(app, controller, (c: InstanceType<Type>) => c)
  );

  await Promise.all(promises);

  // error middleware must be registered as the very last one
  app.use(errorMiddlewareHandler());
}

/**
 * Register controller via registering new Router
 */
async function registerController(
  app: Application | Router,
  Controller: Type | InstanceType<Type>,
  extractController: (
    c: Type | InstanceType<Type>
  ) => Promise<InstanceType<Type>> | InstanceType<Type>
) {
  const controller = await extractController(Controller);
  const meta = getMeta(Controller as Type);
  const router = Router(meta.routerOptions);

  /**
   * Wrap all registered middleware with helper function
   * that can instantiate or get from the container instance of the class
   * or execute given middleware function
   */
  const routerMiddleware: RequestHandler[] = (meta.middleware || []).map(
    (middleware) => middlewareHandler(middleware)
  );

  /**
   * Apply router middleware
   */
  if (routerMiddleware.length) {
    router.use(...routerMiddleware);
  }

  /**
   * Applying registered routes
   */
  for (const [methodName, methodMeta] of Object.entries(meta.routes)) {
    methodMeta.routes.forEach((route) => {
      const routeMiddleware: RequestHandler[] = (route.middleware || []).map(
        (middleware) => middlewareHandler(middleware)
      );
      const handler = routeHandler(
        controller,
        methodName,
        meta.params[methodName],
        methodMeta.status
      );

      router[route.method].apply(router, [
        route.url,
        ...routeMiddleware,
        handler,
      ]);
    });
  }

  (app as Router).use(meta.url, router);

  return app;
}

/**
 * Returns function that will call original route handler and wrap return options
 */
function routeHandler(
  controller: ExpressClass,
  methodName: string,
  params: ParameterConfiguration[],
  status: number
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const args = extractParameters(req, res, next, params);
    const result = controller[methodName].call(controller, ...args);

    if (result instanceof Promise) {
      result
        .then((r: any) => {
          if (!res.headersSent && typeof r !== 'undefined') {
            if (status) {
              res.status(status);
            }
            res.send(r);
          }
        })
        .catch(next);
    } else if (typeof result !== 'undefined') {
      if (!res.headersSent) {
        if (status) {
          res.status(status);
        }
        res.send(result);
      }
    }

    return result;
  };
}

/**
 * Extract parameters for handlers
 */
function extractParameters(
  req: Request,
  res: Response,
  next: NextFunction,
  params: ParameterConfiguration[] = []
): any[] {
  const args = [];

  for (const { paramName, index, paramType } of params) {
    switch (paramType) {
      case ParameterType.RESPONSE:
        args[index] = res;
        break;
      case ParameterType.REQUEST:
        args[index] = getParam(req, null, paramName);
        break;
      case ParameterType.NEXT:
        args[index] = next;
        break;
      case ParameterType.PARAM:
        args[index] = getParam(req, 'params', paramName);
        break;
      case ParameterType.QUERY:
        args[index] = getParam(req, 'query', paramName);
        break;
      case ParameterType.BODY:
        args[index] = getParam(req, 'body', paramName);
        break;
      case ParameterType.HEADER:
        args[index] = getParam(req, 'headers', paramName);
        break;
      case ParameterType.COOKIE:
        args[index] = getParam(req, 'cookies', paramName);
        break;
    }
  }

  return args;
}

/**
 * Get controller instance from container or instantiate one
 */
async function getController(Controller: Type): Promise<any> {
  try {
    if (!Container.has(Controller)) {
      Container.provide([
        {
          provide: Controller,
          useClass: Controller,
        },
      ]);
    }

    return await Container.get(Controller);
  } catch {
    return new Controller();
  }
}

/**
 * Get parameter value from the source object
 */
function getParam(source: any, paramType: string, name: string): any {
  const param = source[paramType] || source;

  return name ? param[name] : param;
}

/**
 * Attach middleware to controller metadata
 *
 * @param {boolean} unshift if set to false all the custom decorator middlewares will be exectuted after the middlewares attached through controller
 *
 * Note- Please use custom decorators before express method decorators Get Post etc.
 *
 *  @usecase
 *  ```typescript
    import { attachMiddleware } from "@decorators/express";
    import {Request,Response,NextFunction} from '@decorators/express/node_modules/express';

    export function Access(key: string) {
        return attachMiddleware((req : Request,res : Response,next : NextFunction)=>{
            if(["CAN_ACCESS_TEST","CAN_ACCESS_HOME"].includes(key)){
              next();
            }else{
              res.send("ACCESS DENIED");
            }
        });
      }
    ```
    Controller Code

      ```typescript
      @Controller("/")
      export class MainController {

          @Access("CAN_ACCESS_TEST")
          @Get("/test")
          getB() {
              return "You can access the test";
          }

          @Access("CAN_ACCESS_HOME")
          @Get("/home")
          getB() {
              return "You can access the home";
          }
      }

    ```
 */
export function attachMiddleware(
  middleware: MiddlewareFunction
) {
   return middlewareDecoratorFactory(middleware);
}
