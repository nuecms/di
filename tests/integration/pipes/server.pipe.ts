import { ApiError, InternalServerError, PipeHandle, ProcessPipe } from '@core';
import { HttpContext } from '@core/base';

export class ServerPipe implements ProcessPipe {
  async run(_context: HttpContext, handle: PipeHandle<string>) {
    try {
      return await handle();
    } catch (e) {
      return e instanceof ApiError ? e : new InternalServerError(e.message, e.stack.split('\n'));
    }
  }
}
