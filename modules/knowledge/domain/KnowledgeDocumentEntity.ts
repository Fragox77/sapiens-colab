import { KnowledgeDocument } from "@sapiens/types";

export class KnowledgeDocumentEntity {
  constructor(private readonly data: KnowledgeDocument) {}

  toJSON(): KnowledgeDocument {
    return this.data;
  }
}