// ─── SAPIENS COLAB — Seed de datos de prueba ──────────────────────────────
// Uso: npm run seed
// Crea: 1 admin, 2 diseñadores, 2 clientes con proyectos de ejemplo

require('dotenv').config()
const mongoose = require('mongoose')

const User        = require('../models/User')
const Project     = require('../models/Project')
const Application = require('../models/Application')
const Feedback    = require('../models/Feedback')
const ActivityLog = require('../models/ActivityLog')
const { calcular } = require('./cotizador')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sapiens-colab' })
  console.log('✅ MongoDB conectado')

  // Limpiar colecciones
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Application.deleteMany({}),
    Feedback.deleteMany({}),
    ActivityLog.deleteMany({}),
  ])
  console.log('🗑  Colecciones limpiadas')

  // ─── Usuarios — se crean individualmente para que el hook pre('save') haga el hash ──
  // tenantId del admin = su propio _id (es el dueño de la instancia)
  // diseñadores y clientes heredan el tenantId del admin
  const admin = await User.create({ name: 'Jhon Admin',         email: 'admin@sapienscolab.com', password: 'Admin123!',   role: 'admin' })
  await User.findByIdAndUpdate(admin._id, { tenantId: admin._id.toString() })
  admin.tenantId = admin._id.toString()

  const d1    = await User.create({ name: 'Laura Diseñadora',   email: 'laura@sapienscolab.com', password: 'Laura123!',   role: 'disenador', level: 8, specialty: 'Branding',       portfolio: 'https://behance.net/laura',   isAvailable: true, tenantId: admin._id.toString() })
  const d2    = await User.create({ name: 'Carlos Motion',      email: 'carlos@sapienscolab.com',password: 'Carlos123!',  role: 'disenador', level: 6, specialty: 'Video & Motion', portfolio: 'https://behance.net/carlos', isAvailable: true, tenantId: admin._id.toString() })
  const c1    = await User.create({ name: 'Empresa TechCo',     email: 'techco@empresa.com',     password: 'Cliente123!', role: 'cliente',   company: 'TechCo S.A.S',          phone: '+57 310 123 4567', tenantId: admin._id.toString() })
  const c2    = await User.create({ name: 'Restaurante Sabor',  email: 'sabor@restaurante.com',  password: 'Cliente123!', role: 'cliente',   company: 'Restaurante El Sabor',  phone: '+57 315 987 6543', tenantId: admin._id.toString() })

  console.log('👥 Usuarios creados')

  // ─── Proyectos ────────────────────────────────────────────────────────────
  const p1Pricing = calcular({ serviceType: 'branding',     complexity: 'avanzada', urgency: 'normal' })
  const p2Pricing = calcular({ serviceType: 'video-motion', complexity: 'media',    urgency: 'prioritario' })
  const p3Pricing = calcular({ serviceType: 'piezas',       complexity: 'basica',   urgency: 'normal' })
  const p4Pricing = calcular({ serviceType: 'web',          complexity: 'media',    urgency: 'normal' })

  const seededProjects = await Project.create([
    // Proyecto completado — muestra el flujo completo
    {
      client: c1._id, designer: d1._id,
      clientId: c1._id,
      assignedTo: d1._id,
      title: 'Identidad de marca TechCo',
      description: 'Necesitamos branding completo: logo, paleta de colores, tipografía y manual de marca para startup de tecnología.',
      serviceType: 'branding', complexity: 'avanzada', urgency: 'normal',
      format: 'PDF editable, PNG transparente, AI vectorial',
      pricing: p1Pricing,
      price: p1Pricing.total,
      cost: p1Pricing.designerPay,
      status: 'completado',
      startedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      minDesignerLevel: 7,
      deliverables: [{ url: 'https://drive.google.com/ejemplo', name: 'Branding_TechCo_v3.pdf', uploadedAt: new Date(), round: 3 }],
      revisions: { used: 2, max: 2, extra: 0 },
      payments: { anticipo: { paid: true, paidAt: new Date() }, balance: { paid: true, paidAt: new Date() } },
      completedAt: new Date(),
      timeline: [
        { action: 'CREADO', by: c1._id },
        { action: 'ASIGNADO', by: admin._id, message: `Asignado a ${d1.name}` },
        { action: 'ENTREGABLE_SUBIDO', by: d1._id, message: 'Ronda 1' },
        { action: 'REVISION_SOLICITADA', by: c1._id, message: 'Ajustar colores del logo' },
        { action: 'ENTREGABLE_SUBIDO', by: d1._id, message: 'Ronda 2' },
        { action: 'REVISION_SOLICITADA', by: c1._id, message: 'Pequeños ajustes en tipografía' },
        { action: 'ENTREGABLE_SUBIDO', by: d1._id, message: 'Ronda 3' },
        { action: 'APROBADO_POR_CLIENTE', by: c1._id },
        { action: 'COMPLETADO', by: admin._id },
      ],
    },
    // Proyecto en revisión
    {
      client: c2._id, designer: d2._id,
      clientId: c2._id,
      assignedTo: d2._id,
      title: 'Reels para campaña de verano',
      description: 'Necesitamos 3 reels para Instagram sobre nuestros platos especiales de verano. Estilo moderno, colores cálidos.',
      serviceType: 'video-motion', complexity: 'media', urgency: 'prioritario',
      format: 'MP4 1080x1920 (vertical), máx 30s por reel',
      pricing: p2Pricing,
      price: p2Pricing.total,
      cost: p2Pricing.designerPay,
      status: 'revision',
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      minDesignerLevel: 4,
      deliverables: [{ url: 'https://drive.google.com/ejemplo2', name: 'Reels_verano_v1.zip', uploadedAt: new Date(), round: 1 }],
      revisions: { used: 0, max: 2, extra: 0 },
      payments: { anticipo: { paid: true, paidAt: new Date() }, balance: { paid: false } },
      timeline: [
        { action: 'CREADO', by: c2._id },
        { action: 'ASIGNADO', by: admin._id, message: `Asignado a ${d2.name}` },
        { action: 'ENTREGABLE_SUBIDO', by: d2._id, message: 'Ronda 1' },
      ],
    },
    // Proyecto cotizado — esperando asignación
    {
      client: c1._id,
      clientId: c1._id,
      title: 'Piezas para redes sociales — Lanzamiento',
      description: 'Kit de 10 piezas para el lanzamiento de nuestro nuevo producto. Necesitamos stories, feed y banner para LinkedIn.',
      serviceType: 'piezas', complexity: 'basica', urgency: 'normal',
      format: 'PNG 1080x1080, 1080x1920, 1200x628',
      pricing: p3Pricing,
      price: p3Pricing.total,
      cost: p3Pricing.designerPay,
      status: 'cotizado',
      minDesignerLevel: 1,
      revisions: { used: 0, max: 2, extra: 0 },
      payments: { anticipo: { paid: false }, balance: { paid: false } },
      timeline: [{ action: 'CREADO', by: c1._id }],
    },
    // Proyecto activo
    {
      client: c2._id, designer: d1._id,
      clientId: c2._id,
      assignedTo: d1._id,
      title: 'Sitio web para Restaurante El Sabor',
      description: 'Landing page con menú digital, reservas y galería de platos. Diseño elegante y cálido que refleje nuestra identidad.',
      serviceType: 'web', complexity: 'media', urgency: 'normal',
      format: 'Diseño Figma + handoff para desarrollo',
      pricing: p4Pricing,
      price: p4Pricing.total,
      cost: p4Pricing.designerPay,
      status: 'activo',
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      minDesignerLevel: 4,
      revisions: { used: 0, max: 2, extra: 0 },
      payments: { anticipo: { paid: true, paidAt: new Date() }, balance: { paid: false } },
      timeline: [
        { action: 'CREADO', by: c2._id },
        { action: 'ASIGNADO', by: admin._id, message: `Asignado a ${d1.name}` },
      ],
    },
  ])

  console.log('📦 Proyectos creados')

  await Feedback.create([
    {
      project: seededProjects[0]._id,
      client: c1._id,
      designer: d1._id,
      rating: 5,
      nps: 9,
      comment: 'Excelente ejecución y comunicación.',
    },
    {
      project: seededProjects[1]._id,
      client: c2._id,
      designer: d2._id,
      rating: 4,
      nps: 8,
      comment: 'Muy buena calidad, aun en revisión.',
    },
  ])

  await ActivityLog.create([
    { userId: c1._id, projectId: seededProjects[0]._id, actorRole: 'cliente', eventType: 'project_created' },
    { userId: admin._id, projectId: seededProjects[0]._id, actorRole: 'admin', eventType: 'project_assigned' },
    { userId: d1._id, projectId: seededProjects[0]._id, actorRole: 'disenador', eventType: 'deliverable_uploaded', durationMinutes: 240 },
    { userId: c1._id, projectId: seededProjects[0]._id, actorRole: 'cliente', eventType: 'project_approved' },
    { userId: admin._id, projectId: seededProjects[0]._id, actorRole: 'admin', eventType: 'project_completed' },
    { userId: c2._id, projectId: seededProjects[1]._id, actorRole: 'cliente', eventType: 'feedback_submitted' },
  ])

  console.log('📈 Feedback y actividad creados')

  // ─── Postulaciones de ejemplo ─────────────────────────────────────────────
  await Application.create([
    {
      name: 'Ana García',
      email: 'ana.garcia@email.com',
      phone: '+57 312 000 0001',
      city: 'Bucaramanga',
      role: 'diseñador-grafico',
      experience: '2-5',
      availability: 'tiempo-completo',
      portfolio: 'https://behance.net/ana',
      motivation: 'Me apasiona el branding y quiero crecer en una agencia con proyectos de calidad.',
      status: 'recibida',
    },
    {
      name: 'Miguel Torres',
      email: 'miguel.torres@email.com',
      phone: '+57 313 000 0002',
      city: 'Bogotá',
      role: 'video-motion',
      experience: '5-10',
      availability: 'freelance',
      portfolio: 'https://vimeo.com/miguel',
      motivation: 'Especialista en motion graphics con 7 años de experiencia en publicidad.',
      status: 'en-evaluacion',
      scores: { experiencia: 8, portafolio: 9, prueba: null, estrategia: 7, softSkills: 8 },
      level: 8,
      payRange: '$3.5M–$5M',
    },
  ])

  console.log('📋 Postulaciones creadas')

  console.log('\n✅ SEED COMPLETADO')
  console.log('─────────────────────────────────')
  console.log('CREDENCIALES DE PRUEBA:')
  console.log('  Admin:     admin@sapienscolab.com  / Admin123!')
  console.log('  Diseñador: laura@sapienscolab.com  / Laura123!')
  console.log('  Diseñador: carlos@sapienscolab.com / Carlos123!')
  console.log('  Cliente:   techco@empresa.com      / Cliente123!')
  console.log('  Cliente:   sabor@restaurante.com   / Cliente123!')
  console.log('─────────────────────────────────\n')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed fallido:', err.message)
  process.exit(1)
})
