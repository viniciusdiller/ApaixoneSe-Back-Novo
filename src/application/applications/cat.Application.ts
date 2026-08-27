import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { CatRepository } from "../../data/repositories/cat.repository";
import { Cat } from "../../data/entities/cat.Entity";
import { IUsuarioLogado } from "../../data/interfaces/iUsuarioLogado.Interface";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class CatApplication {
  constructor(private readonly repo: CatRepository) {}

  // ─── CREATE (apenas se ainda não existir nenhum registro) ───────────────────
  async create(
    data: any,
    usuarioLogado: IUsuarioLogado,
    imagensUrl?: string[],
    videoUrl?: string,
  ) {
    if (usuarioLogado.perfil !== "ADMIN") {
      throw new ForbiddenException(
        "Apenas administradores podem configurar as informações do CAT.",
      );
    }

    const existente = await this.repo.findFirst();
    if (existente) {
      throw new ConflictException(
        "As informações do CAT já foram configuradas. Use PUT para atualizá-las.",
      );
    }

    const dadosLimpos: any = { ...data };
    delete dadosLimpos.imagens;
    delete dadosLimpos.video;
    delete dadosLimpos.ordem;

    const novo = new Cat({ ...dadosLimpos, imagensUrl, videoUrl });
    return this.repo.save(novo);
  }

  // ─── GET (retorna o único registro) ─────────────────────────────────────────
  async findOne() {
    const c = await this.repo.findFirst();
    if (!c)
      throw new NotFoundException("As informações do CAT ainda não foram configuradas.");
    return c;
  }

  // ─── UPDATE (atualiza o único registro — ADMIN) ─────────────────────────────
  async update(
    data: any,
    usuarioLogado: IUsuarioLogado,
    novasImagensUrl?: string[],
    videoUrl?: string,
    ordem?: string[],
  ) {
    if (usuarioLogado.perfil !== "ADMIN") {
      throw new ForbiddenException(
        "Apenas administradores podem alterar as informações do CAT.",
      );
    }

    const existente = await this.repo.findFirst();
    if (!existente)
      throw new NotFoundException(
        "As informações do CAT ainda não foram configuradas. Use POST primeiro.",
      );

    const dadosAtualizacao: any = { ...data };
    delete dadosAtualizacao.imagens;
    delete dadosAtualizacao.video;
    delete dadosAtualizacao.ordem;

    if (videoUrl) {
      this.removerArquivo(existente.videoUrl);
      dadosAtualizacao.videoUrl = videoUrl;
    }

    const antigas: string[] = Array.isArray(existente.imagensUrl)
      ? existente.imagensUrl
      : [];

    if (ordem && ordem.length > 0) {
      // Toda URL "existente" enviada no `ordem` precisa realmente pertencer ao
      // registro atual — o client não pode injetar caminho arbitrário que vira
      // estado persistido em `imagensUrl`.
      const urlInvalida = ordem.find(
        (item) => item !== "__new__" && !antigas.includes(item),
      );
      if (urlInvalida) {
        throw new BadRequestException(
          "A ordem enviada referencia uma imagem que não pertence ao registro.",
        );
      }

      // Reconstrói a lista final: existentes mantidas (na nova ordem) + novas enviadas
      let proximoIndice = 0;
      const urlsFinais = ordem
        .map((item) =>
          item === "__new__" ? novasImagensUrl?.[proximoIndice++] : item,
        )
        .filter((url): url is string => !!url);

      antigas
        .filter((url) => !urlsFinais.includes(url))
        .forEach((url) => this.removerArquivo(url));

      dadosAtualizacao.imagensUrl = urlsFinais;
    } else if (novasImagensUrl && novasImagensUrl.length > 0) {
      // Sem informação de ordem (cliente antigo): substitui a galeria inteira
      antigas.forEach((url) => this.removerArquivo(url));
      dadosAtualizacao.imagensUrl = novasImagensUrl;
    }

    return this.repo.update(existente.id!, dadosAtualizacao);
  }

  // ─── Helper: remove arquivo físico do disco com segurança ───────────────────
  private removerArquivo(url?: string | null): void {
    if (!url) return;
    const filePath = path.join(".", url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
