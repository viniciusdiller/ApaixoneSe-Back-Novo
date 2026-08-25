import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
    const where = { categoria_pagina_data: { categoria, pagina, data } };
    try {
      await this.prisma.clickCounter.upsert({
        where,
        update: { total: { increment: 1 } },
        create: { categoria, pagina, data, total: 1 },
      });
    } catch (error) {
      // upsert do Prisma faz SELECT e depois INSERT/UPDATE (nao e atomico no
      // MySQL) - dois cliques concorrentes na mesma categoria+pagina+data
      // podem ambos "nao achar" a linha e tentar criar, um deles estoura a
      // unique constraint. Nesse caso a linha ja existe (foi o outro request
      // que criou), so falta aplicar o increment.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        await this.prisma.clickCounter.update({
          where,
          data: { total: { increment: 1 } },
        });
        return;
      }
      throw error;
    }
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
