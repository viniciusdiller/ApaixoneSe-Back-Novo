export interface IClickStatsFiltro {
  categoria?: string;
  pagina?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface IClickStatsResultado {
  categoria: string;
  pagina: string;
  total: number;
}

export interface IClickCounterRepository {
  incrementar(categoria: string, pagina: string, data: Date): Promise<void>;
  buscarStats(filtro: IClickStatsFiltro): Promise<IClickStatsResultado[]>;
}
