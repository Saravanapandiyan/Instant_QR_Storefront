import "multer";
import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
    // Base directory on disk for uploaded files
    private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

    constructor() {
        // Ensure the root uploads folder exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    // 1. Upload a file to a specific subfolder (e.g., 'products', 'banners')
    async uploadFile(file: Express.Multer.File, folder: string = 'products'): Promise<string> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Allowed image types
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only JPG, PNG, WebP, and AVIF images are allowed');
        }

        // Max 5MB size limit
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('Image size cannot exceed 5MB');
        }

        // Create target subfolder if it does not exist (e.g. uploads/products)
        const targetFolder = path.join(this.uploadDir, folder);
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        // Generate unique filename: timestamp-uuid.extension
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueFileName = `${Date.now()}-${randomUUID()}${ext}`;
        const destinationPath = path.join(targetFolder, uniqueFileName);

        // Save file buffer to disk
        await fs.promises.writeFile(destinationPath, file.buffer);

        // Return the relative storage key/path (e.g., 'products/17300000-uuid.png')
        return `${folder}/${uniqueFileName}`;
    }

    // 2. Delete a file from disk
    async deleteFile(relativePath: string): Promise<boolean> {
        if (!relativePath) return false;

        try {
            const fullPath = path.join(this.uploadDir, relativePath);
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
                return true;
            }
        } catch (error) {
            console.warn(`Could not delete file at ${relativePath}:`, error);
        }
        return false;
    }
}
