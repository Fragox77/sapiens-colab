// ─── SAPIENS COLAB — Types ─────────────────────────────────────────────────

export type Role = 'cliente' | 'disenador' | 'admin'

export interface User {
  _id: string
  name: string
  email: string
  role: Role
  level?: number
  specialty?: string
  portfolio?: string
  company?: string
  phone?: string
  isActive: boolean
  isAvailable?: boolean
  createdAt: string
}

export type ServiceType =
  | 'branding' | 'piezas' | 'video-motion'
  | 'fotografia' | 'social-media' | 'web' | 'campana'

export type Complexity = 'basica' | 'media' | 'avanzada'
export type Urgency    = 'normal' | 'prioritario' | 'express'
export type LeadStage =
  | 'NUEVO'
  | 'CONTACTO_INICIAL'
  | 'PROPUESTA_ENVIADA'
  | 'NEGOCIACION'
  | 'CERRADO_GANADO'
  | 'CERRADO_PERDIDO'

export type ProjectStatus =
  | 'cotizado' | 'activo' | 'revision'
  | 'ajuste' | 'aprobado' | 'completado' | 'cancelado'

export interface Pricing {
  base: number
  subtotal: number
  iva: number
  total: number
  anticipo: number
  balance: number
  commission: number
  designerPay: number
}

export interface TimelineEvent {
  action: string
  by: string | User
  message?: string
  createdAt: string
}

export interface Project {
  _id: string
  client: User
  designer?: User
  title: string
  description: string
  serviceType: ServiceType
  complexity: Complexity
  urgency: Urgency
  format: string
  pricing: Pricing
  status: ProjectStatus
  revisions: { used: number; max: number; extra: number }
  deliverables: Array<{ url: string; name: string; uploadedAt: string; round: number }>
  finalFiles: Array<{ url: string; name: string; uploadedAt: string }>
  deadlineAt?: string
  completedAt?: string
  payments: {
    anticipo: { paid: boolean; paidAt?: string }
    balance:  { paid: boolean; paidAt?: string }
  }
  timeline: TimelineEvent[]
  minDesignerLevel: number
  createdAt: string
}

export interface QuoteResult {
  base: number
  subtotal: number
  iva: number
  total: number
  anticipo: number
  balance: number
  commission: number
}

export interface QuoteLeadInput {
  name: string
  email: string
  company?: string
}

export interface QuoteCreationResponse {
  success: boolean
  message: string
  data: {
    quoteId: string
    projectId: string | null
    leadStatus: 'nuevo' | 'contactado' | 'calificado' | 'convertido' | 'descartado'
    stage?: LeadStage
    leadScore: number
    pricing: Pricing
    project: {
      _id: string
      title: string
      status: ProjectStatus
      serviceType: ServiceType
      complexity: Complexity
      urgency: Urgency
      createdAt: string
    } | null
  }
}

export interface Quote {
  _id: string
  client: {
    name: string
    email: string
    company?: string
  }
  serviceType: ServiceType
  complexity: Complexity
  urgency: Urgency
  pricing: Pricing
  leadStatus: 'nuevo' | 'contactado' | 'calificado' | 'convertido' | 'descartado'
  stage?: LeadStage
  leadScore: number
  source?: string
  crm?: {
    owner?: string
    tags?: string[]
    nextActionAt?: string | null
    activities?: Array<{
      _id?: string
      type: string
      message: string
      byId?: string | null
      byName?: string
      at: string
    }>
    tasks?: Array<{
      _id: string
      title: string
      status: 'pendiente' | 'completada'
      dueAt?: string | null
      ownerId?: string | null
      ownerName?: string
      createdAt?: string
      completedAt?: string | null
    }>
    notes?: Array<{
      message: string
      authorId?: string
      authorName?: string
      at: string
    }>
  }
  createdAt: string
  updatedAt?: string
  project?: {
    _id: string
    title: string
    status: ProjectStatus
    serviceType?: ServiceType
    complexity?: Complexity
    urgency?: Urgency
    createdAt?: string
  }
}

export interface CrmKpis {
  totalLeads: number
  wonLeads: number
  conversionRate: number
  pipelineValue: number
  leadsByStage: Record<LeadStage, number>
  pendingTasks: number
  overdueTasks: number
  stalledLeads: number
  slaComplianceRate: number
  agingByStage: Record<LeadStage, { count: number; avgDays: number; maxDays: number }>
  alerts: Array<{
    quoteId: string
    leadName: string
    stage: LeadStage
    ageHours: number
    overdueTasks: number
    severity: 'high' | 'medium' | 'low'
  }>
}

export interface CrmTimeline {
  quoteId: string
  stage?: LeadStage
  leadStatus: 'nuevo' | 'contactado' | 'calificado' | 'convertido' | 'descartado'
  activities: Array<{
    _id?: string
    type: string
    message: string
    byId?: string | null
    byName?: string
    at: string
  }>
  notes: Array<{
    message: string
    authorId?: string
    authorName?: string
    at: string
  }>
  tasks: Array<{
    _id: string
    title: string
    status: 'pendiente' | 'completada'
    dueAt?: string | null
    ownerId?: string | null
    ownerName?: string
    createdAt?: string
    completedAt?: string | null
  }>
}

export interface ApplicationScores {
  experiencia?: number
  portafolio?:  number
  prueba?:      number
  estrategia?:  number
  softSkills?:  number
}

export type ApplicationEstado = 'pendiente' | 'en_prueba' | 'evaluado' | 'aprobado' | 'descartado'

export interface ApplicationEvaluacionPilar {
  puntaje: number
  nota?: string
}

export interface ApplicationEvaluacion {
  experiencia?:            ApplicationEvaluacionPilar
  portafolio?:             ApplicationEvaluacionPilar
  pruebaPractica?:         ApplicationEvaluacionPilar
  pensamientoEstrategico?: ApplicationEvaluacionPilar
  softSkills?:             ApplicationEvaluacionPilar
  nivelCalculado?: number
  rangoPago?:      string
  evaluadoAt?:     string
  evaluadoPor?:    string | User
}

export interface Application {
  _id: string
  name: string
  email: string
  phone: string
  city: string
  role: string
  experience: string
  availability: string
  portfolio?: string
  motivation: string
  status: 'recibida' | 'en-evaluacion' | 'prueba-enviada' | 'evaluada' | 'aceptada' | 'rechazada'
  scores: ApplicationScores
  level?: number
  payRange?: string
  briefAssigned?: string
  notes?: string
  userId?: string | User
  createdAt: string
  // Nuevos campos
  tools?:           string[]
  source?:          string
  experienceYears?: number
  workDescription?: string
  estado?:          ApplicationEstado
  briefPrueba?:     string
  fechaLimitePrueba?: string
  entregaPrueba?:   string
  evaluacion?:      ApplicationEvaluacion
  timeline?:        Array<{ estado: string; nota?: string; by?: string | User; at: string }>
}

export interface FinancieroKpis {
  totalFacturado: number
  comisionSapiens: number
  pagadoDisenadores: number
  pipelineTotal: number
  anticiposPendientes: number
  balancesPendientes: number
  totalProyectos: number
  proyectosActivos: number
}

export interface DeudaDisenador {
  designer: User
  proyectos: { id: string; title: string; pay: number }[]
  totalDeuda: number
}

export interface IngresoMes {
  _id: { year: number; month: number }
  ingresos: number
  utilidad: number
  proyectos: number
}

export interface FinancieroProject {
  _id: string
  title: string
  status: ProjectStatus
  client: User
  designer?: User
  pricing: Pricing
  payments: {
    anticipo: { paid: boolean; paidAt?: string }
    balance:  { paid: boolean; paidAt?: string }
  }
  createdAt: string
  completedAt?: string
}

export interface FinancieroReport {
  kpis: FinancieroKpis
  proyectos: FinancieroProject[]
  deudaDisenadores: DeudaDisenador[]
  ingresosPorMes: IngresoMes[]
}

export interface WeeklyMetricPoint {
  label: string
  revenue: number
  cost: number
  completedProjects: number
}

export interface StatusMetricPoint {
  status: string
  count: number
}

export interface CollaboratorMetric {
  designerId: string
  name: string
  level: number
  specialty: string
  assignedProjects: number
  completedProjects: number
  avgDeliveryDays: number
  avgRating: number
  ratingsCount: number
  completionRatePct: number
  onTimeRatePct: number
  performanceScore: number
}

export interface DashboardMetrics {
  period: { from: string; to: string }
  business: {
    revenueTotal: number
    averageTicket: number
    marginPct: number
  }
  operation: {
    activeProjects: number
    completionRatePct: number
    avgDeliveryDays: number
    delayedProjects: number
    delayRatePct: number
  }
  talent: {
    projectsPerDesignerAvg: number
    avgDeliveryDaysPerDesigner: number
    topPerformers: CollaboratorMetric[]
  }
  client: {
    satisfactionAvg: number
    repurchaseRatePct: number
  }
  charts: {
    statusDistribution: StatusMetricPoint[]
    weeklyEvolution: WeeklyMetricPoint[]
  }
}

export interface PerformanceMetrics {
  period: { from: string; to: string }
  operation: {
    activeProjects: number
    completionRatePct: number
    avgDeliveryDays: number
    delayedProjects: number
    delayRatePct: number
  }
  talent: {
    projectsPerDesignerAvg: number
    avgDeliveryDaysPerDesigner: number
    ranking: CollaboratorMetric[]
  }
  client: {
    satisfactionAvg: number
    repurchaseRatePct: number
  }
}

export interface DashboardStats {
  operation: {
    activeProjects: number
    completionRatePct: number | null
    onTimeRatePct: number | null
  }
  clients: {
    satisfactionAvg: number | null
    repurchaseRatePct: number | null
    avgRevisions: number | null
  }
  team: {
    topCollaborator: string | null
    avgDeliveryDays: number | null
    projectsPerDesigner: number | null
  }
}

// ─── Finanzas colaborador ──────────────────────────────────────
export interface ColaboradorFinanzasKpis {
  totalGanado: number
  porCobrar: number
  anticiposRecibidos: number
  proyectosCompletados: number
}

export interface ColaboradorProyecto {
  id: string
  nombre: string
  cliente: string
  valorTotal: number
  comisionAgencia: number
  retefuente: number
  neto: number
  anticipoRecibido: number
  saldoPendiente: number
  estado: 'activo' | 'completado' | 'liquidado'
  fechaEntrega?: string | null
}

export interface ColaboradorLiquidacion {
  fecha: string
  monto: number
  comprobante: string
}

export interface ColaboradorFinanzasResumen {
  kpis: ColaboradorFinanzasKpis
  proyectos: ColaboradorProyecto[]
  liquidaciones: ColaboradorLiquidacion[]
}

// ─── Finanzas admin ────────────────────────────────────────────
export interface FinanzasKpis {
  facturacionBruta: number
  comisionSapiens: number
  retencionesTotales: number
  utilidadNeta: number
}

export interface ColaboradorFinanzas {
  id: string
  nombre: string
  proyectosActivos: number
  valorBruto: number
  comisionAgencia: number
  retefuente: number
  netoPagar: number
  anticiposPagados: number
  saldoPendiente: number
  estado: 'al_dia' | 'pendiente' | 'liquidado'
}

export interface ProyectoFinanzas {
  id: string
  nombre: string
  cliente: string
  colaborador: string
  colaboradorId: string | null
  valorTotal: number
  comision: number
  netoPagar: number
  anticipoCliente: number
  anticipoColaborador: number
  estado: 'activo' | 'completado' | 'liquidado'
}

export interface FinanzasResumen {
  kpis: FinanzasKpis
  colaboradores: ColaboradorFinanzas[]
  proyectos: ProyectoFinanzas[]
}

export interface FinanceMetrics {
  period: { from: string; to: string }
  business: {
    revenueTotal: number
    averageTicket: number
    marginPct: number
    costTotal: number
    completedCount: number
  }
  weeklyEvolution: WeeklyMetricPoint[]
}

// ─── WhatsApp Briefs ───────────────────────────────────────────
export type BriefUrgencia = 'alta' | 'media' | 'baja'
export type BriefEstado = 'borrador' | 'aprobado' | 'convertido'

export interface BriefCliente {
  nombre: string
  telefono: string
  whatsapp: string
}

export interface Brief {
  id: string
  conversacionId: string
  clienteId: string
  objetivo: string
  entregables: string[]
  referencias: string[]
  tonoMarca: string
  fechaLimite: string
  urgencia: BriefUrgencia
  pendientes: string[]
  respuestaSugerida: string
  estado: BriefEstado
  cliente: BriefCliente
  creadoAt: string
}

export interface BriefDetalle extends Brief {
  mensajes?: Array<{ rol: 'user' | 'assistant'; contenido: string; at: string }>
}
