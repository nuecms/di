import express, { Express } from 'express';

import { Server } from '../types';
import { AdapterRoute, HttpApplicationAdapter, ParameterType } from '../base';

export class ExpressAdapter implements HttpApplicationAdapter {
  type = 'express';
  private server: Server;

  constructor(public app: Express = express()) { }

  attachServer(server: Server) {
    this.server = server;
  }

  close() {
    if (this.server.listening) {
      this.server.close();
    }
  }

  getParam(type: ParameterType, name: string, req: express.Request, res: express.Response, next: express.NextFunction) {
    switch (type) {
      case ParameterType.BODY: return () => name ? req.body?.[name] : req.body;
      case ParameterType.COOKIE: return () => name ? req.cookies?.[name] : req.cookies;
      case ParameterType.HEADER: return () => name ? req.headers?.[name] : req.headers;
      case ParameterType.PARAM: return () => name ? req.params?.[name] : req.params;
      case ParameterType.QUERY: return () => name ? req.query?.[name] : req.query;
      case ParameterType.REQUEST: return () => req;
      case ParameterType.RESPONSE: return () => res;
      case ParameterType.NEXT: return () => next;
      default: return () => req;
    }
  }

  isHeadersSent(response: express.Response) {
    return response.headersSent;
  }

  listen() {
    this.server.on('request', this.app);
  }

  render(response: express.Response, template: string, message: object) {
    return new Promise<string>((resolve, reject) => response.render(template, message,
      (err, html) => err ? reject(err) : resolve(html),
    ));
  }

  reply(response: express.Response, message: unknown, statusCode?: number) {
    const isJson = typeof message === 'object';

    if (statusCode) {
      response.status(statusCode);
    }

    if (isJson) {
      this.setHeader(response, 'Content-Type', 'application/json');

      return response.json(message);
    }

    return response.send(message);
  }

  routes(routes: AdapterRoute[]) {
    for (const route of routes) {
      this.app[route.type]?.(route.url, route.handler);
    }
  }

  serveStatic(prefix: string, path: string, options?: unknown) {
    this.app.use(prefix, express.static(path, options));
  }

  set(setting: string, value: unknown) {
    this.app.set(setting, value);
  }

  setHeader(response: express.Response, name: string, value: string) {
    response.setHeader(name, value);
  }

  use(...args: any[]) {
    this.app.use(...args);
  }
}
