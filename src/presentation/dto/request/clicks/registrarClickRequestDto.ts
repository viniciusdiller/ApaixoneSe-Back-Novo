import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";
import {
  CATEGORIAS_CLICKS_WHITELIST,
  CategoriaClick,
} from "../../constants/categoriasClicks.constant";
import { PaginaValidaParaCategoria } from "../../decorators/paginaValidaParaCategoria.decorator";

export class RegistrarClickRequestDto {
  @ApiProperty({
    example: "gastronomia",
    enum: CATEGORIAS_CLICKS_WHITELIST,
  })
  @IsIn(CATEGORIAS_CLICKS_WHITELIST, {
    message: "categoria inválida.",
  })
  categoria!: CategoriaClick;

  @ApiProperty({
    example: "5d6095ec-619f-493f-b458-714d8af67843",
    description: "id (uuid) do item, slug, ou nome fixo da página institucional, conforme a categoria",
  })
  @IsString()
  @PaginaValidaParaCategoria()
  pagina!: string;
}
