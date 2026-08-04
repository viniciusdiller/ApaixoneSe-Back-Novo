import { Injectable, Logger } from "@nestjs/common";

const C = {
  primary: "01696F",
  text: "1A1A1A",
  muted: "6B7280",
};

type PdfLine = { text: string; size?: number; color?: string };

@Injectable()
export class PlanoViagemPdfService {
  private readonly logger = new Logger(PlanoViagemPdfService.name);

  generate(plano: any): Buffer {
    const itens = Array.isArray(plano.itens) ? plano.itens : [];
    this.logger.log(
      `[PlanoViagemPdf] Gerando PDF do plano ${plano.id} com ${itens.length} itens`,
    );

    const lines: PdfLine[] = [
      { text: "APAIXONE-SE", size: 20, color: C.primary },
      { text: "SAQUAREMA / RJ - BR - Capital Nacional do Esporte", size: 10, color: C.muted },
      { text: " ", size: 8 },
      { text: plano.titulo || "Plano de Viagem", size: 18, color: C.text },
      {
        text: `${this.formatDate(plano.dataInicio)} -> ${this.formatDate(plano.dataFim)}`,
        size: 11,
        color: C.muted,
      },
      { text: " ", size: 8 },
    ];

    if (!itens.length) {
      lines.push({ text: "Nenhum item adicionado a este plano.", size: 11, color: C.muted });
    } else {
      const grupos = this.agruparPorData(itens);
      for (const [data, itemsDoDia] of grupos.entries()) {
        lines.push({ text: data, size: 13, color: C.primary });
        for (const item of itemsDoDia) {
          const categoria = this.getCategoriaLabel(item);
          lines.push({
            text: `- [${categoria.label}] ${this.formatDataHora(item.dataHoraAgendada)} - ${categoria.nome}`,
            size: 10,
            color: C.text,
          });
          if (categoria.detalhe) {
            lines.push({ text: `  ${categoria.detalhe}`, size: 9, color: C.muted });
          }
          if (item.anotacao) {
            lines.push({ text: `  Anotacao: ${item.anotacao}`, size: 9, color: "92400E" });
          }
        }
        lines.push({ text: " ", size: 7 });
      }
    }

    lines.push({ text: " ", size: 8 });
    lines.push({
      text: "Este documento e apenas um planejamento - nenhuma reserva foi efetuada.",
      size: 8,
      color: C.muted,
    });

    const buffer = this.buildSimplePdf(lines);
    this.logger.log(
      `[PlanoViagemPdf] PDF do plano ${plano.id} gerado com sucesso: ${buffer.length} bytes`,
    );
    return buffer;
  }

  private formatDate(value: string | Date) {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  private formatDataHora(value: string | Date) {
    try {
      return new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
      });
    } catch {
      return String(value);
    }
  }

  private agruparPorData(itens: any[]) {
    const mapa = new Map<string, any[]>();
    [...itens]
      .sort(
        (a, b) =>
          new Date(a.dataHoraAgendada).getTime() -
          new Date(b.dataHoraAgendada).getTime(),
      )
      .forEach((item) => {
        const chave = new Date(item.dataHoraAgendada).toLocaleDateString("pt-BR", {
          timeZone: "UTC",
        });
        if (!mapa.has(chave)) mapa.set(chave, []);
        mapa.get(chave)!.push(item);
      });
    return mapa;
  }

  private getCategoriaLabel(item: any): { label: string; nome: string; detalhe?: string } {
    if (item.gastronomia)
      return { label: "Restaurante", nome: item.gastronomia.nome, detalhe: item.gastronomia.endereco };
    if (item.hospedagem)
      return { label: "Hospedagem", nome: item.hospedagem.nome, detalhe: item.hospedagem.endereco };
    if (item.evento)
      return { label: "Evento", nome: item.evento.titulo, detalhe: item.evento.local };
    if (item.atividade)
      return { label: "Atividade", nome: item.atividade.titulo, detalhe: item.atividade.local };
    if (item.servicoTurista)
      return { label: "Servico Turistico", nome: item.servicoTurista.nome, detalhe: String(item.servicoTurista.tipo).replace(/_/g, " ") };
    return { label: "Item", nome: "Sem detalhes" };
  }

  private buildSimplePdf(lines: PdfLine[]): Buffer {
    const objects: string[] = [];
    const addObject = (body: string) => {
      objects.push(body);
      return objects.length;
    };

    const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    void catalogId;
    addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");

    const content = this.buildContentStream(lines);
    const contentId = 4;
    addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>");
    addObject(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
    addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    void contentId;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(Buffer.byteLength(pdf, "utf8"));
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, "utf8");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, "utf8");
  }

  private buildContentStream(lines: PdfLine[]) {
    let y = 790;
    const parts = ["BT", "/F1 10 Tf"];
    for (const line of lines) {
      const size = line.size ?? 10;
      if (y < 50) break;
      const rgb = this.hexToRgb(line.color || C.text);
      parts.push(`${rgb} rg`);
      parts.push(`/F1 ${size} Tf`);
      parts.push(`1 0 0 1 44 ${y} Tm (${this.escapePdfText(line.text)}) Tj`);
      y -= Math.max(size + 5, 12);
    }
    parts.push("ET");
    return parts.join("\n");
  }

  private escapePdfText(text: string) {
    return String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  private hexToRgb(hex: string) {
    const normalized = hex.replace("#", "");
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }
}
