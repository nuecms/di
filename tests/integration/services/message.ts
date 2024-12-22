import { ApiParameter } from '@core/swagger';
import { IsString } from 'class-validator';

export class Message {
  @IsString()
  @ApiParameter({ description: 'Message text' })
  message: string;
}
