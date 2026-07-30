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

  // CORS: credentials:true é incompatível com origin:"*".
  // Usar uma função que reflete a origem da requisição permite
  // qualquer cliente (dev + produção) sem bloquear o preflight OPTIONS.
  app.enableCors({
    origin: (origin, callback) => callback(null, origin ?? true),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,Accept",
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Fix: Private Network Access (PNA) — Chrome 98+
  // Quando o frontend (HTTPS público) tenta acessar o backend em IP privado
  // (172.16.x.x, 10.x.x.x, 192.168.x.x), o browser envia um preflight OPTIONS
  // com o header "Access-Control-Request-Private-Network: true".
  // O servidor DEVE responder com "Access-Control-Allow-Private-Network: true"
  // para que o browser permita a requisição. Sem este header, o erro é:
  // "Permission was denied for this request to access the `local` address space."
  app.use((req: any, res: any, next: any) => {
    if (
      req.method === "OPTIONS" &&
      req.headers["access-control-request-private-network"]
    ) {
      res.setHeader("Access-Control-Allow-Private-Network", "true");
    }
    next();
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
}
bootstrap();
