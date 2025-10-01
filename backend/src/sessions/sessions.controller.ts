import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { GetSessionParamDto } from './dto/get-session.dto';

@Controller('/api/sessions')
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  // called when user submits prompt
  @Post()
  async create(@Body() dto: CreateSessionDto) {
    const session = await this.sessions.create(dto.prompt, dto.userId);
    return {
      sessionId: session.id,
      prompt: session.prompt,
      createdAt: session.createdAt,
    };
  }

  // get session with model results
  @Get(':id')
  async getById(@Param() params: GetSessionParamDto) {
    const session = await this.sessions.findWithResults(params.id);
    return session;
  }
}
