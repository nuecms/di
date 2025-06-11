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
import { classDecoratorFactory, CONTROLLER_METADATA, middlewareDecoratorFactory } from './helpers';

/**
 * Attach controllers to express application
 */
export async function attachControllers(
  app: Express | Router,
  controllers: Type[],
  mountPoint?: string // 添加挂载点参数
) {
  // 在开发环境下检测路径冲突
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 Detecting controller path conflicts...');
    controllers.forEach(controller => {
      const meta = getMeta(controller);
      const hasMiddleware = meta.middleware && meta.middleware.length > 0;
      const middlewareCount = meta.middleware?.length || 0;
      pathDetector.detectConflict(controller.name, meta.url, hasMiddleware, middlewareCount, mountPoint);
    });
  }

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

  // 开发环境下的详细日志
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📋 Registering controller: ${Controller.name}`, {
      path: meta.url || '(root path)',
      middlewareCount: meta.middleware?.length || 0,
      routeCount: Object.keys(meta.routes).length
    });
  }

  // 使用控制器指定的路由选项，或使用默认配置
  // 注意：RouterOptions 无法解决中间件污染问题
  const routerOptions = {
    ...meta.routerOptions
  };

  // 每个控制器都创建独立的 router 实例
  const controllerRouter = Router(routerOptions);

  /**
   * Wrap all registered middleware with helper function
   * that can instantiate or get from the container instance of the class
   * or execute given middleware function
   */
  const routerMiddleware: RequestHandler[] = (meta.middleware || []).map(
    (middleware) => middlewareHandler(middleware)
  );

  /**
   * Apply router middleware - 只应用到当前控制器的 router
   *
   * 重要提示：如果多个控制器使用相同的基础路径（如 /shop），
   * 这里的中间件会影响到后续注册的同路径控制器。
   *
   * 推荐解决方案：
   * 1. 为每个控制器使用唯一的基础路径
   * 2. 或在外部认证装饰器中使用路径特异性中间件
   */
  if (routerMiddleware.length) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🛡️  Applying ${routerMiddleware.length} middleware(s) to ${Controller.name} (${meta.url})`);
    }
    controllerRouter.use(...routerMiddleware);
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

      controllerRouter[route.method].apply(controllerRouter, [
        route.url,
        ...routeMiddleware,
        handler,
      ]);
    });
  }

  // 关键修复：确保路径匹配更精确
  if (meta.url === '') {
    app.use(controllerRouter);
  } else {
    app.use(meta.url, controllerRouter);
  }

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



export function attachClassMiddleware(middleware: Function) {
  return function (target: any) {
    // 直接使用 classDecoratorFactory，让它处理元数据的创建和合并
    return classDecoratorFactory(CONTROLLER_METADATA, {
      middleware: [middleware]
    })(target);
  }
}

// 添加路径冲突检测器
class PathConflictDetector {
  private registeredPaths = new Map<string, {
    controller: string,
    hasMiddleware: boolean,
    middlewareCount: number,
    mountPoint?: string
  }>();

  detectConflict(controllerName: string, path: string, hasMiddleware: boolean, middlewareCount: number = 0, mountPoint?: string) {
    // 创建完整路径标识 - 这是关键！
    const fullPathKey = this.buildFullPath(mountPoint, path);
    const existing = this.registeredPaths.get(fullPathKey);

    if (existing) {
      // 只有完全相同的完整路径才会冲突
      if (existing.hasMiddleware || hasMiddleware) {
        const totalMiddleware = existing.middlewareCount + middlewareCount;
        console.warn(`
🚨 REAL Path Conflict Detected:
   Identical full path "${fullPathKey}" used by multiple controllers:
   - ${existing.controller} (middleware: ${existing.middlewareCount})
   - ${controllerName} (middleware: ${middlewareCount})

   ⚠️  CRITICAL: Each request will execute ${totalMiddleware} middleware(s)!

   This is a REAL conflict because the final paths are identical.
   Different mount points like /api vs /api/admin would NOT conflict.

   Fix: Use unique controller paths or mount points.

   📖 See solutions: https://github.com/nuecms/di/blob/main/docs/middleware-pollution-solutions.md
        `);

        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Path conflict: "${fullPathKey}" has real middleware pollution risk`);
        }
      }
    } else {
      // 检查路径包含关系（通常是安全的）
      this.checkPathContainment(controllerName, fullPathKey, hasMiddleware, middlewareCount);
    }

    this.registeredPaths.set(fullPathKey, {
      controller: controllerName,
      hasMiddleware,
      middlewareCount,
      mountPoint
    });
  }

  private buildFullPath(mountPoint?: string, controllerPath?: string): string {
    if (!mountPoint) return controllerPath || '';
    if (!controllerPath || controllerPath === '') return mountPoint;

    // 确保路径正确拼接
    const cleanMountPoint = mountPoint.endsWith('/') ? mountPoint.slice(0, -1) : mountPoint;
    const cleanControllerPath = controllerPath.startsWith('/') ? controllerPath : '/' + controllerPath;

    return cleanMountPoint + cleanControllerPath;
  }

  private checkPathContainment(controllerName: string, newPath: string, hasMiddleware: boolean, middlewareCount: number) {
    const existingPaths = Array.from(this.registeredPaths.entries());

    for (const [existingPath, existingInfo] of existingPaths) {
      // 检查路径包含关系
      if (newPath.startsWith(existingPath + '/') || existingPath.startsWith(newPath + '/')) {
        console.info(`
ℹ️  Path Containment (Usually Safe):
   - Existing: "${existingPath}" (${existingInfo.controller})
   - New: "${newPath}" (${controllerName})

   This is typically SAFE. Express routes to the most specific path.
   Example: /order/extended/details goes to extended router, not base router.

   📖 More info: https://github.com/nuecms/di/blob/main/docs/middleware-pollution-solutions.md#path-containment
        `);
      }
    }
  }

  // 添加路径分析方法
  getPathAnalysis(): { safe: string[], conflicts: string[], containments: string[] } {
    const paths = Array.from(this.registeredPaths.keys());
    const analysis = { safe: [], conflicts: [], containments: [] };

    for (let i = 0; i < paths.length; i++) {
      for (let j = i + 1; j < paths.length; j++) {
        const path1 = paths[i];
        const path2 = paths[j];

        if (path1 === path2) {
          analysis.conflicts.push(`${path1} (identical paths)`);
        } else if (path1.startsWith(path2 + '/') || path2.startsWith(path1 + '/')) {
          analysis.containments.push(`${path1} ↔ ${path2} (containment relationship)`);
        } else {
          analysis.safe.push(`${path1} ↔ ${path2} (completely separate)`);
        }
      }
    }

    return analysis;
  }
}

const pathDetector = new PathConflictDetector();
