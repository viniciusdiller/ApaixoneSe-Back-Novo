import { Transform } from "class-transformer";

export const NormalizeMultipartText = () =>
  Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\r\n?/g, "\n") : value,
  );
