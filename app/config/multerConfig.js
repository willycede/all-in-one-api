const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único: timestamp-userId-documentType-originalname
        const userId = req.body.user_id || 'unknown';
        const documentType = req.body.document_type || 'doc';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        
        const filename = `${timestamp}-${userId}-${documentType}-${sanitizedName}${ext}`;
        cb(null, filename);
    }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF, JPG y PNG'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});

module.exports = upload;
