import { Controller, Pipe } from '@core';
import { Get } from '@core/base';

import { AccessPipe } from '../../pipes';
import { MessagesService } from '../../services';

@Controller()
@Pipe(AccessPipe)
export class MessagesController {
  constructor(private messagesService: MessagesService) { }

  @Get()
  messages() {
    return this.messagesService.getMessages();
  }
}
