import { Controller, UnauthorizedError } from '@core';
import { Body, Get, Post, Render } from '@core/base';
import { ApiResponse } from '@openapi';
import { IsString } from 'class-validator';

export class Creds {
  @IsString()
  login: string;

  @IsString()
  password: string;
}

class Token {
  @IsString()
  token: string;
}

@Controller('', { ignoreVersion: true })
export class MiscController {
  @Post('login')
  @ApiResponse('Authenticates user')
  auth(@Body() creds: Creds): Token {
    if (creds.login === 'user' && creds.password === 'password') {
      return { token: 'very-secure-token' };
    }

    throw new UnauthorizedError('unauthorized');
  }

  @Get()
  @Render('app.html')
  index() { }

  @Get('*', 404)
  status404() {
    return 'not-found';
  }
}
