export interface QueryResult<T = unknown> {
  rows: T[];
}

export interface DatabaseClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}