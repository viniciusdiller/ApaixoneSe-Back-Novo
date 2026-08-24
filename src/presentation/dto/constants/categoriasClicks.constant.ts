// Categorias com item identificado por slug (têm campo `slug` no Prisma e rota `[slug]` no front)
export const CATEGORIAS_CLICKS_SLUG = ["praias", "lagoas", "roteiros"] as const;

// Categorias com item identificado por id (uuid) - sem rota própria no front, clique disparado no card/modal
export const CATEGORIAS_CLICKS_UUID = [
  "gastronomia",
  "hospedagens",
  "eventos",
  "agencias",
  "casa-de-cambio",
  "cat",
  "esportes",
  "guias",
  "locadoras",
  "secretaria-de-turismo",
  "taxa-de-turismo",
] as const;

// Páginas institucionais estáticas rastreadas (pagina = valor fixo da whitelist)
export const CATEGORIAS_CLICKS_INSTITUCIONAL = ["institucional"] as const;
export const PAGINAS_INSTITUCIONAL_WHITELIST = ["faq"] as const;

export const CATEGORIAS_CLICKS_WHITELIST = [
  ...CATEGORIAS_CLICKS_SLUG,
  ...CATEGORIAS_CLICKS_UUID,
  ...CATEGORIAS_CLICKS_INSTITUCIONAL,
] as const;

export type CategoriaClick = (typeof CATEGORIAS_CLICKS_WHITELIST)[number];
