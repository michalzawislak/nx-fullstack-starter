import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** Registered once in the API app; domain modules inject PrismaService (BE-10). */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
