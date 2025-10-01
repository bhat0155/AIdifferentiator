import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new session when user gives a prompt
  async create(prompt: string, userId?: string) {
    return this.prisma.comparisonSession.create({
      data: {
        prompt,
        userId: userId ?? null,
      },
    });
  }

  // fetch a session along with its results
  // used in /api/sessions/:id
  async findWithResults(id: string) {
    const session = await this.prisma.comparisonSession.findUnique({
      where: { id },
      include: { results: true }, // also pull related ModelResult rows
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  // this will be extracted when streaming has been completed
  async saveModelResult(input: {
    sessionId: string;
    provider: 'openai' | 'google';
    modelName: string;
    responseText: string;
    tokenCount: number;
    costUSD: number;
    responseTimeMs: number;
  }) {
    // ensure parent session exists
    const exists = await this.prisma.comparisonSession.findUnique({
      where: { id: input.sessionId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Session not found');

    return this.prisma.modelResult.create({ data: input });
  }
}
