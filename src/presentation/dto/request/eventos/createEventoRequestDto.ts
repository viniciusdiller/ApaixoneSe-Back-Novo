import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MaxLength,
} from "class-validator";

export class CreateEventoRequestDto {
  @ApiProperty({
    example: "Saquarema Country Fest",
    description: "Título oficial do evento",
  })
  @IsString()
  @IsNotEmpty({ message: "O título é obrigatório" })
  @MaxLength(150)
  titulo!: string;

  @ApiProperty({
    example: "O maior evento country da região dos lagos...",
    description: "Detalhes do evento",
  })
  @IsString()
  @IsNotEmpty({ message: "A descrição é obrigatória" })
  @MaxLength(3000)
  descricao!: string;

  @ApiProperty({
    example: "2026-04-01T20:00:00Z",
    description: "Data e hora no formato ISO8601",
  })
  @IsDateString({}, { message: "Forneça uma data válida" })
  @IsNotEmpty({ message: "A data é obrigatória" })
  data!: string;

  @ApiProperty({ example: "Parque de Exposições, Sampaio Corrêa" })
  @IsString()
  @IsNotEmpty({ message: "O local é obrigatório" })
  @MaxLength(150)
  local!: string;

  @ApiPropertyOptional({ example: "Av. Sampaio Corrêa, 500 - Saquarema - RJ" })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  endereco?: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    required: false,
    description: 'Imagem de fundo do evento enviada no campo "foto" (compatível com "imagem")',
  })
  foto?: any;
}
