import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { configureApp } from './app/configure-app';

// Local development reads .env from the workspace root; variables already set (CI, production) win.
const workspaceEnvFile = resolve(process.cwd(), '.env');
if (existsSync(workspaceEnvFile)) {
  process.loadEnvFile(workspaceEnvFile);
}

async function bootstrap(): Promise<void> {
  const isProduction = process.env['NODE_ENV'] === 'production';
  // JSON logs in production (BE-16); readable logs locally.
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: isProduction, colors: !isProduction }),
  });
  const config = configureApp(app);

  await app.listen(config.port);
  Logger.log(`API is running on http://localhost:${config.port}`, 'Bootstrap');
}

void bootstrap();
