import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateFiquePorDentroRequestDto {
  @ApiPropertyOptional({
    description: 'Nova posição da imagem na galeria ("1" a "5")',
    example: "3",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1, { message: 'A ordem deve ser um único dígito de "1" a "5".' })
  ordem?: string;
}
