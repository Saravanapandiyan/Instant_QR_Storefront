import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { QuickSetupDto } from './dto/ai.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private getGeminiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new BadRequestException('GEMINI_API_KEY is not configured in backend environment');
    }
    return key;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueRestaurantSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name) || 'store';
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  private async generateUniqueBranchSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name) || 'branch';
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.branch.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  /**
   * 1. Call Gemini to generate a mouth-watering 1-sentence food description
   */
  async generateDishDescription(dishName: string, categoryName = 'Food'): Promise<string> {
    const apiKey = this.getGeminiKey();
    const prompt = `You are a culinary copywriter. Write an appetizing, mouth-watering 1-sentence food description (strictly under 15 words) for "${dishName}" in the category "${categoryName}". Return ONLY the 1-sentence description text, without quotes, introductory text, or markdown.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 60,
            },
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        this.logger.warn(`Gemini description error: ${JSON.stringify(data?.error || data)}`);
        return `Delicious freshly prepared ${dishName} made with authentic ingredients.`;
      }

      const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return generated || `Fresh and flavorful ${dishName} prepared to order.`;
    } catch (err: any) {
      this.logger.error(`Error in generateDishDescription: ${err.message}`);
      return `Fresh and flavorful ${dishName} prepared to order.`;
    }
  }

  /**
   * 2. Search for food photo on Unsplash (Approach 2), with smart categorized fallback
   */
  async findDishImage(dishName: string): Promise<{ imageUrl: string; source: 'unsplash' | 'curated' | 'fallback' }> {
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.replace(/["']/g, '')?.trim();
    // Clean dish name for search (remove parentheses, brackets, special punctuation)
    const cleanName = dishName.replace(/[()[\]{}_-]/g, ' ').replace(/\s+/g, ' ').trim();

    if (unsplashKey) {
      try {
        const query = `${cleanName} food`;
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
          {
            headers: { Authorization: `Client-ID ${unsplashKey}` },
            signal: AbortSignal.timeout(1500), // Fast 1.5s timeout so OCR never hangs
          },
        );

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
          } else {
            this.logger.warn('Unsplash hourly rate limit reached; using smart curated food photo engine.');
          }
        }
      } catch (err: any) {
        // Fast fallback to curated photo
      }
    }

    // Smart Categorized Food Photo Matcher (100% Free CDN, Zero Rate Limit, Instant)
    const matchedUrl = this.matchCuratedFoodPhoto(cleanName);
    return {
      imageUrl: matchedUrl,
      source: 'curated',
    };
  }

  /**
   * Categorized food image matcher using direct high-res Unsplash CDN URLs (no API key required)
   */
  private matchCuratedFoodPhoto(name: string): string {
    const lower = name.toLowerCase();

    // 1. Noodles & Chowmein
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

    // 2. Rice, Fried Rice & Biryani
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

    // 3. Burgers
    if (lower.includes('burger')) {
      if (lower.includes('chicken')) {
        return 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80';
      }
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
    }

    // 4. Pizza
    if (lower.includes('pizza')) {
      if (lower.includes('chicken') || lower.includes('pepperoni')) {
        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80';
      }
      return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80';
    }

    // 5. Rolls, Wraps & Sandwiches
    if (lower.includes('roll') || lower.includes('wrap') || lower.includes('frankie')) {
      return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80';
    }
    if (lower.includes('sandwich') || lower.includes('toast') || lower.includes('panini')) {
      return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80';
    }

    // 6. Momos, Dumplings & Dim Sum
    if (lower.includes('momo') || lower.includes('dumpling') || lower.includes('dim sum')) {
      return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80';
    }

    // 7. Chicken / Meat dishes
    if (lower.includes('chicken') || lower.includes('wing') || lower.includes('kebab') || lower.includes('tikka')) {
      return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80';
    }

    // 8. Paneer & Soya Chaap
    if (lower.includes('paneer') || lower.includes('chaap') || lower.includes('cottage cheese')) {
      return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80';
    }

    // 9. Curry, Dal & Gravy
    if (lower.includes('curry') || lower.includes('dal') || lower.includes('gravy') || lower.includes('masala')) {
      return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80';
    }

    // 10. South Indian (Dosa, Idli, Vada)
    if (lower.includes('dosa') || lower.includes('idli') || lower.includes('vada') || lower.includes('sambar')) {
      return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80';
    }

    // 11. Snacks, Samosa, Pakora & Chaat
    if (lower.includes('samosa') || lower.includes('pakora') || lower.includes('chaat') || lower.includes('snack') || lower.includes('fries')) {
      return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80';
    }

    // 12. Soups
    if (lower.includes('soup') || lower.includes('manchow') || lower.includes('broth')) {
      return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80';
    }

    // 13. Tea / Chai
    if (lower.includes('tea') || lower.includes('chai')) {
      return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80';
    }

    // 14. Coffee
    if (lower.includes('coffee') || lower.includes('latte') || lower.includes('cappuccino') || lower.includes('espresso') || lower.includes('frappe')) {
      return 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80';
    }

    // 15. Shakes, Juices & Drinks
    if (lower.includes('shake') || lower.includes('smoothie') || lower.includes('juice') || lower.includes('mojito') || lower.includes('soda')) {
      return 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80';
    }

    // 16. Desserts, Cakes & Ice Cream
    if (lower.includes('dessert') || lower.includes('cake') || lower.includes('ice cream') || lower.includes('brownie') || lower.includes('sweet') || lower.includes('halwa')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80';
    }

    // 17. Pasta
    if (lower.includes('pasta') || lower.includes('macaroni') || lower.includes('spaghetti')) {
      return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?w=600&auto=format&fit=crop&q=80';
    }

    // 18. Salad
    if (lower.includes('salad')) {
      return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80';
    }

    // Default Gourmet Food Dish
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80';
  }

  /**
   * 3. Parse uploaded menu image/PDF using Gemini Vision OCR
   */
  async parseMenuImage(fileBuffer: Buffer, mimeType: string) {
    const apiKey = this.getGeminiKey();
    const base64Data = fileBuffer.toString('base64');

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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
            },
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        this.logger.error(`Gemini Vision Error: ${JSON.stringify(data)}`);
        throw new InternalServerErrorException(data?.error?.message || 'Failed to extract menu via Gemini Vision');
      }

      let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      // Strip markdown code fences if model returned them
      rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/s, '').trim();

      let parsed: { categories: any[] };
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        this.logger.error(`Failed to parse Gemini output JSON: ${rawText}`);
        throw new BadRequestException('AI could not format the menu clearly. Please verify the image quality.');
      }

      // Enrich items with descriptions and images
      const enrichedCategories = await this.enrichMenu(parsed.categories || []);
      return {
        success: true,
        categories: enrichedCategories,
      };
    } catch (err: any) {
      this.logger.error(`Error in parseMenuImage: ${err.message}`);
      throw err;
    }
  }

  /**
   * Bulk Import parsed menu items into an existing restaurant concept
   */
  async bulkImportMenu(restaurantId: string, categories: any[]) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { branches: true },
    });

    if (!restaurant) {
      throw new BadRequestException('Restaurant concept not found');
    }

    // Persist external dish images to local disk before transaction
    if (categories && categories.length > 0) {
      for (const catDto of categories) {
        await Promise.all(
          (catDto.items || []).map(async (item: any) => {
            if (item.imageUrl && item.imageUrl.startsWith('http')) {
              item.imageUrl = await this.storageService.downloadAndStoreUrl(item.imageUrl, 'products');
            }
          }),
        );
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

          // Link to all branches of this restaurant
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

  /**
   * Helper: Enrich extracted menu with auto-descriptions and food images (Parallel & Instant)
   */
  async enrichMenu(categories: any[]) {
    return Promise.all(
      categories.map(async (cat) => {
        const enrichedItems = await Promise.all(
          (cat.items || []).map(async (item: any) => {
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
          }),
        );

        return {
          name: cat.name,
          items: enrichedItems,
        };
      }),
    );
  }

  /**
   * 4. Atomic 5-Minute Quick Setup Execution
   * Creates Restaurant, 100 free credits, Branch, Categories, Products, and Staff in one atomic call.
   */
  async executeQuickSetup(ownerId: string, dto: QuickSetupDto) {
    const restaurantSlug = await this.generateUniqueRestaurantSlug(dto.restaurantName);
    const branchSlug = await this.generateUniqueBranchSlug(`${dto.restaurantName} main`);
    const currency = dto.currency || 'INR';

    // Persist external dish images to local disk before transaction
    if (dto.categories && dto.categories.length > 0) {
      for (const catDto of dto.categories) {
        await Promise.all(
          (catDto.items || []).map(async (item) => {
            if (item.imageUrl && item.imageUrl.startsWith('http')) {
              item.imageUrl = await this.storageService.downloadAndStoreUrl(item.imageUrl, 'products');
            }
          }),
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Restaurant with initial 100 free credits
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

      // 2. Provision Initial 100 Free Credits in Ledger
      await tx.creditLedger.create({
        data: {
          restaurantId: restaurant.id,
          delta: 100,
          reason: 'SIGNUP_BONUS',
          balanceAfter: 100,
        },
      });

      // 3. Create Default Branch (Storefront)
      const branch = await tx.branch.create({
        data: {
          restaurantId: restaurant.id,
          name: `${dto.restaurantName} - Main Store`,
          slug: branchSlug,
          currency,
          isActive: true,
        },
      });

      // 4. Create Menu Categories & Products if provided
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

            // Link to Branch
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

      // 5. Create Staff Member with 4-Digit PIN if provided
      let staffCreated = null;
      if (dto.staffName && dto.staffPin) {
        // Create a staff user profile
        const staffEmail = `staff_${restaurant.id.slice(0, 8)}_${Date.now()}@instantqr.internal`;
        const dummyPasswordHash = await bcrypt.hash(dto.staffPin, 10);

        const staffUser = await tx.user.create({
          data: {
            email: staffEmail,
            name: dto.staffName,
            passwordHash: dummyPasswordHash,
            role: 'STAFF',
          },
        });

        staffCreated = await tx.staffMember.create({
          data: {
            restaurantId: restaurant.id,
            userId: staffUser.id,
            role: dto.staffRole || 'CASHIER',
            pinCode: dto.staffPin,
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
              role: staffCreated.role,
              pinCode: staffCreated.pinCode,
            }
          : null,
      };
    });
  }

  // ==========================================
  // Multilingual Menu Translation Engine (Gemini Flash)
  // ==========================================
  getSupportedLanguages() {
    return [
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
  }

  async translateMenu(restaurantId: string, targetLanguages: string[]) {
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
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.categories.length === 0 && restaurant.products.length === 0) {
      return { success: true, message: 'Menu is empty, nothing to translate.', totalUpdated: 0 };
    }

    const supported = this.getSupportedLanguages();
    const validLanguages = supported.filter((l) => targetLanguages.includes(l.code));

    if (validLanguages.length === 0) {
      throw new BadRequestException('No valid target languages selected.');
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

    // Initialize in-memory translation maps from current DB state to preserve existing translations
    const categoryTransMap: Record<string, Record<string, any>> = {};
    for (const cat of restaurant.categories) {
      categoryTransMap[cat.id] = { ...((cat.translations as Record<string, any>) || {}) };
    }

    const productTransMap: Record<string, Record<string, any>> = {};
    for (const prod of restaurant.products) {
      productTransMap[prod.id] = { ...((prod.translations as Record<string, any>) || {}) };
    }

    // Run translations in parallel across selected languages for ultra-fast response
    const results = await Promise.allSettled(
      validLanguages.map(async (lang) => {
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

        let response: Response | null = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  responseMimeType: 'application/json',
                },
              }),
            },
          );

          if (response.ok) break;

          // Retry on 503 (high demand) or 429 (rate limit) with backoff
          if ((response.status === 503 || response.status === 429) && attempt < 3) {
            await new Promise((r) => setTimeout(r, 1200 * attempt));
            continue;
          }
          break;
        }

        if (!response || !response.ok) {
          const errData = await response?.json().catch(() => ({}));
          throw new Error(`Gemini Translation Error for ${lang.code}: ${JSON.stringify(errData)}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);
        return { langCode: lang.code, parsed };
      }),
    );

    let totalUpdated = 0;
    const successfullyTranslatedLangs: string[] = [];

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
      } else {
        this.logger.error(`Translation failed for a language: ${res.reason}`);
      }
    }

    // Persist all accumulated translations to DB in parallel
    await Promise.all([
      ...Object.entries(categoryTransMap).map(([id, translations]) =>
        this.prisma.category.update({
          where: { id },
          data: { translations },
        }),
      ),
      ...Object.entries(productTransMap).map(([id, translations]) =>
        this.prisma.product.update({
          where: { id },
          data: { translations },
        }),
      ),
    ]);

    return {
      success: true,
      languages: validLanguages.map((l) => l.code),
      totalUpdated,
      message: `Menu successfully translated into ${validLanguages.map((l) => l.name).join(', ')}!`,
    };
  }

  // Manual update for product translation override
  async updateProductTranslation(
    productId: string,
    langCode: string,
    name: string,
    description?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = (product.translations as Record<string, any>) || {};
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

  // Manual update for category translation override
  async updateCategoryTranslation(
    categoryId: string,
    langCode: string,
    name: string,
    description?: string,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const existing = (category.translations as Record<string, any>) || {};
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
}
