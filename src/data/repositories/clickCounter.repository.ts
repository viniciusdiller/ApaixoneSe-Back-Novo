import { Injectable } from "@nestjs/common";
import { PrismaService } from "../providers/db/prisma.Service";
import {
  IClickCounterRepository,
  IClickStatsFiltro,
  IClickStatsResultado,
} from "../interfaces/iClickCounterRepository.Interface";

@Injectable()
export class ClickCounterRepository implements IClickCounterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async incrementar(
    categoria: string,
    pagina: string,
    data: Date,
  ): Promise<void> {
    await this.prisma.clickCounter.upsert({
      where: {
        categoria_pagina_data: { categoria, pagina, data },
      },
      update: {
        total: { increment: 1 },
      },
      create: {
        categoria,
        pagina,
        data,
        total: 1,
      },
    });
  }

  async buscarStats(
    filtro: IClickStatsFiltro,
  ): Promise<IClickStatsResultado[]> {
    const resultado = await this.prisma.clickCounter.groupBy({
      by: ["categoria", "pagina"],
      where: {
        categoria: filtro.categoria,
        pagina: filtro.pagina,
        data: {
          gte: filtro.dataInicio,
          lte: filtro.dataFim,
        },
      },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
    });

    return resultado.map((r) => ({
      categoria: r.categoria,
      pagina: r.pagina,
      total: r._sum.total ?? 0,
    }));
  }
}
