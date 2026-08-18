import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from "class-validator";

export class CreateEventoPrincipalRequestDto {
  @ApiProperty({ example: "Saquarema Pro 2026" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @ApiProperty({ example: "WSL Championship Tour", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  etapa?: string;

  @ApiProperty({ example: "2026-06-20T00:00:00Z" })
  @IsDateString()
  @IsNotEmpty()
  data!: string;
}
