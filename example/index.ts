import express from 'express';
import { Injectable } from '@di';
import {
  attachControllers,
  Controller,
  ERROR_MIDDLEWARE,
  ErrorMiddleware,
  Get,
  Middleware,
  Request
} from '@core';
import { Container } from '@core/container';

const app: express.Express = express();

class NotFoundError extends Error {}
class InternalServerError extends Error {}

@Injectable()
class DataProvider {
  data() {
    return { hello: 'world' };
  }
}

@Injectable()
class RequestMiddleware implements Middleware {
  constructor(private dataProvider: DataProvider) {}

  use(
    _request: express.Request,
    _response: express.Response,
    next: express.NextFunction
  ) {
    // console.log('RequestMiddleware', this.dataProvider.data());

    next();
  }
}



@Controller('/', [RequestMiddleware])
class IndexController {
  @Get('/')
  index(@Request() request: express.Request) {
    console.log('IndexController', request)
    return 'Hello World';
  }

  @Get('/not-found-error')
  notFoundError() {
    throw new NotFoundError();
  }

  @Get('/internal-server-error')
  internalServerError() {
    throw new InternalServerError();
  }
}

@Controller('/api', [RequestMiddleware])
class ApiController {
  @Get('/')
  index() {
    return 'Hello World';
  }

  @Get('/not-found-error')
  notFoundError() {
    throw new NotFoundError();
  }

  @Get('/internal-server-error')
  internalServerError() {
    throw new InternalServerError();
  }
}

@Injectable()
class ServerErrorMiddleware implements ErrorMiddleware {
  constructor(private dataProvider: DataProvider) {}

  use(
    error: Error,
    _request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) {

    if (error instanceof NotFoundError) {
      return response.send('Not Found Error');
    }

    if (error instanceof InternalServerError) {
      return response.send('Internal Server Error');
    }

    next(error);
  }
}

export async function viteNodeApp() {
  Container.provide([
    { provide: DataProvider, useClass: DataProvider },
    { provide: ERROR_MIDDLEWARE, useClass: ServerErrorMiddleware },
  ]);

  await attachControllers(app, [ApiController, IndexController]);

  app.listen(3001, () => {
    console.info('Server is running on port 3001');
  });
}

viteNodeApp().catch(console.error);




