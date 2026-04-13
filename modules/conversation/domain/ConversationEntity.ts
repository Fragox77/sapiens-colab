import { Conversation } from "@sapiens/types";

export class ConversationEntity {
  constructor(private readonly data: Conversation) {}

  toJSON(): Conversation {
    return this.data;
  }
}
