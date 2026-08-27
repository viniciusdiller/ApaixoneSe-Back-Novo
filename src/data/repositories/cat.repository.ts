import { Injectable } from "@nestjs/common";
import { PrismaService } from "../providers/db/prisma.Service";
import { ICatRepository } from "../interfaces/iCat.Interface";
import { Cat } from "../entities/cat.Entity";

@Injectable()
export class CatRepository implements ICatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(cat: Cat): Promise<Cat> {
    const criado = await this.prisma.cat.create({
      data: {
        texto: cat.texto,
        imagensUrl: cat.imagensUrl,
        videoUrl: cat.videoUrl,
      },
    });
    return new Cat(criado);
  }

  // Busca o primeiro (e único) registro da tabela
  async findFirst(): Promise<Cat | null> {
    const c = await this.prisma.cat.findFirst();
    if (!c) return null;
    return new Cat(c);
  }

  async update(id: string, data: Partial<Cat>): Promise<Cat> {
    const atualizado = await this.prisma.cat.update({
      where: { id },
      data,
    });
    return new Cat(atualizado);
  }
}
