/**
 * cleanup-formatted-documents.ts
 *
 * Remove pontuação (parênteses, espaços, pontos, traços, "/") de telefone,
 * CNPJ e CPF já salvos no banco antes da validação de entrada existir.
 *
 * Script operacional, roda uma vez só — como seed-admin.ts. NÃO é uma
 * migration do Prisma.
 *
 * IMPORTANTE: faça um backup do banco (mysqldump) antes de rodar em produção.
 * Rode primeiro contra uma cópia local/staging e confira o resumo impresso.
 *
 * Como rodar:
 *   npm run cleanup:documents
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface Summary {
  updated: number;
  skippedAlreadyClean: number;
  skippedConflict: number;
}

function newSummary(): Summary {
  return { updated: 0, skippedAlreadyClean: 0, skippedConflict: 0 };
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

async function cleanupGastronomias(): Promise<Summary> {
  const summary = newSummary();
  const rows = await prisma.gastronomia.findMany({
    select: { id: true, telefone: true, cnpj: true, responsavelCpf: true },
  });

  const cleanedCnpjCount = new Map<string, number>();
  for (const row of rows) {
    const cleaned = onlyDigits(row.cnpj);
    cleanedCnpjCount.set(cleaned, (cleanedCnpjCount.get(cleaned) ?? 0) + 1);
  }

  for (const row of rows) {
    const data: Record<string, string> = {};

    const cleanedTelefone = onlyDigits(row.telefone);
    if (cleanedTelefone !== row.telefone) data.telefone = cleanedTelefone;

    const cleanedCpf = onlyDigits(row.responsavelCpf);
    if (cleanedCpf !== row.responsavelCpf) data.responsavelCpf = cleanedCpf;

    const cleanedCnpj = onlyDigits(row.cnpj);
    if (cleanedCnpj !== row.cnpj) {
      if ((cleanedCnpjCount.get(cleanedCnpj) ?? 0) > 1) {
        console.warn(
          `⚠️  gastronomias: conflito de CNPJ ao limpar id=${row.id} ("${row.cnpj}" -> "${cleanedCnpj}"). Pulado, revise manualmente.`,
        );
        summary.skippedConflict += 1;
      } else {
        data.cnpj = cleanedCnpj;
      }
    }

    if (Object.keys(data).length === 0) {
      summary.skippedAlreadyClean += 1;
      continue;
    }

    await prisma.gastronomia.update({ where: { id: row.id }, data });
    summary.updated += 1;
  }

  return summary;
}

async function cleanupHospedagens(): Promise<Summary> {
  const summary = newSummary();
  const rows = await prisma.hospedagem.findMany({
    select: { id: true, telefone: true, cnpj: true, responsavelCpf: true },
  });

  const cleanedCnpjCount = new Map<string, number>();
  for (const row of rows) {
    const cleaned = onlyDigits(row.cnpj);
    cleanedCnpjCount.set(cleaned, (cleanedCnpjCount.get(cleaned) ?? 0) + 1);
  }

  for (const row of rows) {
    const data: Record<string, string> = {};

    const cleanedTelefone = onlyDigits(row.telefone);
    if (cleanedTelefone !== row.telefone) data.telefone = cleanedTelefone;

    const cleanedCpf = onlyDigits(row.responsavelCpf);
    if (cleanedCpf !== row.responsavelCpf) data.responsavelCpf = cleanedCpf;

    const cleanedCnpj = onlyDigits(row.cnpj);
    if (cleanedCnpj !== row.cnpj) {
      if ((cleanedCnpjCount.get(cleanedCnpj) ?? 0) > 1) {
        console.warn(
          `⚠️  hospedagens: conflito de CNPJ ao limpar id=${row.id} ("${row.cnpj}" -> "${cleanedCnpj}"). Pulado, revise manualmente.`,
        );
        summary.skippedConflict += 1;
      } else {
        data.cnpj = cleanedCnpj;
      }
    }

    if (Object.keys(data).length === 0) {
      summary.skippedAlreadyClean += 1;
      continue;
    }

    await prisma.hospedagem.update({ where: { id: row.id }, data });
    summary.updated += 1;
  }

  return summary;
}

async function cleanupServicosTurista(): Promise<Summary> {
  const summary = newSummary();
  const rows = await prisma.servicoTurista.findMany({
    select: { id: true, telefone: true, cnpj: true },
  });

  for (const row of rows) {
    const data: Record<string, string> = {};

    const cleanedTelefone = onlyDigits(row.telefone);
    if (cleanedTelefone !== row.telefone) data.telefone = cleanedTelefone;

    if (row.cnpj) {
      const cleanedCnpj = onlyDigits(row.cnpj);
      if (cleanedCnpj !== row.cnpj) data.cnpj = cleanedCnpj;
    }

    if (Object.keys(data).length === 0) {
      summary.skippedAlreadyClean += 1;
      continue;
    }

    await prisma.servicoTurista.update({ where: { id: row.id }, data });
    summary.updated += 1;
  }

  return summary;
}

async function cleanupCasasDeCambio(): Promise<Summary> {
  const summary = newSummary();
  const rows = await prisma.casaDeCambio.findMany({
    select: { id: true, telefone: true },
  });

  for (const row of rows) {
    const cleanedTelefone = onlyDigits(row.telefone);
    if (cleanedTelefone === row.telefone) {
      summary.skippedAlreadyClean += 1;
      continue;
    }

    await prisma.casaDeCambio.update({
      where: { id: row.id },
      data: { telefone: cleanedTelefone },
    });
    summary.updated += 1;
  }

  return summary;
}

async function main() {
  console.log("\n🧹 Limpando telefone/CNPJ/CPF salvos com formatação...\n");

  const results: Record<string, Summary> = {
    gastronomias: await cleanupGastronomias(),
    hospedagens: await cleanupHospedagens(),
    servicos_turista: await cleanupServicosTurista(),
    casas_de_cambio: await cleanupCasasDeCambio(),
  };

  console.log("✅ Resumo:");
  for (const [table, summary] of Object.entries(results)) {
    console.log(
      `   ${table}: ${summary.updated} corrigido(s), ${summary.skippedAlreadyClean} já limpo(s), ${summary.skippedConflict} com conflito de CNPJ (revisar manualmente)`,
    );
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error("\n❌ Erro ao executar a limpeza:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
