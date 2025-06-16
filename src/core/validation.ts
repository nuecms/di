import { Type } from './types';
import { getMeta } from './meta';
import { PathConflictInfo } from './types';

/**
 * 路径冲突检测器
 */
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

  private checkPathContainment(controllerName: string, newPath: string, _hasMiddleware: boolean, _middlewareCount: number) {
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

  /**
   * 重置检测器状态 - 用于测试
   */
  reset(): void {
    this.registeredPaths.clear();
  }

  /**
   * 获取已注册路径数量
   */
  getRegisteredPathsCount(): number {
    return this.registeredPaths.size;
  }
}

export class ControllerValidator {
  /**
   * 实时路径冲突检测器 - 合并了 PathConflictDetector 功能
   */
  private static pathDetector = new PathConflictDetector();

  /**
   * 获取路径冲突检测器实例
   */
  static getPathDetector(): PathConflictDetector {
    return this.pathDetector;
  }

  /**
   * 筛选有中间件的控制器 - 优化工具方法
   */
  static filterControllersWithMiddleware(controllers: Type[]): Type[] {
    return controllers.filter(controller => {
      const meta = getMeta(controller);
      return meta.middleware && meta.middleware.length > 0;
    });
  }

  /**
   * 获取控制器中间件统计信息
   */
  static getMiddlewareStats(controllers: Type[]): {
    total: number,
    withMiddleware: number,
    withoutMiddleware: number,
    totalMiddlewareCount: number
  } {
    let totalMiddlewareCount = 0;
    const withMiddleware = controllers.filter(controller => {
      const meta = getMeta(controller);
      const hasMiddleware = meta.middleware && meta.middleware.length > 0;
      if (hasMiddleware) {
        totalMiddlewareCount += meta.middleware.length;
      }
      return hasMiddleware;
    });

    return {
      total: controllers.length,
      withMiddleware: withMiddleware.length,
      withoutMiddleware: controllers.length - withMiddleware.length,
      totalMiddlewareCount
    };
  }
  /**
   * 验证控制器路径冲突 - 优化版本：只处理有中间件的控制器
   */
  static validatePathConflicts(controllers: Type[]): PathConflictInfo[] {
    const pathMap = new Map<string, Array<{ name: string, hasMiddleware: boolean, middlewareCount: number }>>();
    const conflicts: PathConflictInfo[] = [];

    // 优化：首先筛选出有中间件的控制器
    const controllersWithMiddleware = controllers.filter(controller => {
      const meta = getMeta(controller);
      return meta.middleware && meta.middleware.length > 0;
    });

    console.log(`🔍 Processing ${controllersWithMiddleware.length} controllers with middleware (skipped ${controllers.length - controllersWithMiddleware.length} without middleware)`);

    // 收集有中间件的控制器路径信息
    controllersWithMiddleware.forEach(controller => {
      const meta = getMeta(controller);
      const middlewareCount = meta.middleware.length; // 已知有中间件，直接获取长度

      const controllerInfo = {
        name: controller.name,
        hasMiddleware: true, // 已筛选，必定为true
        middlewareCount
      };

      if (!pathMap.has(meta.url)) {
        pathMap.set(meta.url, []);
      }
      pathMap.get(meta.url)!.push(controllerInfo);
    });

    // 检测冲突 - 只有当同一路径有多个控制器时才会冲突
    pathMap.forEach((controllers, path) => {
      if (controllers.length > 1) {
        // 由于我们只处理有中间件的控制器，所以这里必定有冲突
        conflicts.push({
          path,
          controllers
        });
      }
    });

    return conflicts;
  }

  /**
   * 生成路径建议
   */
  static generatePathSuggestions(controllerName: string, currentPath: string): string[] {
    const cleanName = controllerName.toLowerCase().replace('controller', '');
    const suggestions = [];

    if (currentPath === '' || currentPath === '/') {
      suggestions.push(`/${cleanName}`);
    } else {
      suggestions.push(`${currentPath}/${cleanName}`);
      suggestions.push(`/${cleanName}`);
    }

    return suggestions;
  }

  /**
   * Print conflict report
   */
  static printConflictReport(conflicts: PathConflictInfo[]): void {
    if (conflicts.length === 0) {
      console.log('✅ No path conflicts detected');
      return;
    }

    console.log('\n🚨 Path conflicts detected:');
    console.log('========================');

    conflicts.forEach(conflict => {
      console.log(`\nPath: "${conflict.path || '(root path)'}"`);
      console.log('Conflicting controllers:');

      let totalMiddlewareCount = 0;
      conflict.controllers.forEach(controller => {
        console.log(`  - ${controller.name} (middleware: ${controller.middlewareCount})`);
        totalMiddlewareCount += controller.middlewareCount;
      });

      // 警告中间件执行次数
      if (totalMiddlewareCount > 0) {
        console.log(`\n⚠️  IMPORTANT: Each request to this path will execute ${totalMiddlewareCount} middleware(s):`);
        conflict.controllers.forEach(controller => {
          if (controller.middlewareCount > 0) {
            console.log(`     - ${controller.name}: ${controller.middlewareCount} middleware(s) will run`);
          }
        });
        console.log(`   Total middleware executions per request: ${totalMiddlewareCount}`);
      }

      console.log('\nRecommended solutions:');
      conflict.controllers.forEach(controller => {
        const suggestions = this.generatePathSuggestions(controller.name, conflict.path);
        console.log(`  ${controller.name}:`);
        suggestions.forEach(suggestion => {
          console.log(`    @Controller('${suggestion}')`);
        });
      });
      console.log('---');
    });

    console.log('\n💡 More solutions: https://github.com/nuecms/di/blob/main/docs/middleware-pollution-solutions.md\n');
  }
}
