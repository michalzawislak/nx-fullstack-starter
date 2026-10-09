import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';

import { AuthModule } from '@starter/api/auth';
import {
  AppVersionModule,
  ConfigModule,
  RequestLoggingMiddleware,
} from '@starter/api/common';
import { DatabaseModule } from '@starter/api/database';
import { UsersModule } from '@starter/api/users';

import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AppVersionModule,
    UsersModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*path');
  }
}
