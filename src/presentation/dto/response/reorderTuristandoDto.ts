import { ApiProperty } from "@nestjs/swagger";

export class ReorderTuristandoResponseDto {
  @ApiProperty({
    example: "Ordem atualizada com sucesso!",
    description: "Mensagem de confirmação da atualização",
  })
  message!: string;
}
