import { Module } from '@core';

import { MessagesController } from './messages.controller';

@Module({
  controllers: [MessagesController],
  namespace: 'messages',
})
export class MessagesModule { }
