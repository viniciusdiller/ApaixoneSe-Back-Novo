import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NormalizeMultipartText } from "../../decorators/normalizeMultipartText.decorator";
import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreateLocalCulturalRequestDto {
  @ApiProperty({
    example: "Igreja de Nossa Senhora de Nazareth",
    description: "Nome do local cultural",
  })
  @IsString()
  @IsNotEmpty({ message: "O nome é obrigatório." })
  @MaxLength(100, { message: "O nome deve ter no máximo 100 caracteres." })
  nome!: string;

  @ApiProperty({
    example:
      "Erguida no século XVII, é o principal marco histórico da cidade.",
    description: "Descrição curta exibida no card",
  })
  @IsString()
  @IsNotEmpty({ message: "A descrição é obrigatória." })
  @NormalizeMultipartText()
  @MaxLength(150, {
    message: "A descrição deve ter no máximo 150 caracteres.",
  })
  descricao!: string;

  @ApiProperty({
    example: "A Igreja de Nossa Senhora de Nazareth é muito mais do que...",
    description: "Texto completo exibido ao abrir os detalhes do local",
  })
  @IsString()
  @IsNotEmpty({ message: "O texto é obrigatório." })
  @NormalizeMultipartText()
  @MaxLength(5000, { message: "O texto deve ter no máximo 5000 caracteres." })
  texto!: string;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    description: 'Imagem do local, enviada no campo "imagem"',
  })
  imagem?: any;

  @ApiPropertyOptional({ example: "Rua Principal, 123 - Centro, Saquarema - RJ" })
  @IsOptional()
  @IsString()
  @MaxLength(191, { message: "O endereço deve ter no máximo 191 caracteres." })
  endereco?: string;
}
