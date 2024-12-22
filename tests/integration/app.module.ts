import { APP_VERSION, GLOBAL_PIPE, Module } from '@core';
import { ExpressAdapter } from '@core';
import { HttpModule } from '@core/base';
import { SwaggerModule } from '@openapi';

import { EventsModule, MessagesModule, MiscModule } from './modules';
import { ServerPipe } from './pipes';

@Module({
  modules: [
    HttpModule.create(ExpressAdapter,
    ),
    SwaggerModule.forRoot({
      description: 'Decorators Example App',
      title: '@decorators/server',
    }),
    EventsModule,
    MessagesModule,
    MiscModule,
  ],
  providers: [
    {
      provide: APP_VERSION,
      useValue: 'v1',
    },
    {
      multi: true,
      provide: GLOBAL_PIPE,
      useClass: ServerPipe,
    },
  ],
})
export class AppModule { }
