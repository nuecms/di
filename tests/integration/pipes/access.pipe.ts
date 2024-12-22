import { Injectable, PipeHandle, ProcessPipe, UnauthorizedError } from '@core';
import { HttpContext } from '@core/base';
import { SocketsContext } from '@core/sockets';
import { Request } from 'express';
import { Socket } from 'socket.io';

@Injectable()
export class AccessPipe implements ProcessPipe {
  run(context: HttpContext | SocketsContext, handle: PipeHandle<string>) {
    let token: string;

    if (context instanceof HttpContext) {
      const req = context.getRequest<Request>();

      token = req.headers.authorization?.split(' ')?.[1];
    } else {
      const socket = context.getSocket<Socket>();

      token = socket.handshake.headers.authorization.split(' ')[1];
    }

    if (token === 'very-secure-token') {
      return handle();
    }

    throw new UnauthorizedError('unauthorized');
  }
}
