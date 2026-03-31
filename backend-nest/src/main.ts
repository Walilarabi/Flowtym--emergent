import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API prefix for all routes - will be accessed via /api/v2/*
  app.setGlobalPrefix('api/v2');

  const port = process.env.NEST_PORT || 8002;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 NestJS Housekeeping API running on port ${port}`);
}
bootstrap();
