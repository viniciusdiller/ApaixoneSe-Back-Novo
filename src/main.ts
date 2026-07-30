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

  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));

  // CORS: Usa a variável FRONTEND_URL para definir a origem permitida.
  // Em dev, FRONTEND_URL pode ser http://localhost:3000 (ou IP local).
  // Em produção, deve ser o domínio público do frontend (ex: https://apaixonese.saquarema.rj.gov.br).
  // credentials:true é incompatível com origin:"*", por isso usamos a lista explícita.
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (ex: Swagger, curl, server-side)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin '${origin}' not allowed by CORS`), false);
    },
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

  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

  app.useStaticAssets(join(__dirname, "..", "public"), {
    prefix: "/public/",
  });

  const config = new DocumentBuilder()
    .setTitle("Apaixone-Se API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const PORT = process.env.PORT || 6969;
  await app.listen(PORT);
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}/api`);
  console.log(`🔒 CORS permitido para: ${allowedOrigins.join(", ")}`);
}
bootstrap();
