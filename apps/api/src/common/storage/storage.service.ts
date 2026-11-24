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
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/avif',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon',
            'image/ico',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only JPG, PNG, WebP, SVG, and ICO images are allowed');
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

    // 2. Download an external image URL and persist it to disk
    async downloadAndStoreUrl(imageUrl: string, folder: string = 'products'): Promise<string> {
        if (!imageUrl || !imageUrl.startsWith('http')) {
            return imageUrl;
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(imageUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                },
            });
            clearTimeout(timeout);

            if (!res.ok) {
                console.warn(`Could not download image from ${imageUrl}, status: ${res.status}`);
                return imageUrl;
            }

            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Determine extension from content-type or fallback to .jpg
            const contentType = res.headers.get('content-type') || '';
            let ext = '.jpg';
            if (contentType.includes('png')) ext = '.png';
            else if (contentType.includes('webp')) ext = '.webp';

            const targetFolder = path.join(this.uploadDir, folder);
            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }

            const uniqueFileName = `${Date.now()}-${randomUUID()}${ext}`;
            const destinationPath = path.join(targetFolder, uniqueFileName);

            await fs.promises.writeFile(destinationPath, buffer);
            return `/uploads/${folder}/${uniqueFileName}`;
        } catch (err: any) {
            console.warn(`Failed to download and persist image from ${imageUrl}: ${err.message}`);
            return imageUrl;
        }
    }

    // 3. Delete a file from disk
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
