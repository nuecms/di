import { Type } from './types';
import { getMeta } from './meta';
import { PathConflictInfo } from './types';

export class ControllerValidator {
  /**
   * 验证控制器路径冲突
   */
  static validatePathConflicts(controllers: Type[]): PathConflictInfo[] {
    const pathMap = new Map<string, Array<{ name: string, hasMiddleware: boolean, middlewareCount: number }>>();
    const conflicts: PathConflictInfo[] = [];

    // 收集所有控制器的路径信息
    controllers.forEach(controller => {
      const meta = getMeta(controller);
      const hasMiddleware = meta.middleware && meta.middleware.length > 0;
      const middlewareCount = meta.middleware?.length || 0;

      const controllerInfo = {
        name: controller.name,
        hasMiddleware,
        middlewareCount
      };

      if (!pathMap.has(meta.url)) {
        pathMap.set(meta.url, []);
      }
      pathMap.get(meta.url)!.push(controllerInfo);
    });

    // 检测冲突
    pathMap.forEach((controllers, path) => {
      if (controllers.length > 1) {
        const hasAnyMiddleware = controllers.some(c => c.hasMiddleware);
        if (hasAnyMiddleware) {
          conflicts.push({
            path,
            controllers
          });
        }
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
