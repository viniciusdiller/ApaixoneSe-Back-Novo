import { ApiProperty } from "@nestjs/swagger";

export class ClickStatsResponseDto {
  @ApiProperty({ example: "gastronomia" })
  categoria!: string;

  /**
   * Identificador bruto (uuid/slug/valor fixo). O admin não deve exibir isso
   * quando for um uuid - use paginaLabel, que já resolve pro nome real (ou
   * "Item removido" se o registro não existir mais).
   */
  @ApiProperty({ example: "5d6095ec-619f-493f-b458-714d8af67843" })
  pagina!: string;

  @ApiProperty({ example: "Restaurante do Vineco" })
  paginaLabel!: string;

  /**
   * Slug do "pai" quando o item pertence a outro (hoje só atividades, cujo
   * pai é o slug do roteiro). Ausente pras demais categorias.
   */
  @ApiProperty({ example: "a-pe", required: false })
  paginaPai?: string;

  @ApiProperty({ example: 42 })
  total!: number;
}

export class ClickStatsResumoDto {
  @ApiProperty({ example: 512 })
  totalCliques!: number;

  @ApiProperty({ example: 37 })
  totalCombinacoes!: number;

  @ApiProperty({ type: ClickStatsResponseDto, nullable: true })
  topItem!: ClickStatsResponseDto | null;
}

export class ClickStatsPaginatedResponseDto {
  @ApiProperty({ type: [ClickStatsResponseDto] })
  items!: ClickStatsResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 4 })
  totalPaginas!: number;

  @ApiProperty({ type: ClickStatsResumoDto })
  resumo!: ClickStatsResumoDto;
}
