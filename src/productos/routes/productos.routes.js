// =====================================================================
// ROUTES: productos.routes.js
// =====================================================================

const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const ctrl = require('../controllers/productos.controller');

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../../../Presentation/public/images'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `producto_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

// POST /api/productos        -> agregar producto (multipart/form-data)
router.post('/', upload.single('imagen'), ctrl.postAgregarProducto);

// PUT /api/productos/:id     -> editar producto
router.put('/:id', upload.single('imagen'), ctrl.putEditarProducto);

// DELETE /api/productos/:id  -> eliminar producto
router.delete('/:id', ctrl.deleteEliminarProducto);

module.exports = router;
