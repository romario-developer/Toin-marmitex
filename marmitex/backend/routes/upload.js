// backend/routes/upload.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();

// Armazenar em memória para converter para base64
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|png|webp)/.test(file.mimetype);
    cb(ok ? null : new Error('Tipo de arquivo inválido (use JPG, PNG ou WEBP).'), ok);
  }
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    // Converter para base64
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    
    res.json({ 
      url: dataUrl,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

export default router;
