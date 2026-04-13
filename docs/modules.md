# Modules Overview

Each module follows the same layer contract:
- `domain`: entities/value objects.
- `application`: use cases/services.
- `infrastructure`: persistence and external adapters.
- `interfaces`: HTTP controllers or inbound adapters.

## Implemented core modules
- tenant
- conversation
- message
- workflow
- audit

## Skeleton modules
- auth
- user
- agent
- ticket
- knowledge

All modules are ready to grow behind stable service interfaces.