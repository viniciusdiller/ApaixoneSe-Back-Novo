import { ForbiddenException, Injectable } from "@nestjs/common";
import { ClickCounterRepository } from "../../data/repositories/clickCounter.repository";
import { IUsuarioLogado } from "../../data/interfaces/iUsuarioLogado.Interface";
import { ClickStatsQueryDto } from "../../presentation/dto/request/clicks/clickStatsQueryDto";
import { ClickStatsResponseDto } from "../../presentation/dto/response/clickStatsResponse.dto";

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
  constructor(private readonly repository: ClickCounterRepository) {}

  async registrar(categoria: string, pagina: string): Promise<void> {
    await this.repository.incrementar(categoria, pagina, inicioDoDiaUtc());
  }

  async stats(
    usuarioLogado: IUsuarioLogado,
    filtro: ClickStatsQueryDto,
  ): Promise<ClickStatsResponseDto[]> {
    if (usuarioLogado.perfil !== "ADMIN") {
      throw new ForbiddenException("Apenas administradores.");
    }

    return this.repository.buscarStats({
      categoria: filtro.categoria,
      pagina: filtro.pagina,
      dataInicio: filtro.dataInicio
        ? inicioDoDiaUtc(new Date(filtro.dataInicio))
        : undefined,
      dataFim: filtro.dataFim
        ? inicioDoDiaUtc(new Date(filtro.dataFim))
        : undefined,
    });
  }
}
