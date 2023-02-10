import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber } from 'class-validator';

export class UserDto {
  @IsNumber()
  @ApiProperty({
    example: 12,
    description: '아이디',
  })
  public id: number;
  @IsEmail()
  @ApiProperty({
    example: 'zerohch0@gmail.com',
    description: '이메일',
  })
  public email: string;
}
