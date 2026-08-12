import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateFiquePorDentroRequestDto {
  @ApiProperty({
    description:
      'Posição da imagem na galeria. Deve ser um número de 1 a 5 (como texto: "1", "2", "3", "4" ou "5").',
    example: "1",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1, { message: 'A ordem deve ser um único dígito de "1" a "5".' })
  ordem!: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Arquivo de imagem (jpg, png, webp, etc.)",
  })
  imagem!: any;
}
