import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS so React frontend on port 5173 can call this API and load static assets
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      setHeaders: (res: express.Response) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    })
  );

  // 2. Set global API route prefix
  app.setGlobalPrefix('api/v1');

  // 2. Enable automatic data validation across all endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip out any properties not in the DTO
      forbidNonWhitelisted: true, // Throw an error if extra properties are sent
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // 3. Configure Swagger Interactive API Documentation
  const config = new DocumentBuilder()
    .setTitle('Instant QR Storefront API')
    .setDescription('Multi-restaurant in-store QR ordering platform API')
    .setVersion('1.0')
    .addTag('auth', 'Restaurant owner authentication & profile')
    .addTag('restaurants', 'Restaurant management & public storefront endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 4. Start listening on port 3000
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger Docs available at: http://localhost:${port}/api/docs`);
}

void bootstrap();
