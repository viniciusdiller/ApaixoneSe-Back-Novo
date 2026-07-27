import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class SetActiveRequestDto {
  @ApiProperty({
    example: true,
    description: "Define se o usuário tem e-mail verificado (campo active)",
  })
  @IsBoolean()
  active!: boolean;
}
