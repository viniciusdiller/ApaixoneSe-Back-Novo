import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class ClicksThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(ClicksThrottlerGuard.name);

  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    this.logger.warn(
      "Rate limit excedido em POST /clicks (limite pré-lançamento, sem baseline real).",
    );
    return super.throwThrottlingException(context);
  }
}
