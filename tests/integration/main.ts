import { Application } from '@core';
import { HttpModule } from '@core/base';
import { json } from 'body-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await Application.create(AppModule);
  const module = await app.inject<HttpModule>(HttpModule);

  // const expressApp = module.getAdapter<ExpressAdapter>().app;

  // expressApp.engine('html', renderFile);
  // module.set('view engine', 'html');
  // module.set('views', join(__dirname, 'views'));
  module.use(json());

  await module.listen(3000);

  console.info('Server is running on port 3000');
}

bootstrap().catch(console.error);
