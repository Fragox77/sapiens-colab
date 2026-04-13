require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./src/config/db');

const app = express();
const server = http.createServer(app);

// ─── WebSocket ───────────────────────────────────────────────
const wss = new WebSocket.Server({ server });
const clients = new Map(); // userId → ws

wss.on('connection', (ws, req) => {
  ws.on('message', (msg) => {
    try {
      const { userId } = JSON.parse(msg);
      if (userId) clients.set(userId, ws);
    } catch (_) {}
  });
  ws.on('close', () => {
    clients.forEach((c, id) => { if (c === ws) clients.delete(id); });
  });
});

// Exportar para notificar desde rutas
app.locals.notifyUser = (userId, payload) => {
  const ws = clients.get(String(userId));
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
}));

// ─── Rutas ────────────────────────────────────────────────────
app.use('/api/auth',     require('./src/routes/auth'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api/users',    require('./src/routes/users'));
app.use('/api/admin',    require('./src/routes/admin'));
app.use('/api/services', require('./src/routes/services'));
app.use('/api/quotes',   require('./src/routes/quotes'));
app.use('/api/applications', require('./src/routes/applications'));
app.use('/api/upload',      require('./src/routes/upload'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// 404
app.use((_, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// ─── Arrancar ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`🔌 WebSocket listo`);
  });
});
