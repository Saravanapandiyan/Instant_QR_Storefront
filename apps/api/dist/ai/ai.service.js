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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../common/storage/storage.service");
const bcrypt = __importStar(require("bcrypt"));
let AiService = AiService_1 = class AiService {
    prisma;
    storageService;
    logger = new common_1.Logger(AiService_1.name);
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    getGeminiKey() {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
            throw new common_1.BadRequestException('GEMINI_API_KEY is not configured in backend environment');
        }
        return key;
    }
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async generateUniqueRestaurantSlug(name) {
        const baseSlug = this.slugify(name) || 'store';
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.restaurant.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async generateUniqueBranchSlug(name) {
        const baseSlug = this.slugify(name) || 'branch';
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.branch.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async callGemini(payload, models = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
    ]) {
        const apiKey = this.getGeminiKey();
        let lastError = null;
        for (const model of models) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                if (response.ok && data?.candidates?.[0]?.content?.parts?.length) {
                    return data;
                }
                this.logger.warn(`Gemini model ${model} returned ${response.status}: ${JSON.stringify(data?.error || data)}`);
                lastError = data?.error?.message || `Model ${model} returned ${response.status}`;
            }
            catch (err) {
                this.logger.warn(`Gemini model ${model} network error: ${err.message}`);
                lastError = err.message;
            }
        }
        throw new Error(lastError || 'All Gemini models unavailable');
    }
    normalizeMenuCategories(parsed) {
        let list = [];
        if (Array.isArray(parsed)) {
            list = parsed;
        }
        else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.categories)) {
                list = parsed.categories;
            }
            else if (Array.isArray(parsed.menu)) {
                list = parsed.menu;
            }
            else if (Array.isArray(parsed.items)) {
                list = [{ name: parsed.name || 'Menu', items: parsed.items }];
            }
            else {
                const keys = Object.keys(parsed);
                const arrayKey = keys.find((k) => Array.isArray(parsed[k]));
                if (arrayKey) {
                    list = parsed[arrayKey];
                }
            }
        }
        return list
            .map((cat, idx) => {
            const catName = cat.name || cat.category || cat.title || cat.categoryName || `Category ${idx + 1}`;
            const rawItems = cat.items || cat.dishes || cat.products || [];
            const items = Array.isArray(rawItems)
                ? rawItems
                    .map((item) => ({
                    name: String(item.name || item.dish || item.title || '').trim(),
                    price: Number(item.price || item.cost || item.rate) || 0,
                    description: String(item.description || item.desc || '').trim(),
                    imageUrl: String(item.imageUrl || item.image || '').trim(),
                }))
                    .filter((item) => item.name.length > 0)
                : [];
            return {
                name: String(catName).trim(),
                items,
            };
        })
            .filter((c) => c.items.length > 0);
    }
    async generateDishDescription(dishName, categoryName = 'Food') {
        const prompt = `You are a culinary copywriter. Write an appetizing, mouth-watering 1-sentence food description (strictly under 15 words) for "${dishName}" in the category "${categoryName}". Return ONLY the 1-sentence description text, without quotes, introductory text, or markdown.`;
        try {
            const data = await this.callGemini({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 60,
                },
            });
            const parts = data?.candidates?.[0]?.content?.parts || [];
            const generated = parts.map((p) => p.text || '').join('\n').trim();
            return generated || `Fresh and flavorful ${dishName} prepared to order.`;
        }
        catch (err) {
            this.logger.error(`Error in generateDishDescription: ${err.message}`);
            return `Fresh and flavorful ${dishName} prepared to order.`;
        }
    }
    async findDishImage(dishName) {
        const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.replace(/["']/g, '')?.trim();
        const cleanName = dishName.replace(/[()[\]{}_-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (unsplashKey) {
            try {
                const query = `${cleanName} food`;
                const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
                    headers: { Authorization: `Client-ID ${unsplashKey}` },
                    signal: AbortSignal.timeout(1500),
                });
                if (res.ok) {
                    const text = await res.text();
                    if (!text.includes('Rate Limit Exceeded')) {
                        const data = JSON.parse(text);
                        if (data?.results?.[0]?.urls?.regular) {
                            return {
                                imageUrl: data.results[0].urls.regular,
                                source: 'unsplash',
                            };
                        }
                    }
                    else {
                        this.logger.warn('Unsplash hourly rate limit reached; using smart curated food photo engine.');
                    }
                }
            }
            catch (err) {
            }
        }
        const matchedUrl = this.matchCuratedFoodPhoto(cleanName);
        return {
            imageUrl: matchedUrl,
            source: 'curated',
        };
    }
    matchCuratedFoodPhoto(name) {
        const lower = name.toLowerCase();
        if (lower.includes('noodle') || lower.includes('chowmein') || lower.includes('maggi') || lower.includes('ramen')) {
            if (lower.includes('chicken')) {
                return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80';
            }
            if (lower.includes('egg')) {
                return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80';
            }
            if (lower.includes('schezwan') || lower.includes('spicy') || lower.includes('chilli')) {
                return 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80';
            }
            return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('rice') || lower.includes('biryani') || lower.includes('pulao')) {
            if (lower.includes('biryani')) {
                return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';
            }
            if (lower.includes('chicken')) {
                return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80';
            }
            if (lower.includes('egg')) {
                return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80';
            }
            return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('burger')) {
            if (lower.includes('chicken')) {
                return 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80';
            }
            return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('pizza')) {
            if (lower.includes('chicken') || lower.includes('pepperoni')) {
                return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80';
            }
            return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('roll') || lower.includes('wrap') || lower.includes('frankie')) {
            return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('sandwich') || lower.includes('toast') || lower.includes('panini')) {
            return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('momo') || lower.includes('dumpling') || lower.includes('dim sum')) {
            return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('chicken') || lower.includes('wing') || lower.includes('kebab') || lower.includes('tikka')) {
            return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('paneer') || lower.includes('chaap') || lower.includes('cottage cheese')) {
            return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('curry') || lower.includes('dal') || lower.includes('gravy') || lower.includes('masala')) {
            return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('dosa') || lower.includes('idli') || lower.includes('vada') || lower.includes('sambar')) {
            return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('samosa') || lower.includes('pakora') || lower.includes('chaat') || lower.includes('snack') || lower.includes('fries')) {
            return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('soup') || lower.includes('manchow') || lower.includes('broth')) {
            return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('tea') || lower.includes('chai')) {
            return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('coffee') || lower.includes('latte') || lower.includes('cappuccino') || lower.includes('espresso') || lower.includes('frappe')) {
            return 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('shake') || lower.includes('smoothie') || lower.includes('juice') || lower.includes('mojito') || lower.includes('soda')) {
            return 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('dessert') || lower.includes('cake') || lower.includes('ice cream') || lower.includes('brownie') || lower.includes('sweet') || lower.includes('halwa')) {
            return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('pasta') || lower.includes('macaroni') || lower.includes('spaghetti')) {
            return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?w=600&auto=format&fit=crop&q=80';
        }
        if (lower.includes('salad')) {
            return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80';
        }
        return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80';
    }
    async parseMenuImage(fileBuffer, mimeType) {
        try {
            const textContent = fileBuffer.toString('utf-8').trim();
            if (mimeType?.includes('json') ||
                (textContent.startsWith('{') && textContent.endsWith('}')) ||
                (textContent.startsWith('[') && textContent.endsWith(']'))) {
                const parsed = JSON.parse(textContent);
                let extractedCats = [];
                if (Array.isArray(parsed)) {
                    if (parsed.length > 0) {
                        if (parsed[0].items) {
                            extractedCats = parsed;
                        }
                        else {
                            extractedCats = [{ name: 'Menu', items: parsed }];
                        }
                    }
                }
                else if (parsed.categories && Array.isArray(parsed.categories)) {
                    extractedCats = parsed.categories;
                }
                else if (parsed.items && Array.isArray(parsed.items)) {
                    extractedCats = [{ name: parsed.name || 'Menu', items: parsed.items }];
                }
                if (extractedCats.length > 0) {
                    const enrichedCategories = await this.enrichMenu(extractedCats);
                    return {
                        success: true,
                        categories: enrichedCategories,
                    };
                }
            }
        }
        catch (e) {
        }
        const apiKey = this.getGeminiKey();
        const isTextOrCsv = mimeType?.includes('csv') ||
            mimeType?.includes('text') ||
            mimeType?.includes('plain');
        const prompt = `You are an expert restaurant menu digitizer.
Analyze this menu image or document. Extract all categories and individual dish items with their prices.
Rules:
1. Extract Category names (e.g. Starters, Main Course, Beverages, Desserts).
2. For each item extract:
   - "name": Dish title in Title Case
   - "price": Numeric price (e.g. 150 or 8.50). If prices are missing, estimate 0.
   - "description": If printed on the menu, extract it. If NOT printed, craft an appetizing, mouth-watering 1-sentence food description (strictly under 15 words) suitable for diners.
3. Return ONLY valid JSON in this exact structure:
{
  "categories": [
    {
      "name": "Category Name",
      "items": [
        {
          "name": "Dish Name",
          "price": 12.50,
          "description": ""
        }
      ]
    }
  ]
}
Do NOT include markdown backticks (\`\`\`json), comments, or introductory text. Return only valid JSON.`;
        try {
            const parts = [];
            if (isTextOrCsv) {
                const textContent = fileBuffer.toString('utf-8');
                parts.push({ text: `${prompt}\n\nDocument contents:\n${textContent}` });
            }
            else {
                const base64Data = fileBuffer.toString('base64');
                let uploadMime = mimeType || 'image/jpeg';
                if (uploadMime.includes('avif') || !uploadMime.startsWith('image/')) {
                    uploadMime = 'image/jpeg';
                }
                parts.push({ text: prompt });
                parts.push({
                    inlineData: {
                        mimeType: uploadMime,
                        data: base64Data,
                    },
                });
            }
            const data = await this.callGemini({
                contents: [
                    {
                        parts,
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                    maxOutputTokens: 8192,
                },
            });
            const responseParts = data?.candidates?.[0]?.content?.parts || [];
            let rawText = responseParts.map((p) => p.text || '').join('\n').trim();
            let parsed = null;
            try {
                parsed = JSON.parse(rawText);
            }
            catch (_) {
                const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                if (codeBlock) {
                    try {
                        parsed = JSON.parse(codeBlock[1]);
                    }
                    catch (__) { }
                }
                if (!parsed) {
                    const firstBrace = rawText.indexOf('{');
                    const lastBrace = rawText.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace > firstBrace) {
                        try {
                            parsed = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
                        }
                        catch (__) { }
                    }
                }
                if (!parsed) {
                    const firstBracket = rawText.indexOf('[');
                    const lastBracket = rawText.lastIndexOf(']');
                    if (firstBracket !== -1 && lastBracket > firstBracket) {
                        try {
                            parsed = JSON.parse(rawText.slice(firstBracket, lastBracket + 1));
                        }
                        catch (__) { }
                    }
                }
            }
            if (!parsed) {
                this.logger.error(`Failed to parse Gemini output JSON: ${rawText}`);
                throw new common_1.BadRequestException('AI could not format the menu clearly. Please verify the image quality.');
            }
            const normalizedCats = this.normalizeMenuCategories(parsed);
            if (normalizedCats.length === 0) {
                throw new common_1.BadRequestException('Could not detect any menu items in the image. Please upload a clear photo showing dish names and prices.');
            }
            const enrichedCategories = await this.enrichMenu(normalizedCats);
            return {
                success: true,
                categories: enrichedCategories,
            };
        }
        catch (err) {
            this.logger.error(`Error in parseMenuImage: ${err.message}`);
            throw err;
        }
    }
    async bulkImportMenu(restaurantId, categories) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: { branches: true },
        });
        if (!restaurant) {
            throw new common_1.BadRequestException('Restaurant concept not found');
        }
        if (categories && categories.length > 0) {
            for (const catDto of categories) {
                await Promise.all((catDto.items || []).map(async (item) => {
                    if (item.imageUrl && item.imageUrl.startsWith('http')) {
                        item.imageUrl = await this.storageService.downloadAndStoreUrl(item.imageUrl, 'products');
                    }
                }));
            }
        }
        return this.prisma.$transaction(async (tx) => {
            let categoriesCreated = 0;
            let productsCreated = 0;
            for (let i = 0; i < categories.length; i++) {
                const catDto = categories[i];
                let category = await tx.category.findFirst({
                    where: { restaurantId, name: catDto.name, isDeleted: false },
                });
                if (!category) {
                    category = await tx.category.create({
                        data: {
                            restaurantId,
                            name: catDto.name,
                            sortOrder: i,
                        },
                    });
                    categoriesCreated++;
                }
                for (const item of catDto.items || []) {
                    const product = await tx.product.create({
                        data: {
                            restaurantId,
                            categoryId: category.id,
                            name: item.name,
                            description: item.description || '',
                            basePrice: item.price || 0,
                            imageUrl: item.imageUrl || null,
                        },
                    });
                    productsCreated++;
                    for (const branch of restaurant.branches) {
                        await tx.branchProduct.upsert({
                            where: {
                                branchId_productId: {
                                    branchId: branch.id,
                                    productId: product.id,
                                },
                            },
                            create: {
                                branchId: branch.id,
                                productId: product.id,
                                isAvailable: true,
                            },
                            update: { isAvailable: true },
                        });
                    }
                }
            }
            return {
                success: true,
                message: `Imported ${productsCreated} dishes across ${categoriesCreated} categories.`,
                categoriesCreated,
                productsCreated,
            };
        });
    }
    async enrichMenu(categories) {
        return Promise.all(categories.map(async (cat) => {
            const enrichedItems = await Promise.all((cat.items || []).map(async (item) => {
                let desc = item.description?.trim();
                if (!desc) {
                    desc = `Delicious freshly prepared ${item.name} made with authentic ingredients.`;
                }
                let imgUrl = item.imageUrl;
                if (!imgUrl) {
                    const imgResult = await this.findDishImage(item.name);
                    imgUrl = imgResult.imageUrl;
                }
                return {
                    name: item.name,
                    price: Number(item.price) || 0,
                    description: desc,
                    imageUrl: imgUrl,
                };
            }));
            return {
                name: cat.name,
                items: enrichedItems,
            };
        }));
    }
    async executeQuickSetup(ownerId, dto) {
        const restaurantSlug = await this.generateUniqueRestaurantSlug(dto.restaurantName);
        const branchSlug = await this.generateUniqueBranchSlug(`${dto.restaurantName} main`);
        const currency = dto.currency || 'INR';
        if (dto.categories && dto.categories.length > 0) {
            for (const catDto of dto.categories) {
                await Promise.all((catDto.items || []).map(async (item) => {
                    if (item.imageUrl && item.imageUrl.startsWith('http')) {
                        item.imageUrl = await this.storageService.downloadAndStoreUrl(item.imageUrl, 'products');
                    }
                }));
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const restaurant = await tx.restaurant.create({
                data: {
                    ownerId,
                    name: dto.restaurantName,
                    slug: restaurantSlug,
                    defaultCurrency: currency,
                    creditBalance: 100,
                    paymentConfig: {
                        enableCash: true,
                        serviceType: dto.serviceType || 'BOTH',
                    },
                },
            });
            await tx.creditLedger.create({
                data: {
                    restaurantId: restaurant.id,
                    delta: 100,
                    reason: 'SIGNUP_BONUS',
                    balanceAfter: 100,
                },
            });
            const branch = await tx.branch.create({
                data: {
                    restaurantId: restaurant.id,
                    name: `${dto.restaurantName} - Main Store`,
                    slug: branchSlug,
                    currency,
                    isActive: true,
                },
            });
            let categoriesCreated = 0;
            let productsCreated = 0;
            if (dto.categories && dto.categories.length > 0) {
                for (let i = 0; i < dto.categories.length; i++) {
                    const catDto = dto.categories[i];
                    const category = await tx.category.create({
                        data: {
                            restaurantId: restaurant.id,
                            name: catDto.name,
                            sortOrder: i,
                        },
                    });
                    categoriesCreated++;
                    for (const itemDto of catDto.items || []) {
                        const product = await tx.product.create({
                            data: {
                                restaurantId: restaurant.id,
                                categoryId: category.id,
                                name: itemDto.name,
                                description: itemDto.description || '',
                                basePrice: itemDto.price || 0,
                                imageUrl: itemDto.imageUrl || null,
                            },
                        });
                        productsCreated++;
                        await tx.branchProduct.create({
                            data: {
                                branchId: branch.id,
                                productId: product.id,
                                isAvailable: true,
                            },
                        });
                    }
                }
            }
            let staffCreated = null;
            if (dto.staffName && (dto.staffPin || dto.staffEmail)) {
                const staffEmail = dto.staffEmail?.trim() ||
                    `staff_${restaurant.id.slice(0, 8)}_${Date.now()}@instantqr.internal`;
                const staffPasswordToHash = dto.staffPassword?.trim() || dto.staffPin || '1234';
                const passwordHash = await bcrypt.hash(staffPasswordToHash, 10);
                const staffUser = await tx.user.create({
                    data: {
                        email: staffEmail,
                        name: dto.staffName,
                        passwordHash,
                        role: 'STAFF',
                    },
                });
                staffCreated = await tx.staffMember.create({
                    data: {
                        restaurantId: restaurant.id,
                        userId: staffUser.id,
                        role: dto.staffRole || 'CASHIER',
                        pinCode: dto.staffPin || '1234',
                        assignedBranches: ['ALL'],
                        permissions: {
                            canConfirmOrders: true,
                            canViewKds: true,
                        },
                    },
                });
            }
            return {
                success: true,
                message: '5-Minute Quick Setup Completed Successfully!',
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    currency: restaurant.defaultCurrency,
                    creditBalance: restaurant.creditBalance,
                },
                branch: {
                    id: branch.id,
                    name: branch.name,
                    slug: branch.slug,
                    storefrontPath: `/r/${branch.slug}`,
                },
                counts: {
                    categoriesCount: categoriesCreated,
                    productsCount: productsCreated,
                    freeCredits: 100,
                },
                staff: staffCreated
                    ? {
                        name: dto.staffName,
                        email: dto.staffEmail || undefined,
                        role: staffCreated.role,
                        pinCode: staffCreated.pinCode,
                    }
                    : null,
            };
        });
    }
    DEFAULT_LANGUAGES = [
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
        { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
        { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
        { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
        { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
    ];
    async getSupportedLanguages() {
        try {
            const custom = await this.prisma.customLanguage.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
            const defaultCodes = new Set(this.DEFAULT_LANGUAGES.map((l) => l.code));
            const customFiltered = custom.filter((c) => !defaultCodes.has(c.code));
            return [
                ...this.DEFAULT_LANGUAGES,
                ...customFiltered.map((c) => ({
                    code: c.code,
                    name: c.name,
                    nativeName: c.nativeName,
                    flag: c.flag || '🌐',
                    direction: c.direction || 'ltr',
                    isCustom: true,
                })),
            ];
        }
        catch {
            return this.DEFAULT_LANGUAGES;
        }
    }
    async addCustomLanguage(dto) {
        const cleanCode = dto.code.trim().toLowerCase();
        if (!cleanCode || cleanCode.length < 2) {
            throw new common_1.BadRequestException('Valid language code (e.g. "de", "bn", "mr", "gu") is required.');
        }
        if (!dto.name?.trim() || !dto.nativeName?.trim()) {
            throw new common_1.BadRequestException('Language name and native name are required.');
        }
        return this.prisma.customLanguage.upsert({
            where: { code: cleanCode },
            create: {
                code: cleanCode,
                name: dto.name.trim(),
                nativeName: dto.nativeName.trim(),
                flag: dto.flag?.trim() || '🌐',
                direction: dto.direction?.trim() || 'ltr',
                isActive: true,
            },
            update: {
                name: dto.name.trim(),
                nativeName: dto.nativeName.trim(),
                flag: dto.flag?.trim() || '🌐',
                direction: dto.direction?.trim() || 'ltr',
                isActive: true,
            },
        });
    }
    async deleteCustomLanguage(code) {
        const cleanCode = code.trim().toLowerCase();
        return this.prisma.customLanguage.deleteMany({
            where: { code: cleanCode },
        });
    }
    async translateMenu(restaurantId, targetLanguages) {
        const apiKey = this.getGeminiKey();
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                categories: {
                    where: { isDeleted: false },
                    orderBy: { sortOrder: 'asc' },
                },
                products: {
                    where: { isDeleted: false },
                },
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        if (restaurant.categories.length === 0 && restaurant.products.length === 0) {
            return { success: true, message: 'Menu is empty, nothing to translate.', totalUpdated: 0 };
        }
        const supported = await this.getSupportedLanguages();
        const validLanguages = supported.filter((l) => targetLanguages.includes(l.code));
        if (validLanguages.length === 0) {
            throw new common_1.BadRequestException('No valid target languages selected.');
        }
        const payloadCategories = restaurant.categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
        }));
        const payloadProducts = restaurant.products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
        }));
        const categoryTransMap = {};
        for (const cat of restaurant.categories) {
            categoryTransMap[cat.id] = { ...(cat.translations || {}) };
        }
        const productTransMap = {};
        for (const prod of restaurant.products) {
            productTransMap[prod.id] = { ...(prod.translations || {}) };
        }
        const results = await Promise.allSettled(validLanguages.map(async (lang) => {
            const prompt = `You are a culinary translator and menu copywriting expert. Translate the provided restaurant menu category names, dish names, and dish descriptions accurately and appetizingly into ${lang.name} (${lang.nativeName}, ISO code: "${lang.code}").
Ensure dish names that are typically transliterated (e.g. Biryani, Paneer, Tikka, Shawarma, Chai, Dosa) are phonetically transliterated into ${lang.nativeName} instead of meaningless literal translations. Descriptions should be rich, appetizing, and natural.

Categories to translate:
${JSON.stringify(payloadCategories)}

Dishes to translate:
${JSON.stringify(payloadProducts)}

Return strictly a JSON object with:
{
  "categories": [
    { "id": "category_id_string", "name": "translated_name", "description": "translated_description" }
  ],
  "products": [
    { "id": "product_id_string", "name": "translated_name", "description": "translated_description" }
  ]
}`;
            const data = await this.callGemini({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    responseMimeType: 'application/json',
                },
            });
            const respParts = data?.candidates?.[0]?.content?.parts || [];
            const rawText = respParts.map((p) => p.text || '').join('\n').trim() || '{}';
            const parsed = JSON.parse(rawText);
            return { langCode: lang.code, parsed };
        }));
        let totalUpdated = 0;
        const successfullyTranslatedLangs = [];
        for (const res of results) {
            if (res.status === 'fulfilled') {
                const { langCode, parsed } = res.value;
                successfullyTranslatedLangs.push(langCode);
                if (Array.isArray(parsed.categories)) {
                    for (const c of parsed.categories) {
                        if (categoryTransMap[c.id]) {
                            const orig = restaurant.categories.find((x) => x.id === c.id);
                            categoryTransMap[c.id][langCode] = {
                                name: c.name?.trim() || orig?.name || '',
                                description: c.description?.trim() || '',
                            };
                            totalUpdated++;
                        }
                    }
                }
                if (Array.isArray(parsed.products)) {
                    for (const p of parsed.products) {
                        if (productTransMap[p.id]) {
                            const orig = restaurant.products.find((x) => x.id === p.id);
                            productTransMap[p.id][langCode] = {
                                name: p.name?.trim() || orig?.name || '',
                                description: p.description?.trim() || '',
                            };
                            totalUpdated++;
                        }
                    }
                }
            }
            else {
                this.logger.error(`Translation failed for a language: ${res.reason}`);
            }
        }
        await Promise.all([
            ...Object.entries(categoryTransMap).map(([id, translations]) => this.prisma.category.update({
                where: { id },
                data: { translations },
            })),
            ...Object.entries(productTransMap).map(([id, translations]) => this.prisma.product.update({
                where: { id },
                data: { translations },
            })),
        ]);
        return {
            success: true,
            languages: validLanguages.map((l) => l.code),
            totalUpdated,
            message: `Menu successfully translated into ${validLanguages.map((l) => l.name).join(', ')}!`,
        };
    }
    async updateProductTranslation(productId, langCode, name, description) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const existing = product.translations || {};
        const updated = {
            ...existing,
            [langCode]: {
                name: name.trim(),
                description: description?.trim() || '',
            },
        };
        return this.prisma.product.update({
            where: { id: productId },
            data: { translations: updated },
        });
    }
    async updateCategoryTranslation(categoryId, langCode, name, description) {
        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category)
            throw new common_1.NotFoundException('Category not found');
        const existing = category.translations || {};
        const updated = {
            ...existing,
            [langCode]: {
                name: name.trim(),
                description: description?.trim() || '',
            },
        };
        return this.prisma.category.update({
            where: { id: categoryId },
            data: { translations: updated },
        });
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], AiService);
//# sourceMappingURL=ai.service.js.map