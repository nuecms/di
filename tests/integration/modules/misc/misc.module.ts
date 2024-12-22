import { Module } from '@core';

import { MiscController } from './misc.controller';

@Module({
  controllers: [MiscController],
})
export class MiscModule { }
