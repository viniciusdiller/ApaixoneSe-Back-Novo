import { ForbiddenException, Injectable } from "@nestjs/common";
import { ClickCounterRepository } from "../../data/repositories/clickCounter.repository";
import { GastronomiaRepository } from "../../data/repositories/gastronomia.repository";
import { HospedagemRepository } from "../../data/repositories/hospedagem.repository";
import { EventoRepository } from "../../data/repositories/evento.repository";
import { ServicoTuristaRepository } from "../../data/repositories/servicoTurista.repository";
import { CasaDeCambioRepository } from "../../data/repositories/casaDeCambio.repository";
import { PontoAguaRepository } from "../../data/repositories/pontoAgua.repository";
import { AtividadeRepository } from "../../data/repositories/atividade.repository";
import { IUsuarioLogado } from "../../data/interfaces/iUsuarioLogado.Interface";
import { IClickStatsResultado } from "../../data/interfaces/iClickCounterRepository.Interface";
import { ClickStatsQueryDto } from "../../presentation/dto/request/clicks/clickStatsQueryDto";
import {
  ClickStatsPaginatedResponseDto,
  ClickStatsResponseDto,
} from "../../presentation/dto/response/clickStatsResponse.dto";

const ITEM_REMOVIDO = "Item removido";

// Páginas de conteúdo único/estático (ver CATEGORIAS_CLICKS_PAGINA_FIXA) -
// pagina == categoria, então o rótulo é só um nome amigável fixo.
const PAGINA_FIXA_LABELS: Record<string, string> = {
  faq: "Perguntas Frequentes",
  home: "Página Inicial",
  cat: "CAT — Centro de Atendimento ao Turista",
  "secretaria-de-turismo": "Secretaria de Esporte, Lazer e Turismo",
  "taxa-de-turismo": "Taxa de Turismo",
};

// Roteiros são estáticos (7 fixos, definidos no front em src/lib/roteiros.ts),
// sem tabela própria no banco - duplicar aqui é mais simples que criar uma
// tabela só pra isso.
const ROTEIRO_SLUG_LABELS: Record<string, string> = {
  "a-pe": "Roteiro A Pé",
  "esporte-e-aventura": "Roteiro Esporte e Aventura",
  "de-praias": "Roteiro De Praias",
  cultural: "Roteiro Cultural",
  religioso: "Roteiro Religioso",
  rural: "Roteiro Rural",
  ecologico: "Roteiro Ecológico",
};

// Enum TipoRoteiro (Prisma) -> slug do roteiro no front. Usado só pra
// resolver o "pai" de uma atividade (categoria=atividades) pro slug do
// roteiro em que ela aparece.
const ROTEIRO_ENUM_TO_SLUG: Record<string, string> = {
  A_PE: "a-pe",
  ESPORTE_E_AVENTURA: "esporte-e-aventura",
  DE_PRAIAS: "de-praias",
  CULTURAL: "cultural",
  RELIGIOSO: "religioso",
  RURAL: "rural",
  ECOLOGICO: "ecologico",
};

interface DetalhesPagina {
  label: string;
  pai?: string;
}

function inicioDoDiaUtc(referencia: Date = new Date()): Date {
  return new Date(
    Date.UTC(
      referencia.getUTCFullYear(),
      referencia.getUTCMonth(),
      referencia.getUTCDate(),
    ),
  );
}

@Injectable()
export class ClickCounterApplication {
  constructor(
    private readonly repository: ClickCounterRepository,
    private readonly gastronomiaRepository: GastronomiaRepository,
    private readonly hospedagemRepository: HospedagemRepository,
    private readonly eventoRepository: EventoRepository,
    private readonly servicoTuristaRepository: ServicoTuristaRepository,
    private readonly casaDeCambioRepository: CasaDeCambioRepository,
    private readonly pontoAguaRepository: PontoAguaRepository,
    private readonly atividadeRepository: AtividadeRepository,
  ) {}

  async registrar(categoria: string, pagina: string): Promise<void> {
    await this.repository.incrementar(categoria, pagina, inicioDoDiaUtc());
  }

  async stats(
    usuarioLogado: IUsuarioLogado,
    filtro: ClickStatsQueryDto,
  ): Promise<ClickStatsPaginatedResponseDto> {
    if (usuarioLogado.perfil !== "ADMIN") {
      throw new ForbiddenException("Apenas administradores.");
    }

    const page = filtro.page ?? 1;
    const limit = filtro.limit ?? 10;

    // Cardinalidade real (categoria x pagina) de um site institucional é
    // pequena o suficiente pra agregar tudo em memória e paginar depois -
    // se um dia crescer muito, migrar pra LIMIT/OFFSET no groupBy via SQL raw.
    const todos = await this.repository.buscarStats({
      categoria: filtro.categoria,
      pagina: filtro.pagina,
      dataInicio: filtro.dataInicio
        ? inicioDoDiaUtc(new Date(filtro.dataInicio))
        : undefined,
      dataFim: filtro.dataFim
        ? inicioDoDiaUtc(new Date(filtro.dataFim))
        : undefined,
    });

    const totalCombinacoes = todos.length;
    const totalPaginas = Math.max(1, Math.ceil(totalCombinacoes / limit));
    const inicio = (page - 1) * limit;
    const fatiaAtual = todos.slice(inicio, inicio + limit);

    const items = await this.resolverLabels(fatiaAtual);
    const totalCliques = todos.reduce((acc, item) => acc + item.total, 0);
    const topItem = todos[0]
      ? (await this.resolverLabels([todos[0]]))[0]
      : null;

    return {
      items,
      page,
      limit,
      totalPaginas,
      resumo: { totalCliques, totalCombinacoes, topItem },
    };
  }

  private async resolverLabels(
    itens: IClickStatsResultado[],
  ): Promise<ClickStatsResponseDto[]> {
    return Promise.all(
      itens.map(async (item) => {
        const { label, pai } = await this.resolverDetalhes(
          item.categoria,
          item.pagina,
        );
        return { ...item, paginaLabel: label, paginaPai: pai };
      }),
    );
  }

  private async resolverDetalhes(
    categoria: string,
    pagina: string,
  ): Promise<DetalhesPagina> {
    switch (categoria) {
      case "gastronomia":
        return {
          label:
            (await this.gastronomiaRepository.findById(pagina))?.nome ??
            ITEM_REMOVIDO,
        };
      case "hospedagens":
        return {
          label:
            (await this.hospedagemRepository.findById(pagina))?.nome ??
            ITEM_REMOVIDO,
        };
      case "eventos":
        return {
          label:
            (await this.eventoRepository.findById(pagina))?.titulo ??
            ITEM_REMOVIDO,
        };
      case "agencias":
      case "esportes":
      case "guias":
      case "locadoras":
        return {
          label:
            (await this.servicoTuristaRepository.findById(pagina))?.nome ??
            ITEM_REMOVIDO,
        };
      case "casa-de-cambio":
        return {
          label:
            (await this.casaDeCambioRepository.findById(pagina))?.nome ??
            ITEM_REMOVIDO,
        };
      case "praias":
      case "lagoas":
        return {
          label:
            (await this.pontoAguaRepository.findBySlug(pagina))?.nome ??
            ITEM_REMOVIDO,
        };
      case "roteiros":
        return { label: ROTEIRO_SLUG_LABELS[pagina] ?? pagina };
      case "atividades": {
        const atividade = await this.atividadeRepository.findById(pagina);
        if (!atividade) return { label: ITEM_REMOVIDO };
        return {
          label: atividade.titulo,
          pai: ROTEIRO_ENUM_TO_SLUG[atividade.roteiro],
        };
      }
      default:
        return { label: PAGINA_FIXA_LABELS[pagina] ?? pagina };
    }
  }
}
