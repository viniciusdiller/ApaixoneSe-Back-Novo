// Categorias com item identificado por slug (têm campo `slug` no Prisma e rota `[slug]` no front)
export const CATEGORIAS_CLICKS_SLUG = ["praias", "lagoas", "roteiros"] as const;

// Categorias com item identificado por id (uuid) - listas reais de itens, sem
// rota própria no front (clique disparado no card/modal "Ver detalhes")
export const CATEGORIAS_CLICKS_UUID = [
  "gastronomia",
  "hospedagens",
  "eventos",
  "agencias",
  "casa-de-cambio",
  "esportes",
  "guias",
  "locadoras",
] as const;

// Categorias de página única/institucional - não são listas de item, são
// conteúdo estático ou um único registro (ex: CAT tem só 1 registro na
// prática). pagina é sempre um valor fixo, nunca um id dinâmico.
export const CATEGORIAS_CLICKS_PAGINA_FIXA = [
  "cat",
  "secretaria-de-turismo",
  "taxa-de-turismo",
  "institucional",
] as const;

// Para "institucional" o valor de pagina identifica QUAL página estática;
// para as demais categorias de página fixa, pagina == a própria categoria.
export const PAGINAS_INSTITUCIONAL_WHITELIST = ["faq", "home"] as const;

export const CATEGORIAS_CLICKS_WHITELIST = [
  ...CATEGORIAS_CLICKS_SLUG,
  ...CATEGORIAS_CLICKS_UUID,
  ...CATEGORIAS_CLICKS_PAGINA_FIXA,
] as const;

export type CategoriaClick = (typeof CATEGORIAS_CLICKS_WHITELIST)[number];
