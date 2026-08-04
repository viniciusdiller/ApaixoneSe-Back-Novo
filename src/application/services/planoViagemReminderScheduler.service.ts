import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PlanoViagemRepository } from "../../data/repositories/planoViagem.repository";
import { PlanoViagemReminderService } from "./planoViagemReminder.service";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PlanoViagemReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(PlanoViagemReminderSchedulerService.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly repo: PlanoViagemRepository,
    private readonly reminderService: PlanoViagemReminderService,
  ) {}

  onModuleInit() {
    if (process.env.PLANO_VIAGEM_REMINDER_SCHEDULER_DISABLED === "true") {
      this.logger.warn("[PlanoViagemReminderScheduler] Agendador desativado por env.");
      return;
    }

    this.logger.log("[PlanoViagemReminderScheduler] Agendador iniciado; execucao diaria a cada 24h.");
    void this.handleDailyTravelReminders();
    this.interval = setInterval(() => {
      void this.handleDailyTravelReminders();
    }, ONE_DAY_MS);
  }

  async handleDailyTravelReminders() {
    const target = new Date(Date.now() + 5 * ONE_DAY_MS);
    const start = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate() + 1, 0, 0, 0, 0));

    this.logger.log(
      `[PlanoViagemReminderScheduler] Buscando planos com inicio entre ${start.toISOString()} e ${end.toISOString()}`,
    );

    const planos = await this.repo.findPendingLembretesByDataInicio(start, end);
    this.logger.log(`[PlanoViagemReminderScheduler] ${planos.length} plano(s) encontrado(s).`);

    for (const plano of planos) {
      try {
        await this.reminderService.sendReminderForPlano(plano.id);
      } catch (error) {
        this.logger.error(
          `[PlanoViagemReminderScheduler] Erro ao enviar lembrete do plano ${plano.id}`,
          error,
        );
      }
    }

    this.logger.log("[PlanoViagemReminderScheduler] Execucao finalizada.");
  }
}
