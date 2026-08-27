import { Cat } from "../entities/cat.Entity";

export interface ICatRepository {
  save(cat: Cat): Promise<Cat>;
  findFirst(): Promise<Cat | null>;
  update(id: string, data: Partial<Cat>): Promise<Cat>;
}
