import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadRouter = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `excel-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Excel upload endpoint
uploadRouter.post('/upload-excel', upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    console.log(`📄 Procesando archivo: ${originalName}`);
    console.log(`📁 Ruta del archivo: ${filePath}`);

    // Read and parse Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`📊 Hojas encontradas: ${sheetNames.join(', ')}`);

    // Process all sheets
    const sheetsData = {};
    let totalRows = 0;

    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      sheetsData[sheetName] = {
        data: jsonData,
        rowCount: jsonData.length,
        columnCount: jsonData[0] ? jsonData[0].length : 0
      };
      
      totalRows += jsonData.length;
    });

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeKB = Math.round(stats.size / 1024);

    // Prepare response
    const response = {
      success: true,
      message: `Archivo Excel procesado exitosamente. ${totalRows} filas en ${sheetNames.length} hoja(s).`,
      fileInfo: {
        originalName: originalName,
        fileName: req.file.filename,
        size: fileSizeKB,
        uploadDate: new Date().toISOString(),
        sheets: Object.keys(sheetsData).map(sheetName => ({
          name: sheetName,
          rows: sheetsData[sheetName].rowCount,
          columns: sheetsData[sheetName].columnCount
        }))
      },
      data: sheetsData,
      summary: {
        totalSheets: sheetNames.length,
        totalRows: totalRows,
        processedAt: new Date().toISOString()
      }
    };

    console.log(`✅ Archivo procesado exitosamente: ${originalName}`);
    console.log(`📊 Resumen: ${totalRows} filas, ${sheetNames.length} hojas, ${fileSizeKB}KB`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error procesando archivo Excel:', error);

    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Archivo temporal eliminado debido al error');
      } catch (cleanupError) {
        console.error('❌ Error eliminando archivo temporal:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error procesando el archivo Excel',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get uploaded files list
uploadRouter.get('/files', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({
        success: true,
        files: [],
        message: 'No hay archivos subidos'
      });
    }

    const files = fs.readdirSync(uploadDir)
      .filter(file => file.startsWith('excel-'))
      .map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: Math.round(stats.size / 1024),
          uploadDate: stats.birthtime.toISOString(),
          lastModified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    res.json({
      success: true,
      files: files,
      count: files.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo lista de archivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de archivos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete uploaded file
uploadRouter.delete('/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    fs.unlinkSync(filePath);
    console.log(`🗑️ Archivo eliminado: ${filename}`);

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando archivo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});