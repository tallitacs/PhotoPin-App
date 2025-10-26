import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = process.env.ALLOWED_MIME_TYPES?.split(',') || [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
    },
    fileFilter: fileFilter
});

export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false,
                error: `File too large. Maximum size is ${parseInt(process.env.MAX_FILE_SIZE || '52428800') / 1024 / 1024}MB.` 
            });
        }
        return res.status(400).json({ 
            success: false,
            error: `Upload error: ${error.message}` 
        });
    } else if (error) {
        return res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
    next();
};