const router  = require('express').Router()
const auth    = require('../middleware/auth')
const multer  = require('multer')
const path    = require('path')

// Cloudinary es opcional — si no hay credenciales, el endpoint responde con error claro
let cloudinary = null
let upload = null

const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
                      process.env.CLOUDINARY_API_KEY    &&
                      process.env.CLOUDINARY_API_SECRET

if (hasCloudinary) {
  cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }) // 50MB
}

const ALLOWED_EXT = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mov', '.zip', '.ai', '.psd', '.fig', '.svg']

// Middleware de multer sólo si Cloudinary está disponible
const uploadMiddleware = hasCloudinary
  ? upload.single('file')
  : (_req, _res, next) => next()

// POST /api/upload — sube un archivo a Cloudinary
router.post('/', auth, (req, res, next) => {
  if (!hasCloudinary) {
    return res.status(503).json({
      error: 'Almacenamiento en la nube no configurado. Configura CLOUDINARY_* en el .env o pega un enlace directo.',
      fallback: true,
    })
  }
  next()
}, uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

    const ext = path.extname(req.file.originalname).toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) {
      return res.status(400).json({ error: `Formato no permitido. Usa: ${ALLOWED_EXT.join(', ')}` })
    }

    // Subir a Cloudinary como stream desde buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `sapiens-colab/entregas`,
          resource_type: 'auto',
          public_id: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        },
        (error, result) => { if (error) reject(error); else resolve(result) }
      )
      stream.end(req.file.buffer)
    })

    res.json({
      url:      result.secure_url,
      fileName: req.file.originalname,
      size:     req.file.size,
      format:   result.format,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
