import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { EventoApplication } from "./evento.Application";
import { EventoRepository } from "../../data/repositories/evento.repository";
import { Evento } from "../../data/entities/evento.Entity";
import { IUsuarioLogado } from "../../data/interfaces/iUsuarioLogado.Interface";

describe("EventoApplication", () => {
  let application: EventoApplication;
  let repository: jest.Mocked<EventoRepository>;

  const admin: IUsuarioLogado = { id: "admin-1", perfil: "ADMIN" };
  const usuarioComum: IUsuarioLogado = { id: "user-1", perfil: "USUARIO" };

  const eventoExistente = new Evento(
    {
      titulo: "Saquarema Surf Festival",
      descricao: "Maior campeonato de surf da região.",
      data: new Date("2026-04-01T20:00:00Z"),
      local: "Praia de Itaúna",
    },
    "evento-1",
    new Date("2026-01-01T00:00:00Z"),
    new Date("2026-01-01T00:00:00Z"),
  );

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<EventoRepository>;

    application = new EventoApplication(repository);
  });

  describe("create", () => {
    it("lança ForbiddenException quando o usuário não é ADMIN", async () => {
      await expect(
        application.create(
          {
            titulo: "Festa",
            descricao: "Descrição",
            data: "2026-04-01T20:00:00Z",
            local: "Praça",
          } as any,
          usuarioComum,
          "foto.webp",
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("cria um evento de dia único quando dataFim não é informada", async () => {
      repository.save.mockResolvedValue(eventoExistente);

      const resultado = await application.create(
        {
          titulo: "Saquarema Surf Festival",
          descricao: "Maior campeonato de surf da região.",
          data: "2026-04-01T20:00:00Z",
          local: "Praia de Itaúna",
        } as any,
        admin,
        "foto.webp",
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ dataFim: undefined }),
      );
      expect(resultado.dataFim).toBeNull();
    });

    it("cria um evento em período quando dataFim é informada", async () => {
      const dataFim = new Date("2026-04-03T23:00:00Z");
      const eventoComPeriodo = new Evento(
        {
          titulo: eventoExistente.titulo,
          descricao: eventoExistente.descricao,
          data: eventoExistente.data,
          dataFim,
          local: eventoExistente.local,
        },
        "evento-2",
      );
      repository.save.mockResolvedValue(eventoComPeriodo);

      const resultado = await application.create(
        {
          titulo: eventoExistente.titulo,
          descricao: eventoExistente.descricao,
          data: "2026-04-01T20:00:00Z",
          dataFim: "2026-04-03T23:00:00Z",
          local: eventoExistente.local,
        } as any,
        admin,
        "foto.webp",
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ dataFim }),
      );
      expect(resultado.dataFim).toEqual(dataFim);
    });

    it("lança BadRequestException quando dataFim é anterior à data de início", async () => {
      await expect(
        application.create(
          {
            titulo: eventoExistente.titulo,
            descricao: eventoExistente.descricao,
            data: "2026-04-01T20:00:00Z",
            dataFim: "2026-03-30T00:00:00Z",
            local: eventoExistente.local,
          } as any,
          admin,
          "foto.webp",
        ),
      ).rejects.toThrow(BadRequestException);

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("lança ForbiddenException quando o usuário não é ADMIN", async () => {
      await expect(
        application.update("evento-1", {} as any, usuarioComum),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it("permite adicionar dataFim a um evento que só tinha data de início", async () => {
      repository.findById.mockResolvedValue(eventoExistente);
      repository.update.mockResolvedValue(
        new Evento(
          {
            ...eventoExistente,
            dataFim: new Date("2026-04-03T23:00:00Z"),
          },
          eventoExistente.id,
        ),
      );

      await application.update(
        "evento-1",
        { dataFim: "2026-04-03T23:00:00Z" } as any,
        admin,
      );

      expect(repository.update).toHaveBeenCalledWith(
        "evento-1",
        expect.objectContaining({ dataFim: new Date("2026-04-03T23:00:00Z") }),
      );
    });

    it("valida dataFim informada isoladamente contra a data de início já existente", async () => {
      repository.findById.mockResolvedValue(eventoExistente);

      await expect(
        application.update(
          "evento-1",
          { dataFim: "2026-03-30T00:00:00Z" } as any,
          admin,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it("valida nova data de início contra a dataFim já existente", async () => {
      const eventoComPeriodo = new Evento(
        {
          ...eventoExistente,
          dataFim: new Date("2026-04-03T23:00:00Z"),
        },
        eventoExistente.id,
      );
      repository.findById.mockResolvedValue(eventoComPeriodo);

      await expect(
        application.update(
          "evento-1",
          { data: "2026-05-01T00:00:00Z" } as any,
          admin,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it("lança NotFoundException quando o evento não existe", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        application.update("evento-inexistente", {} as any, admin),
      ).rejects.toThrow("Evento não encontrado para atualização.");
    });
  });
});
