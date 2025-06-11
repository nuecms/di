# Metadata Reflection Guide for OpenAPI Documentation

This guide explains how to use `Reflect.getMetadata()` to extract metadata from Controllers for generating OpenAPI documentation.

## Overview

The framework stores metadata on Controller classes and methods using TypeScript's reflect-metadata library. This metadata includes routing information, parameter configurations, and OpenAPI-specific documentation attributes.

## Metadata Keys and Constants

### Core Metadata Keys (from constants.ts)
```typescript
// Controller and routing metadata
export const CONTROLLER_METADATA = '__server__:controller';
export const MODULE_METADATA = '__server__:module';
export const PIPES_METADATA = '__server__:pipes';
export const METHOD_METADATA = '__server__:method';
export const MIDDLEWARE_METADATA = '__server__:middleware';
export const PARAMS_METADATA = '__server__:peram';

// Parameter type constants
export const PARAM_TYPE_METADATA = 'design:paramtypes';
export const RETURN_TYPE_METADATA = 'design:returntype';

// Express metadata
export const ROUTE_METADATA = '__express_meta__';
```

### OpenAPI Metadata Key
```typescript
// OpenAPI metadata is stored with the key 'openapi'
const OPENAPI_METADATA = 'openapi';
```

## Controller Class Metadata

### Basic Controller Information
```typescript
// Get controller metadata
const controllerMeta = Reflect.getMetadata(CONTROLLER_METADATA, ControllerClass);
// Returns: { url: string, middleware?: Middleware[], routerOptions?: any }

// Example usage:
const { url: basePath, middleware: controllerMiddleware } = controllerMeta;
```

### Route Methods Metadata
```typescript
// Get route metadata from prototype
const routeMeta = Reflect.getMetadata(ROUTE_METADATA, ControllerClass.prototype);
// Contains all routing information for the controller
```

### Method Metadata
```typescript
// Get method-specific metadata
const methodMeta = Reflect.getMetadata(METHOD_METADATA, ControllerClass.prototype);
// Returns method-specific configurations
```

### Parameter Metadata
```typescript
// Get parameter configuration for methods
const paramsMeta = Reflect.getMetadata(PARAMS_METADATA, ControllerClass.prototype);
// Returns: { [methodName: string]: ParameterConfiguration[] }

// ParameterConfiguration structure:
{
  "paramName": "id",
  "index": 0,
  "paramType": ParameterType.PARAM
}
```

### Middleware Metadata
```typescript
// Get middleware configuration
const middlewareMeta = Reflect.getMetadata(MIDDLEWARE_METADATA, ControllerClass.prototype);
// Returns middleware configurations for methods
```

## OpenAPI-Specific Metadata

### Method-Level OpenAPI Metadata
```typescript
// Get OpenAPI metadata for all methods
const openApiMeta = Reflect.getMetadata('openapi', ControllerClass.prototype);
// Returns: { [methodName: string]: OpenAPIMethodMetadata }

// OpenAPIMethodMetadata structure:
interface OpenAPIMethodMetadata {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean | string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: { [statusCode: string]: ResponseObject };
  security?: SecurityRequirementObject[];
}
```

### Individual OpenAPI Decorators
Each OpenAPI decorator stores specific metadata:

#### @Summary and @Description
```typescript
const methodMeta = openApiMeta[methodName];
const summary = methodMeta.summary; // string
const description = methodMeta.description; // string
```

#### @Tags
```typescript
const tags = methodMeta.tags; // string[]
```

#### @Param
```typescript
const parameters = methodMeta.parameters; // ParameterObject[]
// Each parameter object contains:
{
  name: string,
  in: 'query' | 'header' | 'path' | 'cookie',
  required?: boolean,
  deprecated?: boolean,
  allowEmptyValue?: boolean,
  schema: SchemaObject,
  // or
  content: { [mediaType: string]: { schema: SchemaObject } }
}
```

#### @BodyContent
```typescript
const requestBody = methodMeta.requestBody;
// Structure:
{
  content: {
    [mediaType: string]: {
      schema: SchemaObject
    }
  },
  required?: boolean,
  description?: string
}
```

#### @Responses and @OpenApiResponse
```typescript
const responses = methodMeta.responses;
// Structure:
{
  [statusCode: string]: {
    description: string,
    content: {
      [mediaType: string]: {
        schema: SchemaObject
      }
    }
  }
}
```

#### @Security
```typescript
const security = methodMeta.security; // SecurityRequirementObject[]
// Structure: Array of objects like { [schemeName: string]: string[] }
```

## Complete Extraction Example

```typescript
import {
  CONTROLLER_METADATA,
  ROUTE_METADATA,
  PARAMS_METADATA,
  METHOD_METADATA,
  MIDDLEWARE_METADATA
} from './constants';

function extractOpenApiFromController(ControllerClass: Type): OpenAPIControllerDoc {
  // Get controller metadata using actual constants
  const controllerMeta = Reflect.getMetadata(CONTROLLER_METADATA, ControllerClass);
  const routeMeta = Reflect.getMetadata(ROUTE_METADATA, ControllerClass.prototype);
  const paramsMeta = Reflect.getMetadata(PARAMS_METADATA, ControllerClass.prototype);
  const methodMeta = Reflect.getMetadata(METHOD_METADATA, ControllerClass.prototype);
  const middlewareMeta = Reflect.getMetadata(MIDDLEWARE_METADATA, ControllerClass.prototype);
  const openApiMeta = Reflect.getMetadata('openapi', ControllerClass.prototype) || {};

  const paths: { [path: string]: PathItemObject } = {};

  // Process the metadata to extract OpenAPI information
  // Implementation depends on the actual structure stored by getMeta function

  return {
    basePath: controllerMeta?.url || '',
    paths,
    controllerName: ControllerClass.name
  };
}
```

## Class-Level Tags (@CTags)

The `@CTags` decorator applies tags to all methods in a controller:

```typescript
// This decorator modifies the openapi metadata for all methods
@CTags(['user', 'authentication'])
export class UserController {
  // All methods will have tags: ['user', 'authentication']
}
```

## Parameter Type Mapping

Map framework parameter types to OpenAPI parameter locations:

```typescript
import { ParameterType } from './meta';

function mapParameterType(paramType: ParameterType): string {
  switch (paramType) {
    case ParameterType.PARAM: return 'path';
    case ParameterType.QUERY: return 'query';
    case ParameterType.HEADER: return 'header';
    case ParameterType.COOKIE: return 'cookie';
    case ParameterType.BODY: return 'body'; // Special case - goes to requestBody
    default: return 'query';
  }
}
```

## Best Practices

1. **Always check for metadata existence**: Use `|| {}` to provide defaults
2. **Combine multiple metadata sources**: Controller, method, and OpenAPI metadata all contribute
3. **Handle missing responses**: Always provide default responses for OpenAPI compliance
4. **Merge parameter sources**: Combine decorator parameters with method parameters
5. **Process inheritance**: Check parent classes for inherited metadata

## Common Patterns

### Getting All Controllers with Metadata
```typescript
import { CONTROLLER_METADATA } from './constants';

function getAllControllersWithMetadata(controllers: Type[]): ControllerMetadata[] {
  return controllers
    .filter(controller => Reflect.getMetadata(CONTROLLER_METADATA, controller))
    .map(controller => ({
      class: controller,
      metadata: extractOpenApiFromController(controller)
    }));
}
```

### Merging Method and Decorator Parameters
```typescript
function mergeParameters(
  methodParams: ParameterConfiguration[],
  decoratorParams: ParameterObject[]
): ParameterObject[] {
  // Combine both sources, with decorator parameters taking precedence
  const merged = [...(decoratorParams || [])];

  methodParams?.forEach(param => {
    if (!merged.find(p => p.name === param.paramName)) {
      merged.push({
        name: param.paramName,
        in: mapParameterType(param.paramType),
        required: param.paramType === ParameterType.PARAM,
        schema: { type: 'string' } // Default schema
      });
    }
  });

  return merged;
}
```

This guide provides the foundation for extracting all necessary metadata to generate comprehensive OpenAPI documentation from your Controllers.
