import { Evento } from "./evento.Entity";

describe("Evento (entidade)", () => {
  const propsValidas = {
    titulo: "Saquarema Country Fest",
    descricao: "O maior evento country da região dos lagos.",
    data: new Date("2026-04-01T20:00:00Z"),
    local: "Parque de Exposições",
  };

  it("cria um evento válido com apenas a data de início (dia específico)", () => {
    const evento = new Evento(propsValidas);

    expect(evento.data).toEqual(propsValidas.data);
    expect(evento.dataFim).toBeUndefined();
  });

  it("cria um evento válido com período (início e fim)", () => {
    const dataFim = new Date("2026-04-03T23:00:00Z");
    const evento = new Evento({ ...propsValidas, dataFim });

    expect(evento.data).toEqual(propsValidas.data);
    expect(evento.dataFim).toEqual(dataFim);
  });

  it("cria um evento válido quando dataFim é explicitamente null", () => {
    const evento = new Evento({ ...propsValidas, dataFim: null });

    expect(evento.dataFim).toBeNull();
  });

  it("aceita um período de um único dia (dataFim igual à data de início)", () => {
    const evento = new Evento({ ...propsValidas, dataFim: propsValidas.data });

    expect(evento.dataFim).toEqual(propsValidas.data);
  });

  it("rejeita dataFim anterior à data de início", () => {
    const dataFim = new Date("2026-03-30T00:00:00Z");

    expect(() => new Evento({ ...propsValidas, dataFim })).toThrow(
      "A data final do evento não pode ser anterior à data de início.",
    );
  });

  it("rejeita dataFim inválida", () => {
    expect(
      () => new Evento({ ...propsValidas, dataFim: new Date("data-invalida") }),
    ).toThrow("A data final do evento é inválida.");
  });

  it("rejeita título vazio", () => {
    expect(() => new Evento({ ...propsValidas, titulo: "  " })).toThrow(
      "O título do evento é obrigatório.",
    );
  });

  it("rejeita descrição vazia", () => {
    expect(() => new Evento({ ...propsValidas, descricao: "" })).toThrow(
      "A descrição do evento é obrigatória.",
    );
  });

  it("rejeita ausência de data de início", () => {
    expect(
      () => new Evento({ ...propsValidas, data: undefined as unknown as Date }),
    ).toThrow("A data do evento é obrigatória.");
  });

  it("rejeita data de início inválida", () => {
    expect(
      () => new Evento({ ...propsValidas, data: new Date("data-invalida") }),
    ).toThrow("A data do evento é inválida.");
  });
});
