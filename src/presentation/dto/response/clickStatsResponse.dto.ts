import { ApiProperty } from "@nestjs/swagger";

export class ClickStatsResponseDto {
  @ApiProperty({ example: "gastronomia" })
  categoria!: string;

  @ApiProperty({ example: "5d6095ec-619f-493f-b458-714d8af67843" })
  pagina!: string;

  @ApiProperty({ example: 42 })
  total!: number;
}
