# Middleware Pollution Solutions

## Problem Description

When multiple controllers use the same base path, the middleware from the first controller affects the route handling of subsequent controllers.

## Test Verification Results

Through actual testing verification:
- ❌ `RouterOptions` (strict, caseSensitive, mergeParams) **cannot solve** middleware pollution
- ✅ **Independent path mounting** is an effective solution
- ✅ **Path-specific middleware** is an effective solution

## Recommended Solutions

### Solution 1: Independent Path Design (Recommended)

```typescript
// ❌ Problematic design
@Controller('/shop')     // ShopCartController
@Controller('/shop')     // ShopCategoryController

// ✅ Recommended design
@Controller('/shop/cart')     // ShopCartController
@Controller('/shop/category') // ShopCategoryController
@Controller('/shop/goods')    // ShopGoodController
```

### Solution 2: Path-Specific Middleware

Implement path filtering in external authentication decorators:

```typescript
// Modify Auth decorator implementation
export function JwtAuth(options: JwtAuthOptions & { paths?: string[] } = {}) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey === undefined && descriptor === undefined) {
      // Class decorator - use path-specific middleware
      const middleware = (req, res, next) => {
        // Only apply authentication to specific paths
        if (options.paths && !options.paths.some(path => req.path.startsWith(path))) {
          return next();
        }
        // Execute authentication logic
        // ...
      };

      return attachClassMiddleware(middleware)(target);
    }
    // Method decorator logic...
  }
}

// Usage
@Controller('/shop')
@JwtAuth({ paths: ['/cart', '/checkout'] })  // Only apply auth to cart and checkout paths
export class ShopController {}
```

### Solution 3: Conditional Middleware

```typescript
// Path judgment within middleware
class ConditionalAuthMiddleware {
  constructor(private allowedPaths: string[]) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Check if current path requires authentication
    if (!this.allowedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Execute authentication logic
    // ...
  }
}
```

## Not Recommended Approaches

### ❌ Modifying RouterOptions
```typescript
// These options cannot solve middleware pollution issues
const routerOptions = {
  strict: true,
  caseSensitive: true,
  mergeParams: false
};
```

### ❌ Relying on Registration Order
```typescript
// Don't rely on controller registration order to solve problems
// This makes code fragile and hard to maintain
```

## Best Practices

1. **Prioritize independent path design** - Simplest and most reliable
2. **Avoid same base paths** - Prevent issues from occurring
3. **Use path-specific middleware** - When paths must be shared
4. **Test and verify** - Ensure middleware only affects intended routes

## Architecture Recommendations

```typescript
// Recommended controller path structure
@Controller('/api/auth')          // Authentication related
@Controller('/api/users')         // User management
@Controller('/api/shop/cart')     // Shopping cart
@Controller('/api/shop/products') // Products
@Controller('/api/shop/orders')   // Orders
```

This design ensures each controller has a unique base path, avoiding middleware pollution issues.

## Developer Tools and Warnings

### Automatic Detection Mechanism

The framework provides automatic path conflict detection:

```typescript
// Automatically runs in development environment
npm run dev  // Will show path conflict warnings

// Manual validation
import { ControllerValidator } from '@core/validation';

const conflicts = ControllerValidator.validatePathConflicts(controllers);
ControllerValidator.printConflictReport(conflicts);
```

### Environment Variable Control

```bash
# .env file
NODE_ENV=development          # Enable detailed logs and warnings
STRICT_PATH_VALIDATION=true   # Enable strict path validation
THROW_ON_CONFLICTS=true       # Throw exceptions on path conflicts
```

### VS Code Extension Recommendations

To better avoid path conflicts, recommended VS Code settings:

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false,
  "editor.rulers": [80, 120],
  "files.associations": {
    "*.controller.ts": "typescript"
  }
}
```

### Code Snippets

```json
// .vscode/snippets/controller.json
{
  "Controller with unique path": {
    "prefix": "ctrl",
    "body": [
      "@Controller('/${1:module}/${2:resource}')",
      "export class ${3:${TM_FILENAME_BASE/(.*)Controller/${1:/capitalize}/}} {",
      "  $0",
      "}"
    ],
    "description": "Create controller with unique path"
  }
}
```
