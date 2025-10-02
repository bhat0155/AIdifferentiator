import { PrismaClient } from '@prisma/client';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health') getHealth() {
    return { ok: true };
  }

  // TEMP: shows which DB + host the app is truly connected to
  @Get('debug/db')
  async dbInfo() {
    const prisma = new PrismaClient();
    const [row] = await prisma.$queryRawUnsafe<any[]>(
      `select current_database() as db,
              inet_server_addr()::text as host,
              current_schema() as schema;`,
    );
    return row; // e.g., { db:'aidifferentaitor', host:'10.178.0.9', schema:'public' }
  }
}
