const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   'smtp.resend.com',
  port:   465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'noreply@sapiens-colab.com';
const BASE_URL = process.env.APP_URL || 'https://sapiens-colab.com';

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// ── Utilidad interna ────────────────────────────────────────────────────────
async function send({ to, subject, html }) {
  if (!process.env.SMTP_PASS) return; // No-op en dev si no hay credenciales
  await transporter.sendMail({ from: FROM, to, subject, html });
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <!-- Header -->
        <tr><td style="background:#1E1B4B;padding:28px 36px">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-.3px">SAPIENS COLAB</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 36px 28px">
          <h2 style="margin:0 0 16px;color:#1E1B4B;font-size:20px">${title}</h2>
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid #F0F0F0">
          <p style="margin:0;color:#9CA3AF;font-size:12px">
            SAPIENS COLAB · <a href="${BASE_URL}" style="color:#FF4D6D;text-decoration:none">sapiens-colab.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function btn(url, label) {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:13px 28px;background:#FF4D6D;color:#ffffff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">${label}</a>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:7px 0;color:#6B7280;font-size:14px">${label}</td>
    <td style="padding:7px 0;color:#1E1B4B;font-size:14px;font-weight:600;text-align:right">${value}</td>
  </tr>`;
}

// ── 1. OTP (admin) ──────────────────────────────────────────────────────────
async function sendOtpEmail(to, otp) {
  await send({
    to,
    subject: 'Tu código de acceso — SAPIENS COLAB',
    html: layout('Código de verificación', `
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Código de acceso al panel admin:</p>
      <div style="font-size:2.4rem;font-weight:700;letter-spacing:.35em;padding:20px;
                  background:#F3F4F6;border-radius:10px;text-align:center;color:#111827">${otp}</div>
      <p style="color:#9CA3AF;font-size:13px;margin-top:16px">Expira en <strong>5 minutos</strong>. No lo compartas.</p>
    `),
  });
}

// ── 2. Nuevo proyecto creado → notifica al cliente ──────────────────────────
async function sendProjectCreated({ to, clientName, projectTitle, total, anticipo, projectId }) {
  await send({
    to,
    subject: `Pedido recibido: ${projectTitle} — SAPIENS COLAB`,
    html: layout('¡Tu pedido fue recibido!', `
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${clientName}</strong>, tu pedido ha sido registrado y está en proceso de asignación.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:10px;padding:16px;margin-bottom:8px">
        ${row('Proyecto', projectTitle)}
        ${row('Total', fmt(total))}
        ${row('Anticipo requerido (50%)', fmt(anticipo))}
      </table>
      <p style="color:#6B7280;font-size:13px;margin:16px 0 0">Te notificaremos en cuanto un diseñador sea asignado.</p>
      ${btn(`${BASE_URL}/cliente/${projectId}`, 'Ver mi pedido')}
    `),
  });
}

// ── 3. Diseñador asignado → notifica a cliente y diseñador ─────────────────
async function sendProjectAssigned({ toClient, toDesigner, clientName, designerName, projectTitle, projectId }) {
  const clientHtml = layout('¡Tu proyecto tiene diseñador!', `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${clientName}</strong>, hemos asignado a <strong>${designerName}</strong> a tu proyecto.</p>
    <p style="color:#6B7280;font-size:14px;margin:0 0 20px">Proyecto: <strong style="color:#1E1B4B">${projectTitle}</strong></p>
    <p style="color:#6B7280;font-size:13px">El equipo iniciará la producción a la brevedad.</p>
    ${btn(`${BASE_URL}/cliente/${projectId}`, 'Ver estado del proyecto')}
  `);

  const designerHtml = layout('Nuevo proyecto asignado', `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${designerName}</strong>, tienes un nuevo proyecto.</p>
    <p style="color:#6B7280;font-size:14px;margin:0 0 20px">Proyecto: <strong style="color:#1E1B4B">${projectTitle}</strong></p>
    <p style="color:#6B7280;font-size:13px">Revisa el brief y sube el entregable cuando esté listo.</p>
    ${btn(`${BASE_URL}/disenador/${projectId}`, 'Ver el proyecto')}
  `);

  await Promise.all([
    send({ to: toClient,   subject: `Diseñador asignado: ${projectTitle}`,    html: clientHtml }),
    send({ to: toDesigner, subject: `Nuevo proyecto asignado: ${projectTitle}`, html: designerHtml }),
  ]);
}

// ── 4. Entregable subido → notifica al cliente ──────────────────────────────
async function sendDeliverableReady({ to, clientName, projectTitle, projectId, round }) {
  await send({
    to,
    subject: `Entregable listo para revisión: ${projectTitle}`,
    html: layout('Tu entregable está listo', `
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${clientName}</strong>, el diseñador ha subido el entregable (ronda ${round}) de tu proyecto.</p>
      <p style="color:#6B7280;font-size:14px;margin:0 0 20px">Proyecto: <strong style="color:#1E1B4B">${projectTitle}</strong></p>
      <p style="color:#6B7280;font-size:13px">Tienes hasta 48h para aprobarlo o solicitar ajustes. ¡Revísalo!</p>
      ${btn(`${BASE_URL}/cliente/${projectId}`, 'Revisar entregable')}
    `),
  });
}

// ── 5. Cliente aprueba → notifica al diseñador ──────────────────────────────
async function sendProjectApproved({ to, designerName, projectTitle, designerPay, projectId }) {
  await send({
    to,
    subject: `¡Proyecto aprobado! ${projectTitle}`,
    html: layout('¡El cliente aprobó tu trabajo!', `
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${designerName}</strong>, el cliente aprobó tu entrega.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:10px;padding:16px;margin-bottom:8px">
        ${row('Proyecto', projectTitle)}
        ${row('Tu pago pendiente', fmt(designerPay))}
      </table>
      <p style="color:#6B7280;font-size:13px">El admin procesará tu pago al cerrar el proyecto.</p>
      ${btn(`${BASE_URL}/disenador/${projectId}`, 'Ver proyecto')}
    `),
  });
}

// ── 6. Revisión solicitada → notifica al diseñador ──────────────────────────
async function sendRevisionRequested({ to, designerName, projectTitle, message, projectId, revisionsUsed, revisionsMax }) {
  await send({
    to,
    subject: `Ajustes solicitados: ${projectTitle}`,
    html: layout('El cliente solicitó ajustes', `
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${designerName}</strong>, el cliente necesita cambios en <strong>${projectTitle}</strong>.</p>
      ${message ? `<div style="background:#FFF7ED;border-left:4px solid #FB923C;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:16px;font-size:14px;color:#374151">${message}</div>` : ''}
      <p style="color:#9CA3AF;font-size:13px">Revisión ${revisionsUsed} de ${revisionsMax} usada.</p>
      ${btn(`${BASE_URL}/disenador/${projectId}`, 'Ver los ajustes')}
    `),
  });
}

// ── 7. Proyecto completado → notifica al cliente ────────────────────────────
async function sendProjectCompleted({ to, clientName, projectTitle, projectId }) {
  await send({
    to,
    subject: `Proyecto completado: ${projectTitle} ✓`,
    html: layout('¡Proyecto completado!', `
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${clientName}</strong>, tu proyecto <strong>${projectTitle}</strong> ha sido cerrado exitosamente.</p>
      <p style="color:#6B7280;font-size:13px;margin:0 0 20px">Gracias por confiar en SAPIENS COLAB. ¡Esperamos trabajar contigo de nuevo!</p>
      ${btn(`${BASE_URL}/cliente/${projectId}`, 'Ver resumen del proyecto')}
    `),
  });
}

module.exports = {
  sendOtpEmail,
  sendProjectCreated,
  sendProjectAssigned,
  sendDeliverableReady,
  sendProjectApproved,
  sendRevisionRequested,
  sendProjectCompleted,
};
