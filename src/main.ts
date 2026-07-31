import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { json, urlencoded } from "express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Define o prefixo global para as rotas da API
  app.setGlobalPrefix("api");

  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));

  app.enableCors({
    origin: (origin, callback) => callback(null, origin ?? true),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,Accept",
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Aqui estão as suas alterações para os arquivos estáticos!
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/api/uploads/",
  });

  app.useStaticAssets(join(process.cwd(), "public"), {
    prefix: "/api/public/",
  });

  const config = new DocumentBuilder()
    .setTitle("Apaixone-Se API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document); // Sugestão: mudar aqui para "api-docs" ou "docs" para não conflitar com a rota "/api"

  const PORT = process.env.PORT || 3305;
  await app.listen(PORT);
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
}
bootstrap();
