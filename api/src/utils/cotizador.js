// ─── SAPIENS COLAB — Motor de cotización ───────────────────────────────────
// Refleja exactamente el modelo financiero del doc operativo

const COMMISSION_RATE = 0.25; // 25% Sapiens
const IVA_RATE = 0.19;
const RETE_FUENTE_CLIENT = 0.015;
const RETE_FUENTE_DESIGNER = 0.11;

const SERVICES = [
  { id: 'branding',      name: 'Identidad de marca',         base: 850000,  tag: 'Branding' },
  { id: 'piezas',        name: 'Piezas y materiales',        base: 320000,  tag: 'Diseño gráfico' },
  { id: 'video-motion',  name: 'Reels y animaciones',        base: 480000,  tag: 'Video & Motion' },
  { id: 'fotografia',    name: 'Foto de producto y marca',   base: 600000,  tag: 'Fotografía' },
  { id: 'social-media',  name: 'Community management',       base: 750000,  tag: 'Social Media' },
  { id: 'web',           name: 'Desarrollo web',             base: 1400000, tag: 'Web' },
  { id: 'campana',       name: 'Campaña publicitaria 360°',  base: 3000000, tag: 'Campaña' },
];

const COMPLEXITY_MULT = { basica: 1.0, media: 1.4, avanzada: 2.0 };
const URGENCY_MULT    = { normal: 1.0, prioritario: 1.25, express: 1.5 };

/**
 * Calcula el desglose financiero completo de un proyecto.
 * @param {{ serviceType, complexity, urgency }} params
 * @returns pricing object
 */
function calcular({ serviceType, complexity = 'media', urgency = 'normal' }) {
  const service = SERVICES.find(s => s.id === serviceType);
  if (!service) throw new Error(`Servicio "${serviceType}" no reconocido`);

  const compMult = COMPLEXITY_MULT[complexity] ?? 1.0;
  const urgMult  = URGENCY_MULT[urgency] ?? 1.0;

  const base      = service.base;
  const subtotal  = Math.round(base * compMult * urgMult);
  const iva       = Math.round(subtotal * IVA_RATE);
  const total     = subtotal + iva;
  const anticipo  = Math.round(total * 0.5);
  const balance   = total - anticipo;

  // Lo que cobra el diseñador (neto después de comisión Sapiens y reteFuente)
  const sapiensCut    = Math.round(subtotal * COMMISSION_RATE);
  const designerGross = subtotal - sapiensCut;
  const reteFuente    = Math.round(designerGross * RETE_FUENTE_DESIGNER);
  const designerPay   = designerGross - reteFuente;

  return {
    base,
    complexityMult: compMult,
    urgencyMult: urgMult,
    subtotal,
    iva,
    total,
    anticipo,
    balance,
    commission: sapiensCut,
    designerGross,
    reteFuente,
    designerPay,
  };
}

function calcularPagoDisenador(subtotal) {
  const sapiensCut    = Math.round(subtotal * COMMISSION_RATE);
  const designerGross = subtotal - sapiensCut;
  const reteFuente    = Math.round(designerGross * RETE_FUENTE_DESIGNER);
  return designerGross - reteFuente;
}

module.exports = { SERVICES, calcular, calcularPagoDisenador, COMMISSION_RATE, IVA_RATE };
