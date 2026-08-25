import { ApiProperty } from "@nestjs/swagger";
import { Mes } from "@prisma/client";

export class EventoResponseDto {
  @ApiProperty({ example: "uuid-1234-5678" })
  id!: string;

  @ApiProperty({ example: "Saquarema Country Fest" })
  titulo!: string;

  @ApiProperty({ example: "O maior evento country..." })
  descricao!: string;

  @ApiProperty({
    example: "2026-04-01T20:00:00.000Z",
    description: "Data e hora de início do evento",
  })
  data!: Date;

  @ApiProperty({
    example: "2026-04-03T23:00:00.000Z",
    description:
      "Data e hora de término do evento. Nulo quando o evento é de um único dia.",
    required: false,
    nullable: true,
  })
  dataFim?: Date | null;

  @ApiProperty({ example: "Parque de Exposições, Sampaio Corrêa" })
  local!: string;

  @ApiProperty({ example: "Av. Sampaio Corrêa, 500 - Saquarema - RJ", required: false })
  endereco?: string | null;

  @ApiProperty({
    example: "/public/eventos/abril/saquarema_country_fest/background_1718046234123.webp",
    required: false,
  })
  fotoUrl?: string;

  @ApiProperty({
    example: false,
    description: "Se true, o evento aparece no carrossel 'Fique Por Dentro' da home",
  })
  destaque!: boolean;

  // Novo campo: o Frontend usa isso para escolher a imagem
  @ApiProperty({ enum: Mes, example: "ABRIL" })
  mes!: Mes;

  @ApiProperty()
  createdAt!: Date;
}
