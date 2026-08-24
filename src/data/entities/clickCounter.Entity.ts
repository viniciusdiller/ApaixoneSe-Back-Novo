export class ClickCounter {
  public id?: string;
  public categoria: string;
  public pagina: string;
  public data: Date;
  public total: number;

  constructor(
    props: Omit<ClickCounter, "id">,
    id?: string,
  ) {
    this.categoria = props.categoria;
    this.pagina = props.pagina;
    this.data = props.data;
    this.total = props.total;
    this.id = id;
  }
}
