import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/data/providers/db/prisma.Service";
import { JwtService, JwtModule } from "@nestjs/jwt";

describe("Eventos - Apenas Admin (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let tokenComum: string;
  let tokenParceiro: string;
  let tokenAdmin: string;
  let eventoCriadoId: string;

  // Buffer de imagem PNG 1x1 válida para o sharp conseguir processar
  const bufferImagem = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        JwtModule.register({ secret: process.env.JWT_SECRET || "secreta" }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    await prisma.user.deleteMany({
      where: { email: { in: ["user@event.com", "parceiro@event.com", "admin@event.com"] } },
    });

    const userComum = await prisma.user.create({
      data: {
        nome: "User Event",
        email: "user@event.com",
        senha: "123",
        usuario: "userevent",
        perfil: "USUARIO",
      },
    });
    const userParceiro = await prisma.user.create({
      data: {
        nome: "Parceiro Event",
        email: "parceiro@event.com",
        senha: "123",
        usuario: "parceiroevent",
        perfil: "PARCEIRO",
      },
    });
    const userAdmin = await prisma.user.create({
      data: {
        nome: "Admin Event",
        email: "admin@event.com",
        senha: "123",
        usuario: "adminevent",
        perfil: "ADMIN",
      },
    });

    tokenComum = jwtService.sign({ sub: userComum.id, perfil: userComum.perfil });
    tokenParceiro = jwtService.sign({ sub: userParceiro.id, perfil: userParceiro.perfil });
    tokenAdmin = jwtService.sign({ sub: userAdmin.id, perfil: userAdmin.perfil });
  });

  it("1. GET /eventos - Listar publicamente (200)", () => {
    return request(app.getHttpServer()).get("/eventos").expect(200);
  });

  it("2. POST /eventos - Utilizador Comum TENTA criar evento (403)", () => {
    return request(app.getHttpServer())
      .post("/eventos")
      .set("Authorization", `Bearer ${tokenComum}`)
      .field("titulo", "Festa Fake")
      .field("descricao", "Teste")
      .field("data", new Date().toISOString())
      .field("local", "Praça")
      .attach("foto", bufferImagem, "foto.png")
      .expect(403);
  });

  it("3. POST /eventos - PARCEIRO TENTA criar evento (403)", () => {
    return request(app.getHttpServer())
      .post("/eventos")
      .set("Authorization", `Bearer ${tokenParceiro}`)
      .field("titulo", "Evento do Parceiro")
      .field("descricao", "Tentativa indevida")
      .field("data", new Date().toISOString())
      .field("local", "Praça")
      .attach("foto", bufferImagem, "foto.png")
      .expect(403);
  });

  it("4. POST /eventos - Admin cria evento com sucesso (201)", async () => {
    const resposta = await request(app.getHttpServer())
      .post("/eventos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .field("titulo", "Saquarema Surf Festival")
      .field("descricao", "Maior campeonato!")
      .field("data", new Date().toISOString())
      .field("local", "Praia de Itaúna")
      .attach("foto", bufferImagem, "foto.png")
      .expect(201);

    eventoCriadoId = resposta.body.id;
    expect(resposta.body.dataFim).toBeNull();
  });

  it("5. POST /eventos - Admin cria evento em período (dataFim opcional) (201)", async () => {
    const dataInicio = new Date();
    const dataFim = new Date(dataInicio.getTime() + 2 * 24 * 60 * 60 * 1000);

    const resposta = await request(app.getHttpServer())
      .post("/eventos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .field("titulo", "Saquarema Country Fest")
      .field("descricao", "Três dias de shows.")
      .field("data", dataInicio.toISOString())
      .field("dataFim", dataFim.toISOString())
      .field("local", "Parque de Exposições")
      .attach("foto", bufferImagem, "foto.png")
      .expect(201);

    expect(new Date(resposta.body.dataFim)).toEqual(dataFim);

    await request(app.getHttpServer())
      .delete(`/eventos/${resposta.body.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(204);
  });

  it("6. POST /eventos - dataFim anterior à data de início é rejeitada (400)", () => {
    const dataInicio = new Date();
    const dataFim = new Date(dataInicio.getTime() - 24 * 60 * 60 * 1000);

    return request(app.getHttpServer())
      .post("/eventos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .field("titulo", "Evento com período inválido")
      .field("descricao", "Não deve ser criado.")
      .field("data", dataInicio.toISOString())
      .field("dataFim", dataFim.toISOString())
      .field("local", "Praça")
      .attach("foto", bufferImagem, "foto.png")
      .expect(400);
  });

  it("7. DELETE /eventos/:id - Utilizador Comum TENTA apagar (403)", () => {
    return request(app.getHttpServer())
      .delete(`/eventos/${eventoCriadoId}`)
      .set("Authorization", `Bearer ${tokenComum}`)
      .expect(403);
  });

  it("8. DELETE /eventos/:id - PARCEIRO TENTA apagar (403)", () => {
    return request(app.getHttpServer())
      .delete(`/eventos/${eventoCriadoId}`)
      .set("Authorization", `Bearer ${tokenParceiro}`)
      .expect(403);
  });

  it("9. DELETE /eventos/:id - Admin apaga o evento (204)", () => {
    return request(app.getHttpServer())
      .delete(`/eventos/${eventoCriadoId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(204);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["user@event.com", "parceiro@event.com", "admin@event.com"] } },
    });
    await app.close();
  });
});
