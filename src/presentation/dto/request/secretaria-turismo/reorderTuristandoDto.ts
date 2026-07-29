import { IsArray, IsInt, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class TuristandoOrdemItemDto {
  @ApiProperty({
    description: "ID do item Turistando",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: "Nova posição (ordem) do item",
    example: 1,
  })
  @IsInt()
  ordem!: number;
}

export class ReorderTuristandoRequestDto {
  @ApiProperty({
    description: "Lista de itens com suas respectivas novas ordens",
    type: [TuristandoOrdemItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TuristandoOrdemItemDto)
  items!: TuristandoOrdemItemDto[];
}
