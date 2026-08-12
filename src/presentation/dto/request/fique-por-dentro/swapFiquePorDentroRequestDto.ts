import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class SwapFiquePorDentroRequestDto {
  @ApiProperty({ description: "ID do primeiro item" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(36, { message: "O ID deve ter no máximo 36 caracteres." })
  idA!: string;

  @ApiProperty({ description: "ID do segundo item" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(36, { message: "O ID deve ter no máximo 36 caracteres." })
  idB!: string;
}
