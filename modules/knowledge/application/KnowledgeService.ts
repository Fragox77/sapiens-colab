export class KnowledgeService {
  async indexDocument(tenantId: string, title: string): Promise<{ tenantId: string; title: string }> {
    return { tenantId, title };
  }
}
