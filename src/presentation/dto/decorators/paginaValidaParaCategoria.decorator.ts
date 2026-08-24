import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import {
  CATEGORIAS_CLICKS_SLUG,
  CATEGORIAS_CLICKS_UUID,
  PAGINAS_INSTITUCIONAL_WHITELIST,
} from "../constants/categoriasClicks.constant";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@ValidatorConstraint({ name: "PaginaValidaParaCategoria", async: false })
class PaginaValidaParaCategoriaConstraint
  implements ValidatorConstraintInterface
{
  validate(pagina: unknown, args: ValidationArguments): boolean {
    if (typeof pagina !== "string" || pagina.length === 0) return false;

    const categoria = (args.object as { categoria?: unknown }).categoria;
    if (typeof categoria !== "string") return false;

    if ((CATEGORIAS_CLICKS_SLUG as readonly string[]).includes(categoria)) {
      return SLUG_REGEX.test(pagina) && pagina.length <= 191;
    }

    if ((CATEGORIAS_CLICKS_UUID as readonly string[]).includes(categoria)) {
      return UUID_REGEX.test(pagina);
    }

    if (categoria === "institucional") {
      return (PAGINAS_INSTITUCIONAL_WHITELIST as readonly string[]).includes(
        pagina,
      );
    }

    return false;
  }

  defaultMessage(): string {
    return "O valor de pagina não é válido para a categoria informada.";
  }
}

export function PaginaValidaParaCategoria(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PaginaValidaParaCategoriaConstraint,
    });
  };
}
