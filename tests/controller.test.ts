import { describe, it, expect, beforeEach } from 'vitest';
import { getOpenApiMeta, attachMiddleware, Controller, Get, Post, Params } from '../src';
import { getTargetMeta } from '../src/core/helpers/decorators';
import { NextFunction, Request, Response } from 'express';

describe('Controller Tests', () => {
  // Reset logic before each test if needed
  beforeEach(() => {
    // Add any setup logic here if required for your test cases.
  });

  // Define a custom middleware decorator to simulate an access control check
  function Access(key: string) {
    return attachMiddleware((req: Request, res: Response, next: NextFunction) => {
      if (["CAN_ACCESS_TEST", "CAN_ACCESS_HOME"].includes(key)) {
        // Allow access for valid keys
        next();
      } else {
        // Deny access for invalid keys
        res.send("ACCESS DENIED");
      }
    });
  }

  // Define a test controller class with middleware, routes, and parameters
  @Controller('test') // Define a base route prefix for the controller
  class TestController {
    @Access("CAN_ACCESS_TEST") // Attach access control middleware
    @Get('get-data') // Define an HTTP GET route
    getData() {}

    @Access("CAN_ACCESS_HOME") // Attach access control middleware
    @Post('post-data') // Define an HTTP POST route
    postData(@Params('name') name: string): string {
      return name; // Example method returning the parameter for validation
    }
  }

  it('should correctly extract metadata from a controller', () => {
    // Extract metadata from the TestController class
    const metadata = getTargetMeta(TestController);

    // Verify the extracted controller metadata
    expect(metadata.controller).toEqual({
      options: undefined, // Verify that no additional options were provided
      url: 'test', // Verify the base route URL
    });

    // Verify the extracted method metadata
    expect(metadata.methods).toEqual([
      {
        methodName: 'getData', // Name of the method
        returnType: undefined, // Expected return type is undefined for this method
        source: 'http', // Source type indicating HTTP endpoint
        status: undefined, // No specific status code is defined
        type: 'get', // HTTP method type
        url: 'get-data', // URL endpoint for this method
      },
      {
        methodName: 'postData', // Name of the method
        returnType: expect.any(Function), // Verify the return type is a function (String constructor)
        source: 'http', // Source type indicating HTTP endpoint
        status: undefined, // No specific status code is defined
        type: 'post', // HTTP method type
        url: 'post-data', // URL endpoint for this method
      },
    ]);

    // Verify the extracted parameter metadata
    expect(metadata.params).toEqual([
      {
        argName: 'name', // The name of the parameter in the route
        argType: String, // Expected argument type (String constructor)
        index: 0, // Position of the parameter in the method's arguments
        methodName: 'postData', // The method where this parameter is used
        paramName: 'name', // Parameter name in the route
        paramType: 'path', // Indicates the parameter comes from the URL path
        paramValidator: undefined, // No validators defined for this parameter
        callIndex: 0, // Position in the execution order
      },
    ]);
    // Verify the extracted middleware metadata
    expect(metadata.middleware).toEqual({
      getData: [expect.any(Function)], // Middleware for getData is a function
      postData: [expect.any(Function)], // Middleware for postData is a function
    });
  });

});

