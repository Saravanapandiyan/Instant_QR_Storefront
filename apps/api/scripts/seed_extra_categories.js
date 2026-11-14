const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const RESTAURANT_ID = 'c7093d5d-30fc-45b9-97a3-06087377d576'; // Ananda Non veg
const BRANCH_IDS = [
  'de8718fe-8eed-4c2a-9731-719126c65a46', // Theppakulam
  'e143f84d-1a44-4fb6-bdf3-56c1125696ac', // Downtown Branch
];

const UPLOADS_DIR = path.join(__dirname, '../uploads/products');

const FALLBACK_PHOTO_IDS = [
  'photo-1563379091339-03b21ab4a4f8',
  'photo-1546833999-b9f581a1996d',
  'photo-1626082927389-6cd097cdc6ec',
  'photo-1603894584373-5ac82b2ae398',
  'photo-1565557623262-b51c2513a641',
];

const EXTRA_CATEGORIES = [
  {
    category: 'Egg Delicacies (Muttai Special)',
    description: 'Iconic Madurai kalaki, fluffy karandi omelettes, and spicy muttai varuval',
    sortOrder: 12,
    dishes: [
      {
        name: 'Madurai Muttai Kalaki',
        description: 'Soft, creamy half-cooked egg pouch infused with rich mutton salna and freshly cracked black pepper.',
        price: 50,
        photoId: 'photo-1525351484163-7529414344d8',
      },
      {
        name: 'Karandi Omelette',
        description: 'Fluffy spherical country egg omelette fried in a deep iron ladle with shallots, curry leaves, and green chilies.',
        price: 70,
        photoId: 'photo-1525351484163-7529414344d8',
      },
      {
        name: 'Spicy Muttai Podimas',
        description: 'Country eggs scrambled dry on iron tawa with crushed pepper, cumin, chopped onions, and curry leaves.',
        price: 90,
        photoId: 'photo-1601050690597-df0568f70950',
      },
      {
        name: 'Boiled Egg Pepper Fry',
        description: 'Golden pan-seared hard boiled eggs coated in roasted Tellicherry pepper and caramelized shallot paste.',
        price: 100,
        photoId: 'photo-1589301760014-d929f3979dbc',
      },
      {
        name: 'Nattu Kozhi Muttai Omelette',
        description: 'Double free-range country egg omelette whipped with crushed peppercorns and cold-pressed sesame oil.',
        price: 80,
        photoId: 'photo-1525351484163-7529414344d8',
      },
      {
        name: 'Muttai Salna Roast',
        description: 'Pan-roasted boiled eggs simmered semi-dry in aromatic spiced coconut-shallot salna gravy.',
        price: 110,
        photoId: 'photo-1601050690597-df0568f70950',
      },
    ],
  },
  {
    category: "Chef's Tiffin Specials",
    description: 'Madurai kari idli, keema parottas, and coin parotta combos drenched in rich gravy',
    sortOrder: 13,
    dishes: [
      {
        name: 'Madurai Kari Idli (3 Pcs)',
        description: 'Steaming soft rice idlis generously drenched in slow-simmered rich mutton bone gravy.',
        price: 180,
        photoId: 'photo-1589301760014-d929f3979dbc',
      },
      {
        name: 'Stuffed Keema Parotta',
        description: 'Flaky golden layered parotta stuffed with spiced minced mutton keema, served with thick salna.',
        price: 210,
        photoId: 'photo-1565557623262-b51c2513a641',
      },
      {
        name: 'Chicken Podi Dosa',
        description: 'Crisp ghee roast dosa smeared with signature spicy non-veg gun powder and shredded chicken.',
        price: 190,
        photoId: 'photo-1589301760014-d929f3979dbc',
      },
      {
        name: 'Coin Parotta with Salna (5 Pcs)',
        description: 'Bite-sized crispy flaky layered parottas served with steaming piping-hot roadside salna.',
        price: 120,
        photoId: 'photo-1506084868230-bb9d95c24759',
      },
      {
        name: 'Muttai Veechu Parotta',
        description: 'Air-stretched thin gossamer parotta folded with seasoned egg, pepper, and diced shallots.',
        price: 130,
        photoId: 'photo-1565557623262-b51c2513a641',
      },
      {
        name: 'Idiyappam with Mutton Paaya',
        description: 'Delicate steamed rice string hoppers served with rich, fragrant slow-simmered trotters broth.',
        price: 240,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
    ],
  },
  {
    category: 'Mutton Offal & Chukka (Aattukkari Special)',
    description: 'Traditional slow-cooked trotters paaya, spiced brain fry, and tender liver chukka',
    sortOrder: 14,
    dishes: [
      {
        name: 'Mutton Paaya Gravy',
        description: 'Traditional slow-cooked goat trotters stew simmered overnight with stone-ground whole aromatic spices.',
        price: 310,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
      {
        name: 'Madurai Mutton Brain Fry',
        description: 'Delicately poached goat brain sautéed with country shallots, crushed pepper, and turmeric.',
        price: 260,
        photoId: 'photo-1603894584373-5ac82b2ae398',
      },
      {
        name: 'Mutton Boti Fry',
        description: 'Rustic country-style goat tripe dry-roasted with fiery red chili, crushed garlic, and curry leaves.',
        price: 220,
        photoId: 'photo-1529193591184-b1d58069ecdd',
      },
      {
        name: 'Mutton Liver Pepper Fry',
        description: 'Tender succulent lamb liver pan-seared in roasted Malabar black pepper and shallots.',
        price: 240,
        photoId: 'photo-1603894584373-5ac82b2ae398',
      },
      {
        name: 'Mutton Thala Kari Varuval',
        description: 'Tender goat head meat roasted dry with rustic spices and cold-pressed gingelly oil.',
        price: 270,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
      {
        name: 'Nalli Chukka Varuval',
        description: 'Braised mutton shank marrow bones tossed on high-heat iron tawa with fiery Chettinad masala.',
        price: 360,
        photoId: 'photo-1603894584373-5ac82b2ae398',
      },
    ],
  },
  {
    category: 'Country Chicken Specials (Nattu Kozhi Sirappu)',
    description: 'Pallipalayam chicken, Chinthamani roasts, and free-range Kongunadu delicacies',
    sortOrder: 15,
    dishes: [
      {
        name: 'Pallipalayam Chicken',
        description: 'Erode specialty rustic chicken shallow-fried with loads of shallots, garlic, and dry red chili flakes.',
        price: 260,
        photoId: 'photo-1610057099443-fde8c4d50f91',
      },
      {
        name: 'Chinthamani Chicken',
        description: 'Kongunadu style boneless rustic chicken sautéed with broken whole red chilies and fresh curry leaves.',
        price: 250,
        photoId: 'photo-1599488615731-7e5c2823ff28',
      },
      {
        name: 'Nattu Kozhi Milagu Varuval',
        description: 'Tender country chicken dry roast heavily seasoned with stone-ground black pepper and shallots.',
        price: 270,
        photoId: 'photo-1588166524941-3bf61a9c41db',
      },
      {
        name: 'Nattu Kozhi Rasam Soru',
        description: 'Comforting bowl of hot Ponni rice mixed with piping hot country chicken pepper broth and ghee.',
        price: 220,
        photoId: 'photo-1610057099443-fde8c4d50f91',
      },
      {
        name: 'Nattu Kozhi Chettinad Masala',
        description: 'Free-range country chicken cooked in an 18-spice freshly roasted Chettinad masala gravy.',
        price: 280,
        photoId: 'photo-1588166524941-3bf61a9c41db',
      },
      {
        name: 'Kongu Nattu Kozhi Biryani',
        description: 'Fragrant Seeraga Samba rice dum-cooked with tender rustic country chicken chunks and mint.',
        price: 310,
        photoId: 'photo-1563379091339-03b21ab4a4f8',
      },
    ],
  },
  {
    category: 'Accompaniments & Dips (Thottukka)',
    description: 'Roadside mutton salna, street-style empty salnas, raitas, and tangy gravies',
    sortOrder: 16,
    dishes: [
      {
        name: 'Special Mutton Salna (Bowl)',
        description: 'Signature spicy thin street-style non-veg gravy infused with poppy seeds, fennel, and coconut.',
        price: 90,
        photoId: 'photo-1588166524941-3bf61a9c41db',
      },
      {
        name: 'Chicken Salna (Bowl)',
        description: 'Rich aromatic street-cart chicken dipping gravy made fresh for parottas and dosas.',
        price: 70,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
      {
        name: 'Street-Style Plain Salna',
        description: 'Legendary empty roadside salna with authentic tomato, onion, and roasted spice base.',
        price: 50,
        photoId: 'photo-1588166524941-3bf61a9c41db',
      },
      {
        name: 'Madurai Onion Curd Raita',
        description: 'Chilled fresh yogurt whipped with crunchy chopped shallots, green chilies, and fresh coriander.',
        price: 40,
        photoId: 'photo-1556881286-fc6915169721',
      },
      {
        name: 'Ennai Kathirikai Gravy',
        description: 'Tender baby eggplants slow-braised in a tangy tamarind, sesame, and non-veg flavored gravy.',
        price: 80,
        photoId: 'photo-1626777552726-4a6b54c97e46',
      },
      {
        name: 'Non-Veg Meals Sambar & Rasam Set',
        description: 'Piping hot lentil sambar and spicy crushed pepper garlic rasam served with papad.',
        price: 60,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
    ],
  },
  {
    category: 'Quick Rolls & Kebab Wraps',
    description: 'Tandoori chicken kathi rolls, egg parotta wraps, and shawarma pockets',
    sortOrder: 17,
    dishes: [
      {
        name: 'Chicken Tikka Kathi Roll',
        description: 'Flaky parotta rolled with clay-oven charred chicken tikka, pickled onions, and mint chutney.',
        price: 170,
        photoId: 'photo-1626777552726-4a6b54c97e46',
      },
      {
        name: 'Mutton Keema Roll',
        description: 'Spiced minced lamb keema and fluffy beaten egg wrapped inside a crisp hot parotta.',
        price: 210,
        photoId: 'photo-1565557623262-b51c2513a641',
      },
      {
        name: 'Double Egg Parotta Roll',
        description: 'Crispy parotta lined with two whisked eggs, tangy chaat masala, and crunchy red onions.',
        price: 110,
        photoId: 'photo-1565557623262-b51c2513a641',
      },
      {
        name: 'Crispy Chicken Shawarma Roll',
        description: 'Thin rumali wrap packed with spiced grilled chicken shavings, garlic toum, and pickled veggies.',
        price: 160,
        photoId: 'photo-1626777552726-4a6b54c97e46',
      },
      {
        name: 'Chettinad Chicken Wrap',
        description: 'Spicy shredded Chettinad chicken and capsicum wrapped with homemade garlic mayo.',
        price: 170,
        photoId: 'photo-1565557623262-b51c2513a641',
      },
      {
        name: 'Fiery Dragon Chicken Wrap',
        description: 'Crispy tossed Indo-Chinese dragon chicken strips bundled in a warm golden wrap.',
        price: 180,
        photoId: 'photo-1626777552726-4a6b54c97e46',
      },
    ],
  },
  {
    category: 'Signature Rice Bowls & Combos',
    description: 'Hearty one-bowl meals combining ghee rice, pepper chukka, and biryani blends',
    sortOrder: 18,
    dishes: [
      {
        name: 'Ghee Rice with Chicken Pepper Chukka',
        description: 'Fragrant Seeraga Samba ghee rice served with hot pepper chicken sukka and gravy.',
        price: 260,
        photoId: 'photo-1563379091339-03b21ab4a4f8',
      },
      {
        name: 'Kothu Biryani Special',
        description: 'Signature fusion of shredded flaky parotta and aromatic mutton biryani tossed on hot tawa.',
        price: 270,
        photoId: 'photo-1589302168068-964664d93dc0',
      },
      {
        name: 'Curd Rice with Mutton Chukka',
        description: 'Chilled comforting tempered curd rice served alongside fiery dry-roasted tender mutton chukka.',
        price: 280,
        photoId: 'photo-1603894584373-5ac82b2ae398',
      },
      {
        name: 'Sambar Rice with Vanjaram Fry',
        description: 'Hot ghee-laced lentil rice served with a crispy tawa-seared king fish fry steak.',
        price: 340,
        photoId: 'photo-1519708227418-c8fd9a32b7a2',
      },
      {
        name: 'Jeera Basmati Rice with Butter Chicken',
        description: 'Cumin-tempered long grain basmati rice accompanied by silky butter chicken makhani.',
        price: 270,
        photoId: 'photo-1633945274405-b6c8069047b0',
      },
      {
        name: 'Schezwan Rice with Chilli Chicken Bowl',
        description: 'Wok-tossed spicy chicken fried rice paired with rich gravy chilli chicken.',
        price: 250,
        photoId: 'photo-1603133872878-684f208fb84b',
      },
    ],
  },
  {
    category: 'Evening Snacks & Fry Bites',
    description: 'Crispy fried chicken pakodas, fish fingers, and mutton kola urundais',
    sortOrder: 19,
    dishes: [
      {
        name: 'Madurai Chicken Pakoda',
        description: 'Crispy, crunchy bone-in chicken fritters fried with crushed spices, cashew bits, and curry leaves.',
        price: 180,
        photoId: 'photo-1567620832903-9fc6debc209f',
      },
      {
        name: 'Crispy Chicken Popcorn',
        description: 'Tender bite-sized chicken breast poppers seasoned with smoky peri-peri spice dust.',
        price: 160,
        photoId: 'photo-1567620832903-9fc6debc209f',
      },
      {
        name: 'Crispy Mutton Kola Balls (4 Pcs)',
        description: 'Minced mutton spiced balls with crisp golden outer crust and soft flavorful core.',
        price: 200,
        photoId: 'photo-1529193591184-b1d58069ecdd',
      },
      {
        name: 'Fish Finger Fries',
        description: 'Crispy crumb-coated sea fish batons served with homemade tartar dipping sauce.',
        price: 220,
        photoId: 'photo-1534422298391-e4f8c172dddb',
      },
      {
        name: 'Golden Prawn Tempura',
        description: 'Plump butterflied ocean prawns fried in light crisp batter with sweet chili dip.',
        price: 290,
        photoId: 'photo-1559847844-5315695dadae',
      },
      {
        name: 'Chicken Keema Samosa (3 Pcs)',
        description: 'Flaky pastry pockets stuffed with minced spiced chicken, onions, and fresh mint.',
        price: 110,
        photoId: 'photo-1567620832903-9fc6debc209f',
      },
    ],
  },
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function downloadImage(photoId, filename) {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    return `products/${filename}`;
  }

  const urlsToTry = [
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&q=80`,
    ...FALLBACK_PHOTO_IDS.map((fb) => `https://images.unsplash.com/${fb}?auto=format&fit=crop&w=600&q=80`),
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
        console.log(`Downloaded image: ${filename}`);
        return `products/${filename}`;
      }
    } catch (err) {}
  }

  return `products/dragon-chicken.jpg`; // Fallback to an existing guaranteed file
}

async function main() {
  console.log('🚀 Adding 8 extra categories to Ananda Non veg...');

  for (const catData of EXTRA_CATEGORIES) {
    let category = await prisma.category.findFirst({
      where: {
        restaurantId: RESTAURANT_ID,
        name: { equals: catData.category, mode: 'insensitive' },
      },
    });

    if (category) {
      category = await prisma.category.update({
        where: { id: category.id },
        data: {
          name: catData.category,
          description: catData.description,
          sortOrder: catData.sortOrder,
          isActive: true,
          isDeleted: false,
        },
      });
      console.log(`Updated category: ${category.name}`);
    } else {
      category = await prisma.category.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId: RESTAURANT_ID,
          name: catData.category,
          description: catData.description,
          sortOrder: catData.sortOrder,
          isActive: true,
          isDeleted: false,
        },
      });
      console.log(`Created category: ${category.name}`);
    }

    // Process dishes
    for (const dish of catData.dishes) {
      const slug = slugify(dish.name);
      const filename = `${slug}.jpg`;
      const imageUrl = await downloadImage(dish.photoId, filename);

      let product = await prisma.product.findFirst({
        where: {
          restaurantId: RESTAURANT_ID,
          name: { equals: dish.name, mode: 'insensitive' },
        },
      });

      if (product) {
        product = await prisma.product.update({
          where: { id: product.id },
          data: {
            categoryId: category.id,
            description: dish.description,
            basePrice: dish.price,
            ...(imageUrl ? { imageUrl } : {}),
            isDeleted: false,
          },
        });
        console.log(`  Updated dish: ${product.name} (₹${product.basePrice})`);
      } else {
        product = await prisma.product.create({
          data: {
            id: crypto.randomUUID(),
            restaurantId: RESTAURANT_ID,
            categoryId: category.id,
            name: dish.name,
            description: dish.description,
            basePrice: dish.price,
            imageUrl: imageUrl || null,
            isDeleted: false,
          },
        });
        console.log(`  Created dish: ${product.name} (₹${product.basePrice})`);
      }

      // Link product to both branches
      for (const branchId of BRANCH_IDS) {
        await prisma.branchProduct.upsert({
          where: {
            branchId_productId: {
              branchId,
              productId: product.id,
            },
          },
          update: {
            isAvailable: true,
            isEnabled: true,
          },
          create: {
            id: crypto.randomUUID(),
            branchId,
            productId: product.id,
            isAvailable: true,
            isEnabled: true,
          },
        });
      }
    }
  }

  console.log('✅ All 8 extra categories and dishes successfully added!');
}

main()
  .catch((e) => {
    console.error('Error adding extra categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

