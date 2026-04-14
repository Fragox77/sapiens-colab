import { Router } from "express";
import { InMemoryEventBus } from "@sapiens/shared";
import { db } from "../config/database";

// ── Repositories ────────────────────────────────────────────────────────────
import { TenantRepositoryPg } from "../../../../modules/tenant/infrastructure/TenantRepositoryPg";
import { ConversationRepositoryPg } from "../../../../modules/conversation/infrastructure/ConversationRepositoryPg";
import { MessageRepositoryPg } from "../../../../modules/message/infrastructure/MessageRepositoryPg";
import { WorkflowRepositoryPg } from "../../../../modules/workflow/infrastructure/WorkflowRepositoryPg";
import { AuditRepositoryPg } from "../../../../modules/audit/infrastructure/AuditRepositoryPg";

// ── Services ─────────────────────────────────────────────────────────────────
import { TenantService } from "../../../../modules/tenant/application/TenantService";
import { ConversationService } from "../../../../modules/conversation/application/ConversationService";
import { MessageService } from "../../../../modules/message/application/MessageService";
import { WorkflowService } from "../../../../modules/workflow/application/WorkflowService";

// ── Gateways ─────────────────────────────────────────────────────────────────
import { OpenClawHttpGateway } from "../../../../modules/message/infrastructure/OpenClawHttpGateway";

// ── Controllers & Routes ─────────────────────────────────────────────────────
import { TenantController } from "../../../../modules/tenant/interfaces/tenant.controller";
import { buildTenantRoutes } from "../../../../modules/tenant/interfaces/tenant.routes";
import { ConversationController } from "../../../../modules/conversation/interfaces/conversation.controller";
import { buildConversationRoutes } from "../../../../modules/conversation/interfaces/conversation.routes";
import { MessageController } from "../../../../modules/message/interfaces/message.controller";
import { WorkflowController } from "../../../../modules/workflow/interfaces/workflow.controller";

// ── Composition root ─────────────────────────────────────────────────────────
const eventBus = new InMemoryEventBus();

const tenantRepo       = new TenantRepositoryPg(db);
const conversationRepo = new ConversationRepositoryPg(db);
const messageRepo      = new MessageRepositoryPg(db);
const workflowRepo     = new WorkflowRepositoryPg(db);
new AuditRepositoryPg(db); // disponible para uso futuro

const tenantService       = new TenantService(tenantRepo);
const conversationService = new ConversationService(conversationRepo, eventBus);
const messageService      = new MessageService(messageRepo, eventBus, new OpenClawHttpGateway());
const workflowService     = new WorkflowService(workflowRepo, eventBus);

const tenantController       = new TenantController(tenantService);
const conversationController = new ConversationController(conversationService);
const messageController      = new MessageController(messageService);
const workflowController     = new WorkflowController(workflowService);

// ── Router ────────────────────────────────────────────────────────────────────
export const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, tenantId: req.headers["x-tenant-id"], service: "openclaw-backend" });
});

router.use("/tenants",       buildTenantRoutes(tenantController));
router.use("/conversations", buildConversationRoutes(conversationController));

// Message route inline (no hay buildMessageRoutes aún)
router.post("/messages", (req, res) => void messageController.create(req, res));

// Workflow trigger
router.post("/workflows/trigger", (req, res) => void workflowController.trigger(req, res));