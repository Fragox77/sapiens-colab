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
    projectId: string
    leadStatus: 'nuevo' | 'contactado' | 'calificado' | 'convertido' | 'descartado'
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
    }
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
  leadScore: number
  source?: string
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

export interface ApplicationScores {
  experiencia?: number
  portafolio?:  number
  prueba?:      number
  estrategia?:  number
  softSkills?:  number
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
