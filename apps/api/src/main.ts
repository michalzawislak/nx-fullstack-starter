import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const port = Number(process.env['PORT'] ?? DEFAULT_PORT);
  await app.listen(port);

  Logger.log(`API is running on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
