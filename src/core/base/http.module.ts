import { Inject } from '../../di';

import { APP_SERVER, ClassConstructor, Module, ModuleWithProviders, type Server } from '..';
import { HTTP_ADAPTER, HttpApplicationAdapter, RouteHandler, RouteResolver } from './helpers';

@Module({
  providers: [
    RouteHandler,
    RouteResolver,
  ],
})
export class HttpModule {
  static create(
    adapter: ClassConstructor<HttpApplicationAdapter> | InstanceType<ClassConstructor<HttpApplicationAdapter>>,
  ) {
    return {
      module: HttpModule,
      providers: [{
        provide: HTTP_ADAPTER,
        ...(adapter instanceof HttpApplicationAdapter ? { useValue: adapter } : { useClass: adapter }),
      }],
    } as ModuleWithProviders;
  }

  constructor(
    @Inject(APP_SERVER) private server: Server,
    @Inject(HTTP_ADAPTER) private adapter: HttpApplicationAdapter,
    private routeResolver: RouteResolver,
  ) {
    this.adapter.attachServer(this.server);
  }

  close() {
    return this.adapter.close();
  }

  getAdapter<Adapter extends HttpApplicationAdapter>() {
    return this.adapter as Adapter;
  }

  getHttpServer() {
    return this.server;
  }

  async listen(port?: number) {
    await this.routeResolver.resolve();

    await this.adapter.listen();

    if (this.server.listening) {
      return;
    }

    return this.server.listen(port);
  }

  set(setting: string, value: unknown) {
    this.adapter.set?.(setting, value);
  }

  use(...args: unknown[]) {
    this.adapter.use(...args);
  }
}
