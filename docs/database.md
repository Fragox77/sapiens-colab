# Database Design

## Engine
- PostgreSQL 16

## Core principles
- Strong tenant partition via `tenant_id` on domain tables.
- FK constraints to guarantee relational integrity.
- JSONB for metadata and workflow definitions.

## Main tables
- tenants
- users
- conversations
- messages
- workflows
- tickets
- knowledge_documents
- audit_logs

## Index strategy
- Tenant-scoped indexes in all business tables.
- Additional index on `messages(conversation_id)` for chat timelines.
- Composite index on `workflows(tenant_id, trigger)` for fast automation lookup.

Schema file: `database/schema.sql`.