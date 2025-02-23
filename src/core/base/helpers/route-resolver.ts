import { Inject, Injectable } from '@di';

import { asyncMap, ClassConstructor, ContainerManager, isEnum, MetadataScanner, ProcessPipe, Reflector } from '../..';
import { RouteMetadata } from '../types';
import { HTTP_ADAPTER, HttpMethodType, METHOD_TEMPLATE_METADATA } from './constants';
import { HttpApplicationAdapter } from './http-application-adapter';
import { RouteHandler } from './route-handler';

@Injectable()
export class RouteResolver {
  constructor(
    @Inject(HTTP_ADAPTER) private adapter: HttpApplicationAdapter,
    private containerManager: ContainerManager,
    private metadataScanner: MetadataScanner,
    private routeHandler: RouteHandler,
    private reflector: Reflector,
  ) { }

  async resolve() {
    const metadatas = this.metadataScanner.scan<RouteMetadata>()
      .filter(meta => isEnum(HttpMethodType, meta.type));

    const baseRoutes = metadatas.filter(meta => !meta.url.includes('*'));
    const wildcardRoutes = metadatas
      .filter(meta => meta.url.includes('*'))
      .sort(this.sortWildcardRoutes);

    const routes = [];

    for (const metadata of [...baseRoutes, ...wildcardRoutes]) {
      const container = this.containerManager.get(metadata.module);
      const controller = await container.get<InstanceType<ClassConstructor>>(metadata.controller);
      const routePipes = await asyncMap(metadata.pipes, (pipe: ClassConstructor) =>
        container.get<ProcessPipe>(pipe),
      );

      const template = this.reflector.getMetadata(
        METHOD_TEMPLATE_METADATA,
        metadata.controller.prototype[metadata.methodName],
      );

      const handler = this.routeHandler.createHandler(
        controller,
        metadata.methodName,
        metadata.params,
        routePipes,
        metadata.status,
        template,
      );

      routes.push({
        handler,
        type: metadata.type,
        url: metadata.url,
      });
    }

    this.adapter.routes(routes);
  }

  sortWildcardRoutes(routeA: RouteMetadata, routeB: RouteMetadata) {
    const segmentsA = routeA.url.split('/').length;
    const segmentsB = routeB.url.split('/').length;

    if (segmentsA === segmentsB) {
      return routeB.url.length - routeA.url.length;
    }

    return segmentsB - segmentsA;
  }
}
