import { PlanoViagem } from "../entities/planoViagem.Entity";

export interface IPlanoViagemRepository {
  save(plano: PlanoViagem): Promise<PlanoViagem>;
  findByUsuarioId(usuarioId: string): Promise<PlanoViagem[]>;
  findById(id: string): Promise<PlanoViagem | null>;
  findByIdWithUsuarioAndItens(id: string): Promise<any | null>;
  findPendingLembretesByDataInicio(start: Date, end: Date): Promise<any[]>;
  markLembreteEmailEnviado(id: string): Promise<void>;
  update(id: string, data: Partial<PlanoViagem>): Promise<PlanoViagem>;
  delete(id: string): Promise<void>;
}
