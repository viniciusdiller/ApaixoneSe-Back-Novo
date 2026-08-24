# ApaixoneSe-Back

Contexto específico deste repositório. Postura, segurança e fluxo de git
gerais ficam no `CLAUDE.md` global — aqui só o que é próprio deste projeto.

## Stack

- NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- Prisma 6 + MySQL (`prisma/schema.prisma`)
- Auth: JWT (`jsonwebtoken` + `@nestjs/passport`/`passport-jwt`), senha com `bcryptjs`
- Validação: `class-validator` + `class-transformer`, `ValidationPipe` global (`whitelist: true, transform: true, forbidNonWhitelisted: true` em `src/main.ts`) — qualquer campo fora do DTO é rejeitado automaticamente
- Rate limiting pontual: `@nestjs/throttler` (não é global — só nas rotas que declaram `@UseGuards(ThrottlerGuard-ou-subclasse)` explicitamente)
- Swagger em `/api-docs`
- `app.setGlobalPrefix("api")` — toda rota é servida sob `/api/*`

## Arquitetura — 3 camadas flat, sem módulo por feature

```
src/
├── data/            # entities (classes de domínio), interfaces de repositório, repositories (Prisma), providers/db
├── application/      # *.Application.ts — casos de uso, regra de negócio, AUTHZ
└── presentation/      # controllers, dto/request, dto/response, dto/decorators, guards
```

Não existe `FeatureModule` por domínio (nada de `GastronomiaModule`,
`ClicksModule`, etc.). Existem exatamente **três** `@Module()`:
`DataModule`, `ApplicationModule`, `PresentationModule` — cada um registra
todos os providers/controllers da sua camada num array só. Pra adicionar uma
feature nova:

1. `src/data/data.module.ts` — adiciona o repository ao array `repositories`.
2. `src/application/application.module.ts` — adiciona a `*Application` em `providers` **e** `exports`.
3. `src/presentation/presentation.module.ts` — adiciona o `*Controller` ao array `controllers`.

`app.module.ts` só importa os três módulos guarda-chuva, não muda.

## Convenção de autorização — vive na Application, não no Controller/Guard

`JwtAuthGuard` (`src/presentation/guards/jwt-autg.guard.ts` — note o typo
proposital no nome do arquivo, mantido por consistência com o resto do repo)
só garante que existe um usuário autenticado (`req.user: IUsuarioLogado`).
A checagem de **perfil** (ex: `perfil === 'ADMIN'`, ou "é ADMIN ou é o dono
do recurso") é feita dentro do método da Application, nunca num guard
dedicado nem no controller. Padrão de referência:
`src/application/applications/user.Application.ts#findAll`:

```ts
async findAll(usuarioLogado: IUsuarioLogado) {
  if (usuarioLogado.perfil !== "ADMIN") throw new ForbiddenException("Apenas administradores.");
  ...
}
```

O controller só faz `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` e repassa
`req.user` pra Application. Repetido nesse padrão em ~45 lugares no repo —
não crie um `RolesGuard` novo, siga essa convenção.

## Contrato dos endpoints de Clicks (analytics)

Contador de cliques agregado por dia (`model ClickCounter`, tabela
`click_counters`, chave única `[categoria, pagina, data]`) — **não** é event
log por clique, é upsert com `increment`. Público e anônimo, sem relação com
`Visita`/`VisitaController` (aquilo é check-in autenticado do usuário num
estabelecimento, feature completamente separada).

### `POST /api/clicks` — público

- **Sem** `JwtAuthGuard` (clique de visitante anônimo).
- Body: `{ categoria: string, pagina: string }`. `categoria` validada contra
  whitelist fixa (`src/presentation/dto/constants/categoriasClicks.constant.ts`),
  dividida em 3 grupos com formato de `pagina` diferente cada:
  - `CATEGORIAS_CLICKS_SLUG` (`praias`, `lagoas`, `roteiros`) — `pagina` é o
    `slug` do item.
  - `CATEGORIAS_CLICKS_UUID` (`gastronomia`, `hospedagens`, `eventos`,
    `agencias`, `casa-de-cambio`, `esportes`, `guias`, `locadoras`) — listas
    reais de item, sem rota própria; `pagina` é o `id` (uuid) do item,
    clique disparado no card/modal "Ver detalhes".
  - `CATEGORIAS_CLICKS_PAGINA_FIXA` (`cat`, `secretaria-de-turismo`,
    `taxa-de-turismo`, `institucional`) — **não** são listas de item (CAT e
    Secretaria têm só 1 registro cada; taxa-de-turismo é conteúdo 100%
    estático), então `pagina` é sempre um valor fixo: igual à própria
    categoria, exceto `institucional` onde `pagina` identifica qual página
    estática (whitelist própria, hoje só `faq`).

  `pagina` validada por esse formato condicionado à categoria via
  `paginaValidaParaCategoria.decorator.ts`. **Nunca** aceita `total`/`data`/`id`
  do client — a data do bucket é sempre `new Date()` do servidor.
- Resposta: `204 No Content`.
- **Rate limit: 30 req/min por IP**, aplicado só nessa rota via
  `ClicksThrottlerGuard` (`src/presentation/guards/clicksThrottler.guard.ts`)
  — **não** é `APP_GUARD` global, não afeta o resto da API. Todo 429
  bloqueado gera `Logger.warn` **sem IP** (LGPD). ⚠️ **30/min é uma
  estimativa pré-lançamento, sem baseline de tráfego real** — revisitar
  esse número depois que o site for ao ar e houver dado real de uso.

### `GET /api/clicks/stats` — apenas ADMIN

- `@UseGuards(JwtAuthGuard)` + `Authorization: Bearer <jwt>`; checagem
  `perfil === 'ADMIN'` dentro de `ClickCounterApplication#stats` (não no
  controller — ver convenção acima).
- Query opcional: `{ categoria?, pagina?, dataInicio?, dataFim? }` (datas em
  `YYYY-MM-DD`).
- Resposta: `200` com `[{ categoria: string, pagina: string, total: number }]`
  — agregado (soma) no intervalo de datas informado, agrupado por
  categoria+página.
- `401` sem token, `403` se `perfil !== 'ADMIN'`.

## Scripts úteis

- `npm run dev` — ts-node-dev com respawn.
- `npm run build` / `npm run start` — build de produção.
- `npx prisma migrate dev --name <nome>` — nova migration.
- `npx prisma generate` — regenerar o Prisma Client (rodar sempre que
  `schema.prisma` mudar; se der `EPERM` no Windows, é o dev server segurando
  o `.dll` do query engine — pare o processo `node` e rode de novo).
- `npm run seed:admin` — cria/atualiza o usuário ADMIN inicial (variáveis em `.env`).
