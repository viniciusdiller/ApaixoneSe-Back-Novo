import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PlanoViagemRepository } from "../../data/repositories/planoViagem.repository";
import { IUsuarioLogado } from "../../data/interfaces/iUsuarioLogado.Interface";
import { buildPlanoViagemReminderTemplate } from "../email-templates";
import { EmailService } from "./email.service";
import { PlanoViagemPdfService } from "./planoViagemPdf.service";

@Injectable()
export class PlanoViagemReminderService {
  private readonly logger = new Logger(PlanoViagemReminderService.name);

  constructor(
    private readonly repo: PlanoViagemRepository,
    private readonly pdfService: PlanoViagemPdfService,
    private readonly emailService: EmailService,
  ) {}

  async sendReminderForPlano(
    planoId: string,
    options: { manual?: boolean; usuarioLogado?: IUsuarioLogado } = {},
  ) {
    this.logger.log(
      `[PlanoViagemReminder] Iniciando envio ${options.manual ? "manual" : "automatico"} para plano ${planoId}`,
    );

    const plano = await this.repo.findByIdWithUsuarioAndItens(planoId);
    if (!plano) throw new NotFoundException("Roteiro não encontrado.");

    if (options.usuarioLogado) {
      this.ensureCanSend(plano, options.usuarioLogado);
    }

    const usuario = plano.usuario;
    if (!usuario?.email) {
      throw new NotFoundException("Usuário do roteiro não possui e-mail cadastrado.");
    }

    const pdfBuffer = this.pdfService.generate(plano);
    const { subject, text, html } = buildPlanoViagemReminderTemplate({
      nome: usuario.nome || "viajante",
      tituloPlano: plano.titulo,
      dataInicio: plano.dataInicio,
      dataFim: plano.dataFim,
    });

    const filename = `plano-viagem-${this.slugify(plano.titulo)}.pdf`;
    await this.emailService.sendEmail(usuario.email, subject, text, html, [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ]);

    if (!options.manual) {
      await this.repo.markLembreteEmailEnviado(plano.id);
    }

    this.logger.log(
      `[PlanoViagemReminder] Lembrete do plano ${plano.id} enviado com sucesso para ${usuario.email}; anexo=${filename}; bytes=${pdfBuffer.length}`,
    );

    return {
      planoId: plano.id,
      email: usuario.email,
      filename,
      manual: Boolean(options.manual),
    };
  }

  private ensureCanSend(plano: any, usuarioLogado: IUsuarioLogado) {
    if (
      usuarioLogado.perfil !== "ADMIN" &&
      plano.usuarioId !== usuarioLogado.id
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para enviar este roteiro por e-mail.",
      );
    }
  }

  private slugify(value: string) {
    return (value || "roteiro")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
  }
}
