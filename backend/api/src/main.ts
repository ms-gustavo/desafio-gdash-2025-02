import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Weather API')
    .setDescription('API para gerenciamento de dados meteorológicos e usuários')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header'
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(envConfig.port, '0.0.0.0');
}
bootstrap();
