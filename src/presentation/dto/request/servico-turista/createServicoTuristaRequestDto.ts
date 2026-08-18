import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateIf,
  MaxLength,
} from "class-validator";
import { TipoServicoTurista, TipoRoteiro } from "@prisma/client";

export class CreateServicoTuristaRequestDto {
  @ApiProperty({ enum: TipoServicoTurista })
  @IsEnum(TipoServicoTurista)
  @IsNotEmpty()
  tipo!: TipoServicoTurista;

  @MaxLength(120)
  @ApiProperty() @IsString() @IsNotEmpty() nome!: string;
  @MaxLength(20)
  @ApiProperty() @IsString() @IsNotEmpty() telefone!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  instagram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  endereco?: string;

  @ApiProperty({
    example: "https://www.meusite.com.br",
    description: "Site oficial",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  site?: string;

  @ApiProperty({
    example: "2024-12-31",
    description: "Data de validade do serviço (se aplicável)",
    required: false,
  })
  @IsOptional()
  @IsString()
  validade?: string;

  // ==========================================
  // CAMPOS ESPECÍFICOS: AGÊNCIA E ESPORTE
  // ==========================================
  @ApiProperty({
    required: false,
    description: "Obrigatório para Agências e Esporte/Lazer",
  })
  @ValidateIf(
    (o) =>
      o.tipo === TipoServicoTurista.AGENCIA_TURISMO ||
      o.tipo === TipoServicoTurista.ESPORTE_LAZER,
  )
  @IsString()
  @IsNotEmpty({
    message: "A descrição é obrigatória para este tipo de serviço.",
  })
  @MaxLength(2000)
  descricao?: string;

  // ==========================================
  // CAMPOS ESPECÍFICOS: GUIAS DE TURISMO
  // ==========================================
  @ApiProperty({ required: false })
  @ValidateIf((o) => o.tipo === TipoServicoTurista.GUIA_TURISMO)
  @IsString()
  @IsNotEmpty({ message: "O CNPJ é obrigatório para Guias." })
  @MaxLength(18)
  cnpj?: string;

  @ApiProperty({ enum: TipoRoteiro, required: false })
  @ValidateIf((o) => o.tipo === TipoServicoTurista.GUIA_TURISMO)
  @IsEnum(TipoRoteiro)
  @IsNotEmpty({ message: "O roteiro especializado é obrigatório para Guias." })
  roteiro?: TipoRoteiro;

  @ApiProperty({ required: false, example: "Português, Inglês" })
  @ValidateIf((o) => o.tipo === TipoServicoTurista.GUIA_TURISMO)
  @IsString()
  @IsNotEmpty({ message: "Os idiomas são obrigatórios para Guias." })
  @MaxLength(150)
  idiomas?: string;

  // ==========================================
  // FICHEIROS (Tratados no Controller, mas documentados aqui)
  // ==========================================
  @ApiProperty({
    type: "string",
    format: "binary",
    required: false,
    description: "Obrigatório para Agências, Esportes e Locadoras",
  })
  @IsOptional()
  logo?: any;

  @ApiProperty({
    type: "string",
    format: "binary",
    required: false,
    description: "Obrigatório apenas para Guias",
  })
  @IsOptional()
  foto?: any;

  @ApiProperty({
    type: "string",
    format: "binary",
    description:
      "Comprovante do Cadastur (Obrigatório exceto Esporte_Lazer. PDF ou Imagem)",
    required: false,
  })
  @IsOptional()
  comprovante?: any;
}
