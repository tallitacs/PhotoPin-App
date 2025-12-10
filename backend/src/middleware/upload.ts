import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer to use memory storage (files stored in memory as buffers)
const storage = multer.memoryStorage();

// File filter function - validates file MIME types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Get allowed MIME types from environment or use defaults
    const allowedMimeTypes = process.env.ALLOWED_MIME_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    // Accept file if MIME type is in allowed list
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Reject file with error message
        cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
};

// Multer middleware configuration for file uploads
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
    },
    fileFilter: fileFilter
});

// Error handler for multer upload errors
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
    // Handle multer-specific errors
    if (error instanceof multer.MulterError) {
        // File size limit exceeded
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: `File too large. Maximum size is ${parseInt(process.env.MAX_FILE_SIZE || '52428800') / 1024 / 1024}MB.`
            });
        }
        // Other multer errors
        return res.status(400).json({
            success: false,
            error: `Upload error: ${error.message}`
        });
    } else if (error) {
        // Handle file filter errors (invalid file type)
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    next();
};