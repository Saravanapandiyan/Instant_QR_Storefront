"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
require("multer");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
let StorageService = class StorageService {
    uploadDir = path.resolve(process.cwd(), 'uploads');
    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async uploadFile(file, folder = 'products') {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
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
            throw new common_1.BadRequestException('Only JPG, PNG, WebP, SVG, and ICO images are allowed');
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('Image size cannot exceed 5MB');
        }
        const targetFolder = path.join(this.uploadDir, folder);
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueFileName = `${Date.now()}-${(0, crypto_1.randomUUID)()}${ext}`;
        const destinationPath = path.join(targetFolder, uniqueFileName);
        await fs.promises.writeFile(destinationPath, file.buffer);
        return `${folder}/${uniqueFileName}`;
    }
    async downloadAndStoreUrl(imageUrl, folder = 'products') {
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
            const contentType = res.headers.get('content-type') || '';
            let ext = '.jpg';
            if (contentType.includes('png'))
                ext = '.png';
            else if (contentType.includes('webp'))
                ext = '.webp';
            const targetFolder = path.join(this.uploadDir, folder);
            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }
            const uniqueFileName = `${Date.now()}-${(0, crypto_1.randomUUID)()}${ext}`;
            const destinationPath = path.join(targetFolder, uniqueFileName);
            await fs.promises.writeFile(destinationPath, buffer);
            return `/uploads/${folder}/${uniqueFileName}`;
        }
        catch (err) {
            console.warn(`Failed to download and persist image from ${imageUrl}: ${err.message}`);
            return imageUrl;
        }
    }
    async deleteFile(relativePath) {
        if (!relativePath)
            return false;
        try {
            const fullPath = path.join(this.uploadDir, relativePath);
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
                return true;
            }
        }
        catch (error) {
            console.warn(`Could not delete file at ${relativePath}:`, error);
        }
        return false;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map