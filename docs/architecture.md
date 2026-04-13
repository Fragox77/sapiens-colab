# OpenClaw SaaS Architecture (Initial)

## Goal
Build a modular monolith ready to evolve into event-driven services without breaking tenant isolation.

## Structure
- apps/backend: HTTP API and composition root.
- apps/worker: async jobs and queue consumers.
- packages/types: shared entities/contracts.
- packages/shared: cross-cutting utilities and event bus.
- packages/config: shared constants (events/queues).
- modules/*: business modules split by bounded contexts.

## Multi-tenant rule
Every request resolves `tenantId` in middleware and every write/read path must include `tenant_id`.

## Event-driven readiness
The architecture starts with `InMemoryEventBus` and named domain events:
- `message.received`
- `conversation.created`
- `workflow.triggered`
- `ticket.created`

These can later be bridged to Redis Streams, Kafka, or SNS/SQS.