import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { EventoRepository } from "../../data/repositories/evento.repository";
import { Evento } from "../../data/entities/evento.Entity";
import { CreateEventoRequestDto } from "../../presentation/dto/request/eventos/createEventoRequestDto";
import { EventoResponseDto } from "../../presentation/dto/response/eventoResponse.dto";
import { UpdateEventoRequestDto } from "../../presentation/dto/request/eventos/updateEventoRequestDto";
import { Mes } from "@prisma/client";
import { IUsuarioLogado } from "../../data/interfaces/iUsuarioLogado.Interface";

const MAX_DESTAQUES = 4;

@Injectable()
export class EventoApplication {
  constructor(private readonly eventoRepository: EventoRepository) {}

  private getMesEnum(data: Date): Mes {
    const meses: Mes[] = [
      Mes.JANEIRO,
      Mes.FEVEREIRO,
      Mes.MARCO,
      Mes.ABRIL,
      Mes.MAIO,
      Mes.JUNHO,
      Mes.JULHO,
      Mes.AGOSTO,
      Mes.SETEMBRO,
      Mes.OUTUBRO,
      Mes.NOVEMBRO,
      Mes.DEZEMBRO,
    ];
    return meses[data.getMonth()] as Mes;
  }

  // A entidade é agnóstica de framework e lança Error puro nas suas
  // regras de negócio; aqui na borda nós as convertemos para uma
  // resposta HTTP 400 em vez de deixar cair no 500 padrão do Nest.
  private construirEventoValidado(
    props: Omit<Evento, "id" | "createdAt" | "updatedAt">,
    id?: string,
  ): Evento {
    try {
      return new Evento(props, id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Dados do evento inválidos.",
      );
    }
  }

  async create(
    dto: CreateEventoRequestDto,
    usuarioLogado: IUsuarioLogado,
    fotoUrl: string,
  ): Promise<EventoResponseDto> {
    if (usuarioLogado.perfil !== "ADMIN")
      throw new ForbiddenException(
        "Apenas administradores podem criar eventos.",
      );

    if (dto.destaque) {
      const atuais = await this.eventoRepository.findDestaques();
      if (atuais.length >= MAX_DESTAQUES) {
        throw new ConflictException(
          `O limite de ${MAX_DESTAQUES} eventos em destaque já foi atingido. Remova um antes de adicionar outro.`,
        );
      }
    }

    const dataConvertida = new Date(dto.data);
    const dataFimConvertida = dto.dataFim ? new Date(dto.dataFim) : undefined;
    const novoEvento = this.construirEventoValidado({
      titulo: dto.titulo,
      descricao: dto.descricao,
      data: dataConvertida,
      dataFim: dataFimConvertida,
      local: dto.local,
      endereco: dto.endereco,
      fotoUrl,
      destaque: dto.destaque,
    });

    const eventoSalvo = await this.eventoRepository.save(novoEvento);
    return this.mapToResponseDto(eventoSalvo);
  }

  async findAll(): Promise<EventoResponseDto[]> {
    const eventos = await this.eventoRepository.findAll();
    return Promise.all(eventos.map((e) => this.mapToResponseDto(e)));
  }

  // Dado público, sem checagem de ADMIN — alimenta o carrossel da home.
  async findDestaques(): Promise<EventoResponseDto[]> {
    const eventos = await this.eventoRepository.findDestaques();
    return Promise.all(eventos.map((e) => this.mapToResponseDto(e)));
  }

  async findById(id: string): Promise<EventoResponseDto> {
    const evento = await this.eventoRepository.findById(id);
    if (!evento) throw new NotFoundException("Evento não encontrado.");
    return this.mapToResponseDto(evento);
  }

  async update(
    id: string,
    dto: UpdateEventoRequestDto,
    usuarioLogado: IUsuarioLogado,
    fotoUrl?: string,
  ): Promise<EventoResponseDto> {
    if (usuarioLogado.perfil !== "ADMIN")
      throw new ForbiddenException(
        "Apenas administradores podem alterar eventos.",
      );

    const evento = await this.eventoRepository.findById(id);
    if (!evento)
      throw new NotFoundException("Evento não encontrado para atualização.");

    const dataAtualizada = dto.data ? new Date(dto.data) : evento.data;
    const dataFimAtualizada = dto.dataFim
      ? new Date(dto.dataFim)
      : evento.dataFim;
    const destaqueFinal = dto.destaque ?? evento.destaque;

    // só checa o limite ao ligar destaque num evento que ainda não era
    // destaque — senão re-salvar um evento já-destaque falsamente
    // acusaria limite atingido contra ele mesmo.
    if (destaqueFinal && !evento.destaque) {
      const atuais = await this.eventoRepository.findDestaques();
      if (atuais.length >= MAX_DESTAQUES) {
        throw new ConflictException(
          `O limite de ${MAX_DESTAQUES} eventos em destaque já foi atingido. Remova um antes de adicionar outro.`,
        );
      }
    }

    // Reaproveita a regra de negócio da entidade (ex.: dataFim >= data)
    // para validar o resultado final antes de persistir.
    this.construirEventoValidado(
      {
        titulo: dto.titulo ?? evento.titulo,
        descricao: dto.descricao ?? evento.descricao,
        data: dataAtualizada,
        dataFim: dataFimAtualizada,
        local: dto.local ?? evento.local,
        endereco: dto.endereco ?? evento.endereco,
        fotoUrl: fotoUrl ?? evento.fotoUrl,
        destaque: destaqueFinal,
      },
      evento.id,
    );

    const dadosAtualizacao: Partial<Evento> = {
      titulo: dto.titulo,
      descricao: dto.descricao,
      local: dto.local,
      endereco: dto.endereco,
      data: dto.data ? dataAtualizada : undefined,
      dataFim: dto.dataFim ? dataFimAtualizada : undefined,
      fotoUrl,
      destaque: dto.destaque,
    };

    const eventoAtualizado = await this.eventoRepository.update(
      id,
      dadosAtualizacao,
    );
    return this.mapToResponseDto(eventoAtualizado);
  }

  async delete(id: string, usuarioLogado: IUsuarioLogado): Promise<void> {
    if (usuarioLogado.perfil !== "ADMIN")
      throw new ForbiddenException(
        "Apenas administradores podem excluir eventos.",
      );

    const evento = await this.eventoRepository.findById(id);
    if (!evento)
      throw new NotFoundException("Evento não encontrado para exclusão.");

    await this.eventoRepository.delete(id);
  }

  private mapToResponseDto(evento: Evento): EventoResponseDto {
    return {
      id: evento.id!,
      titulo: evento.titulo,
      descricao: evento.descricao,
      data: evento.data,
      dataFim: evento.dataFim ?? null,
      local: evento.local,
      endereco: evento.endereco ?? null,
      fotoUrl: evento.fotoUrl,
      destaque: evento.destaque ?? false,
      mes: this.getMesEnum(evento.data), // Injetamos o mês aqui
      createdAt: evento.createdAt!,
    };
  }
}
