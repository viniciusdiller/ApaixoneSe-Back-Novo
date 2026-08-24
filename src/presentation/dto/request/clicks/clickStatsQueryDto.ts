import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { CATEGORIAS_CLICKS_WHITELIST } from "../../constants/categoriasClicks.constant";

export class ClickStatsQueryDto {
  @ApiProperty({ required: false, enum: CATEGORIAS_CLICKS_WHITELIST })
  @IsOptional()
  @IsIn(CATEGORIAS_CLICKS_WHITELIST, { message: "categoria inválida." })
  categoria?: string;

  @ApiProperty({ required: false, example: "5d6095ec-619f-493f-b458-714d8af67843" })
  @IsOptional()
  pagina?: string;

  @ApiProperty({ required: false, example: "2026-08-01" })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiProperty({ required: false, example: "2026-08-31" })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
