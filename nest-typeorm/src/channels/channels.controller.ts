import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { LoggedInGuard } from '../auth/logged-in.guard';
import { User } from '../common/decorators/user.decorator';
//import { Users } from '../entities/Users';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ChannelsService } from './channels.service';
import { UserDto } from 'src/users/dto/user.dto';

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

@ApiTags('CHANNELS')
@ApiCookieAuth('connect.sid')
@UseGuards(LoggedInGuard)
@Controller('api/workspaces')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @ApiOperation({ summary: '워크스페이스 채널리스트 가져오기' })
  @Get(':url/channels/all')
  async getWorkspaceChannelsAll(@Param('url') url: string) {
    return this.channelsService.getWorkspaceChannelsAll(url);
  }

  @ApiOperation({ summary: '워크스페이스 채널 모두 가져오기' })
  @Get(':url/channels')
  async getWorkspaceChannels(@Param('url') url, @User() user: UserDto) {
    //console.log('getWorkspaceChannels url user ', url, user);
    return this.channelsService.getWorkspaceChannels(url, user.id);
  }

  @ApiOperation({ summary: '워크스페이스 특정 채널 가져오기' })
  @Get(':url/channels/:name')
  async getWorkspaceChannel(@Param('url') url, @Param('name') name) {
    return this.channelsService.getWorkspaceChannel(url, name);
  }

  @ApiOperation({ summary: '워크스페이스 채널 만들기' })
  @Post(':url/channels')
  async createWorkspaceChannels(
    @Param('url') url,
    @Body() body: CreateChannelDto,
    @User() user: UserDto,
  ) {
    return this.channelsService.createWorkspaceChannels(
      url,
      body.name,
      user.id,
    );
  }

  @ApiOperation({ summary: '워크스페이스 채널 멤버 가져오기' })
  @Get(':url/channels/:name/members')
  async getWorkspaceChannelMembers(
    @Param('url') url: string,
    @Param('name') name: string,
  ) {
    console.log('getWorkspaceChannelMembers url: ', url, ' name: ', name);
    return this.channelsService.getWorkspaceChannelMembers(url, name);
  }

  @ApiOperation({ summary: '워크스페이스 채널 멤버 초대하기' })
  @Post(':url/channels/:name/members')
  async createWorkspaceChannelMembers(
    @Param('url') url: string,
    @Param('name') name: string,
    @Body('email') email,
  ) {
    const result = await this.channelsService.createWorkspaceChannelMembers(
      url,
      name,
      email,
    );
    if (result) {
      return 'ok';
    } else {
      throw new ForbiddenException();
    }
  }

  @ApiOperation({ summary: '워크스페이스 특정 채널 채팅 모두 가져오기' })
  @Get(':url/channels/:name/chats')
  async getWorkspaceChannelChats(
    @Param('url') url,
    @Param('name') name,
    @Query('perPage', ParseIntPipe) perPage: number,
    @Query('page', ParseIntPipe) page: number,
  ) {
    return this.channelsService.getWorkspaceChannelChats(
      url,
      name,
      perPage,
      page,
    );
  }

  @ApiOperation({ summary: '워크스페이스 특정 채널 채팅 생성하기' })
  @Post(':url/channels/:name/chats')
  async createWorkspaceChannelChats(
    @Param('url') url,
    @Param('name') name,
    @Body('content') content,
    @User() user: UserDto,
  ) {
    return this.channelsService.createWorkspaceChannelChats(
      url,
      name,
      content,
      user.id,
    );
  }

  @ApiOperation({ summary: '워크스페이스 특정 채널 이미지 업로드하기' })
  @UseInterceptors(
    FilesInterceptor('image', 10, {
      storage: multer.diskStorage({
        destination(req, file, cb) {
          cb(null, 'uploads/');
        },
        filename(req, file, cb) {
          const ext = path.extname(file.originalname);
          cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @Post(':url/channels/:name/images')
  async createWorkspaceChannelImages(
    //// postImages 34강
    @Param('url') url,
    @Param('name') name,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: UserDto,
  ) {
    return this.channelsService.createWorkspaceChannelImages(
      url,
      name,
      files,
      user.id,
    );
  }

  @ApiOperation({ summary: '안 읽은 개수 가져오기' })
  @Get(':url/channels/:name/unreads')
  async getUnreads(
    @Param('url') url,
    @Param('name') name,
    @Query('after', ParseIntPipe) after: number,
  ) {
    //console.log('async getUnreads(url, name, after) ', url, name, after);
    return this.channelsService.getChannelUnreadsCount(url, name, after);
  }
}
