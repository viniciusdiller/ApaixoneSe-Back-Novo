import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateHospedagemRequestDto {
  @ApiProperty({
    example: "Pousada Viva-Mar",
    description: "Nome da hospedagem",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome!: string;

  @ApiProperty({
    example: "(11) 99999-9999",
    description: "Telefone da hospedagem",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefone!: string;

  @ApiProperty({
    description:
      "Array de tags (ex: ['Wi-Fi', 'Piscina', 'Pet Friendly']). Se enviar via FormData, pode enviar como string JSON.",
    required: false,
    example: ["Wi-Fi", "Ar Condicionado", "Piscina"],
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || Array.isArray(value)) {
      return value;
    }

    if (typeof value !== "string") {
      return value;
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiProperty({
    example: "@pousadaVivaMar",
    description: "Instagram da hospedagem",
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  instagram?: string;

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
    example: "Av. Brasil, 1000",
    description: "Endereço da hospedagem",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  endereco!: string;

  @ApiProperty({
    example: "A melhor pousada da cidade!",
    description: "Texto diferencial da hospedagem",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  textoDiferencial!: string;

  @ApiProperty({
    example: "12.345.678/0001-90",
    description: "CNPJ da hospedagem",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(18)
  cnpj!: string;

  @ApiProperty({
    example: "João da Silva",
    description: "Nome do responsável pela hospedagem",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  responsavelNome!: string;

  @ApiProperty({
    example: "123.456.789-00",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  responsavelCpf!: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    example: "Logo da hospedagem",
  })
  logo!: any;

  @ApiProperty({
    type: "string",
    format: "binary",
    example: "Documento PDF da hospedagem",
  })
  documentoPdf!: any;
}
