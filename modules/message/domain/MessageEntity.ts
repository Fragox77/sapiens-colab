import { Message } from "@sapiens/types";

export class MessageEntity {
  constructor(private readonly data: Message) {}

  toJSON(): Message {
    return this.data;
  }
}
