import { Injectable } from '@di';
import { PipeHandle, ProcessPipe, UnauthorizedError } from '@core';
import { HttpContext } from '@core/base';
import { Request } from 'express';

@Injectable()
export class AccessPipe implements ProcessPipe {
  run(context: HttpContext | SocketsContext, handle: PipeHandle<string>) {
    let token: string;

    const req = context.getRequest<Request>();

    token = req.headers.authorization?.split(' ')?.[1];

    if (token === 'very-secure-token') {
      return handle();
    }

    throw new UnauthorizedError('unauthorized');
  }
}
