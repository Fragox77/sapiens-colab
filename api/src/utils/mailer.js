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

async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: 'Tu código de acceso — SAPIENS COLAB',
    text:    `Tu código de verificación es: ${otp}\n\nExpira en 5 minutos. No lo compartas.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px">
        <h2 style="color:#4f46e5;margin-bottom:4px">SAPIENS COLAB</h2>
        <p style="color:#374151">Código de verificación para acceso admin:</p>
        <div style="font-size:2.2rem;font-weight:700;letter-spacing:0.35em;padding:20px;
                    background:#f3f4f6;border-radius:10px;text-align:center;color:#111827">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:0.85rem;margin-top:16px">
          Expira en <strong>5 minutos</strong>. No lo compartas con nadie.
        </p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
