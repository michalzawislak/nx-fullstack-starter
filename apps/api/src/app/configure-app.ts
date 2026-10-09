import { type INestApplication, VersioningType } from '@nestjs/common';
import { type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import {
  ApiExceptionFilter,
  APP_CONFIG,
  type AppConfig,
  buildOpenApiDocument,
  REQUEST_ID_HEADER,
} from '@starter/api/common';

import { APP_HEADERS } from '@starter/shared/contracts';

/** HTTP setup shared by main.ts and the integration tests, so tests run the real configuration. */
export function configureApp(app: INestApplication): AppConfig {
  const config = app.get<AppConfig>(APP_CONFIG);

  // Swagger UI needs inline scripts, so the CSP is enforced only where /docs is not served (BE-15, BE-17).
  app.use(
    helmet({ contentSecurityPolicy: config.isProduction ? undefined : false }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: [...config.corsOrigins],
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      APP_HEADERS.version,
      APP_HEADERS.platform,
      REQUEST_ID_HEADER,
    ],
    exposedHeaders: [REQUEST_ID_HEADER],
  });
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  if (!config.isProduction) {
    // The document is built from libs/shared/contracts, not from decorators.
    const document = buildOpenApiDocument({
      title: 'Starter API',
      version: '1',
    });
    SwaggerModule.setup('docs', app, document as unknown as OpenAPIObject);
  }

  return config;
}
