import { Transform } from "class-transformer";

export const OnlyDigits = () =>
  Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\D/g, "") : value,
  );
