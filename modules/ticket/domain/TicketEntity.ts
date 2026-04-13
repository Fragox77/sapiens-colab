import { Ticket } from "@sapiens/types";

export class TicketEntity {
  constructor(private readonly data: Ticket) {}

  toJSON(): Ticket {
    return this.data;
  }
}