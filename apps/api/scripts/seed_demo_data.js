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

// Fallback high-quality image IDs if any specific one fails
const FALLBACK_PHOTO_IDS = [
  'photo-1563379091339-03b21ab4a4f8',
  'photo-1546833999-b9f581a1996d',
  'photo-1626082927389-6cd097cdc6ec',
  'photo-1603894584373-5ac82b2ae398',
  'photo-1565557623262-b51c2513a641',
];

const MENU_DATA = [
  {
    category: 'Soups & Shorbas',
    description: 'Slow-simmered aromatic broths, traditional country soups and warming bowls',
    dishes: [
      {
        name: 'Mutton Bone Shorba',
        description: 'Slow-simmered rich mutton bone marrow broth infused with crushed black pepper, shallots, and fragrant Chettinad spices.',
        price: 180,
        photoId: 'photo-1547592166-23ac45744acd',
      },
      {
        name: 'Nattu Kozhi Soup',
        description: 'Traditional free-range country chicken broth simmered with roasted coriander seeds, garlic cloves, and fresh curry leaves.',
        price: 160,
        photoId: 'photo-1604152135912-04a022e23696',
      },
      {
        name: 'Crab Pepper Soup',
        description: 'Fiery aromatic mud crab soup infused with crushed Tellicherry black pepper, cumin, and fresh cilantro.',
        price: 190,
        photoId: 'photo-1547592180-85f173990554',
      },
      {
        name: 'Chicken Sweet Corn Soup',
        description: 'Warm comforting creamy sweet corn soup with shredded chicken breast and velvety egg drop ribbons.',
        price: 150,
        photoId: 'photo-1547592166-23ac45744acd',
      },
      {
        name: 'Chicken Hot & Sour Soup',
        description: 'Tangy and spicy thick broth packed with tender chicken strips, black fungus, bamboo shoots, and green chili.',
        price: 150,
        photoId: 'photo-1604152135912-04a022e23696',
      },
      {
        name: 'Chicken Manchow Soup',
        description: 'Spicy Indo-Chinese chicken garlic soup served piping hot, crowned with crisp fried noodles and scallions.',
        price: 160,
        photoId: 'photo-1547592180-85f173990554',
      },
    ],
  },
  {
    category: 'Non-Veg Starters & Appetizers',
    description: 'Crispy fried chicken, pan-seared mutton varuval, and fiery dry roasts',
    dishes: [
      {
        name: 'Dragon Chicken',
        description: 'Crispy tender chicken strips tossed in fiery sweet-spicy sauce with roasted cashews, bell peppers, and scallions.',
        price: 200,
        photoId: 'photo-1626082927389-6cd097cdc6ec',
        existingId: 'c8afc9c4-0a22-4d93-9e8e-f4a776c02496', // Keep existing DB id for order history integrity
        existingImage: 'products/1793264878600-b6aa5f99-a40f-4939-8ab9-e13580cedfa6.jpg',
      },
      {
        name: 'Chicken 65',
        description: 'Authentic Chennai style deep-fried boneless chicken bites marinated in spiced curd, Kashmiri chili, and curry leaves.',
        price: 190,
        photoId: 'photo-1626082927389-6cd097cdc6ec',
      },
      {
        name: 'Pepper Chicken Sukka',
        description: 'Tender pan-seared chicken chunks roasted dry with freshly cracked black pepper, fennel seeds, and caramelized shallots.',
        price: 220,
        photoId: 'photo-1599488615731-7e5c2823ff28',
      },
      {
        name: 'Madurai Mutton Chukka',
        description: 'Iconic tender goat meat slow-roasted in an iron skillet with stone-ground spices, curry leaves, and country shallots.',
        price: 320,
        photoId: 'photo-1603894584373-5ac82b2ae398',
      },
      {
        name: 'Madurai Mutton Kola Urundai',
        description: 'Crispy golden fried meatballs made from spiced minced lamb, roasted gram flour, and fresh herbs.',
        price: 260,
        photoId: 'photo-1529193591184-b1d58069ecdd',
      },
      {
        name: 'Nattu Kozhi Varuval',
        description: 'Free-range country chicken stir-fried dry in rustic village style with freshly pounded masala and gingelly oil.',
        price: 240,
        photoId: 'photo-1610057099443-fde8c4d50f91',
      },
      {
        name: 'Crispy Chicken Lollipop',
        description: 'Indo-Chinese style frenched chicken winglets marinated in chili garlic, battered, and fried until crunchily golden.',
        price: 210,
        photoId: 'photo-1567620832903-9fc6debc209f',
      },
    ],
  },
  {
    category: 'Seafood Delicacies',
    description: 'Fresh sea catches, spiced king fish fry, juicy prawn roasts, and crab curries',
    dishes: [
      {
        name: 'Vanjaram Fish Fry (King Fish)',
        description: 'Prime cut seer fish steak seasoned in spicy red chili lemon marinade and shallow-fried crisp on an iron tawa.',
        price: 360,
        photoId: 'photo-1519708227418-c8fd9a32b7a2',
      },
      {
        name: 'Prawn Ghee Roast',
        description: 'Plump tiger prawns cooked to perfection in rich golden dairy ghee with tangy Byadgi chili masala paste.',
        price: 340,
        photoId: 'photo-1559847844-5315695dadae',
      },
      {
        name: 'Chettinad Crab Masala',
        description: 'Fresh mud crab braised semi-dry in a fiery Chettinad shallot, garlic, and freshly cracked black pepper gravy.',
        price: 350,
        photoId: 'photo-1565680018434-b513d5e5fd47',
      },
      {
        name: 'Crispy Nethili Fish Fry',
        description: 'Crispy shallow-fried golden anchovies coated in aromatic spice blend with fried green chilies and curry leaves.',
        price: 190,
        photoId: 'photo-1519708227418-c8fd9a32b7a2',
      },
      {
        name: 'Squid Pepper Fry',
        description: 'Tender calamari rings flash-sautéed with cracked Tellicherry black pepper, curry leaves, and sweet onions.',
        price: 290,
        photoId: 'photo-1534422298391-e4f8c172dddb',
      },
      {
        name: 'Meen Pollichathu',
        description: 'Fresh coastal fish coated in rich masala, wrapped in tender banana leaves, and pan-charred over low flame.',
        price: 380,
        photoId: 'photo-1544025162-d76694265947',
      },
    ],
  },
  {
    category: 'Biryani & Pulao',
    description: 'Legendary wood-fire dum biryanis made with authentic Seeraga Samba and Basmati rice',
    dishes: [
      {
        name: 'Dindigul Seeraga Samba Chicken Biryani',
        description: 'Signature aromatic short-grain Seeraga Samba rice simmered with tender chicken, curd, mint, and secret whole spices.',
        price: 240,
        photoId: 'photo-1563379091339-03b21ab4a4f8',
      },
      {
        name: 'Thalassery Mutton Biryani',
        description: 'Fragrant kaima rice biryani with succulent bone-in lamb, garnished with golden fried cashews and raisins.',
        price: 340,
        photoId: 'photo-1589302168068-964664d93dc0',
      },
      {
        name: 'Hyderabadi Dum Chicken Biryani',
        description: 'Aromatic basmati rice sealed and slow dum-cooked with saffron, rose water, and yogurt-marinated spicy chicken.',
        price: 260,
        photoId: 'photo-1633945274405-b6c8069047b0',
      },
      {
        name: 'Special Prawn Biryani',
        description: 'Seeraga Samba rice layered with juicy masala-spiced ocean prawns, coriander, and caramelized shallots.',
        price: 360,
        photoId: 'photo-1563379091339-03b21ab4a4f8',
      },
      {
        name: 'Madurai Mutton Kari Soru',
        description: 'Traditional Madurai meat-infused rice cooked in rich lamb marrow stock, tender mutton cubes, and ghee.',
        price: 350,
        photoId: 'photo-1589302168068-964664d93dc0',
      },
      {
        name: 'Egg Biryani',
        description: 'Flavorful biryani rice served with two golden pan-roasted boiled eggs, spiced brinjal salna, and creamy onion raita.',
        price: 180,
        photoId: 'photo-1633945274405-b6c8069047b0',
      },
    ],
  },
  {
    category: 'Non-Veg Gravies & Curries',
    description: 'Stone-ground coconut curries, rich mutton korma, and spicy Chettinad gravies',
    dishes: [
      {
        name: 'Chettinad Chicken Curry',
        description: 'Tender chicken simmered slowly in stone-ground coconut, fennel, star anise, and whole red chili gravy.',
        price: 230,
        photoId: 'photo-1588166524941-3bf61a9c41db',
      },
      {
        name: 'Madurai Kari Kuzhambu',
        description: 'Authentic Madurai style rustic mutton curry with bone marrow and tender goat chunks in rich spiced broth.',
        price: 330,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
      {
        name: 'Butter Chicken Masala',
        description: 'Charcoal-tandoor grilled chicken tikka simmered in a velvety smooth buttery tomato-cashew makhani gravy.',
        price: 250,
        photoId: 'photo-1603894584373-5ac82b2ae398',
      },
      {
        name: 'Alleppey Fish Curry',
        description: 'Fresh catch cooked in delicate coconut milk sauce infused with raw green mangoes, mustard, and curry leaves.',
        price: 310,
        photoId: 'photo-1626777552726-4a6b54c97e46',
      },
      {
        name: 'Kadai Chicken',
        description: 'Juicy chicken pieces tossed in wok with crunchy bell peppers, onions, and freshly roasted coriander spice mix.',
        price: 240,
        photoId: 'photo-1588166524941-3bf61a9c41db',
      },
      {
        name: 'Nalli Elumbu Kuzhambu',
        description: 'Decadent slow-cooked mutton shank marrow bones simmered in thick peppery village-style gravy.',
        price: 380,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
    ],
  },
  {
    category: 'Tandoori & Kebabs',
    description: 'Clay oven delicacies charred over red-hot coals with authentic spices',
    dishes: [
      {
        name: 'Tandoori Chicken (Half)',
        description: 'Tender bone-in chicken marinated in spiced hung yogurt, Kashmiri degi mirch, and roasted in high-heat clay tandoor.',
        price: 260,
        photoId: 'photo-1598515214211-89d3c73ae83b',
      },
      {
        name: 'Murgh Malai Tikka',
        description: 'Boneless chicken cubes steeped in fresh dairy cream, hung curd, melted cheese, and fragrant green cardamom.',
        price: 270,
        photoId: 'photo-1599488615731-7e5c2823ff28',
      },
      {
        name: 'Mutton Seekh Kebab',
        description: 'Spiced minced goat meat blended with chopped mint, coriander, and ginger, skewers grilled over glowing coals.',
        price: 320,
        photoId: 'photo-1555939594-58d7cb561ad1',
      },
      {
        name: 'Hariyali Chicken Kebab',
        description: 'Juicy chicken bites coated in emerald green marinade of fresh garden mint, coriander leaves, and green chilies.',
        price: 250,
        photoId: 'photo-1603360946369-dc9bb6258143',
      },
      {
        name: 'Fish Tikka',
        description: 'Boneless fish cubes marinated in roasted gram flour, carom seeds (ajwain), and mustard oil, grilled in tandoor.',
        price: 330,
        photoId: 'photo-1519708227418-c8fd9a32b7a2',
      },
      {
        name: 'Tangdi Kebab',
        description: 'Plump chicken drumsticks stuffed with savory minced meat, cheese, and grilled to juicy golden perfection.',
        price: 280,
        photoId: 'photo-1626082927389-6cd097cdc6ec',
      },
    ],
  },
  {
    category: 'Breads & Parottas',
    description: 'Flaky layered Malabar parottas, Madurai bun parottas, and piping hot kothus',
    dishes: [
      {
        name: 'Malabar Parotta (2 Pcs)',
        description: 'Signature flaky, golden, layered flatbread beaten hot and served with complimentary non-veg salna.',
        price: 60,
        photoId: 'photo-1565557623262-b51c2513a641',
      },
      {
        name: 'Madurai Bun Parotta',
        description: 'Iconic Madurai spiral layered bread, deeply fried golden-crisp on outside and soft pillowy inside.',
        price: 50,
        photoId: 'photo-1506084868230-bb9d95c24759',
      },
      {
        name: 'Ceylon Egg Kothu Parotta',
        description: 'Flaky parotta shredded and vigorously beaten on hot tawa with fluffy eggs, onions, green chili, and chicken salna.',
        price: 180,
        photoId: 'photo-1601050690597-df0568f70950',
      },
      {
        name: 'Chicken Kothu Parotta',
        description: 'Tawa-shredded flaky parotta stir-fried with tender chicken chunks, scrambled egg, curry leaves, and spicy salna.',
        price: 220,
        photoId: 'photo-1601050690597-df0568f70950',
      },
      {
        name: 'Madurai Mutton Kari Dosa',
        description: 'Thick savory sponge dosa layered with fluffy beaten egg and generous topping of fiery minced mutton chukka.',
        price: 260,
        photoId: 'photo-1589301760014-d929f3979dbc',
      },
      {
        name: 'Garlic Butter Naan',
        description: 'Tandoor baked leavened bread brushed generously with minced garlic and melted salted dairy butter.',
        price: 70,
        photoId: 'photo-1513104890138-7c749659a591',
      },
    ],
  },
  {
    category: 'Traditional Meals & Combos',
    description: 'Grand festive banana leaf meals, curated biryani platters, and executive feasts',
    dishes: [
      {
        name: 'Ananda Non-Veg Special Thali',
        description: 'Grand banana leaf feast with Ponni rice, mutton gravy, chicken curry, fish curry, rasam, curd, and appalam.',
        price: 360,
        photoId: 'photo-1610057099443-fde8c4d50f91',
      },
      {
        name: 'Chicken Biryani Combo Meal',
        description: 'Dindigul chicken biryani served with crispy chicken 65 (2 pcs), spiced boiled egg, salna, raita, and sweet.',
        price: 310,
        photoId: 'photo-1563379091339-03b21ab4a4f8',
      },
      {
        name: 'Mutton Feast Meal',
        description: 'Complete South Indian meals served with side of Madurai mutton chukka, bone broth, and fluffy egg omelette.',
        price: 440,
        photoId: 'photo-1546833999-b9f581a1996d',
      },
      {
        name: 'Seafood Platter Combo',
        description: 'Steamed rice with Alleppey fish curry, Vanjaram fish fry steak, crispy prawn masala, and pepper rasam.',
        price: 480,
        photoId: 'photo-1519708227418-c8fd9a32b7a2',
      },
      {
        name: 'Executive Chicken Meal Box',
        description: 'Single diner box with steamed rice, home-style chicken curry, boiled egg, Malabar parotta (1 pc), and sweet.',
        price: 240,
        photoId: 'photo-1588166524941-3bf61a9c41db',
      },
      {
        name: 'Country Chicken Feast',
        description: 'Rustic Nattu Kozhi curry, hot white rice, traditional pepper rasam, and country chicken sukka side.',
        price: 380,
        photoId: 'photo-1610057099443-fde8c4d50f91',
      },
    ],
  },
  {
    category: 'Indo-Chinese Specialties',
    description: 'Flavorsome wok-tossed fried rice, spicy hakka noodles, and Manchurian sauced chicken',
    dishes: [
      {
        name: 'Chilli Chicken Gravy',
        description: 'Tender wok-tossed chicken chunks with crunchy capsicum, sweet onions, green chilies, and dark soy reduction.',
        price: 220,
        photoId: 'photo-1569718212165-3a8278d5f624',
      },
      {
        name: 'Chicken Fried Rice',
        description: 'Fragrant long-grain rice tossed in piping wok with scrambled egg, shredded chicken, and spring onions.',
        price: 210,
        photoId: 'photo-1603133872878-684f208fb84b',
      },
      {
        name: 'Schezwan Chicken Noodles',
        description: 'Wok-fried Hakka noodles stir-fried with juicy chicken strips, cabbage, and homemade spicy Schezwan sauce.',
        price: 220,
        photoId: 'photo-1585032226651-759b368d7246',
      },
      {
        name: 'Prawn Fried Rice',
        description: 'Classic wok-tossed rice loaded with plump butter-fried tiger prawns, egg shreds, and garlic scallions.',
        price: 260,
        photoId: 'photo-1603133872878-684f208fb84b',
      },
      {
        name: 'Crispy Honey Chilli Chicken',
        description: 'Crunchy batter-fried chicken tossed in a glossy glaze of spicy red chili paste, toasted sesame, and honey.',
        price: 230,
        photoId: 'photo-1567620832903-9fc6debc209f',
      },
      {
        name: 'Chicken Manchurian',
        description: 'Tender chicken meatballs wok-simmered in tangy soy-garlic coriander gravy with green chilies.',
        price: 220,
        photoId: 'photo-1569718212165-3a8278d5f624',
      },
    ],
  },
  {
    category: 'Desserts & Sweet Endings',
    description: 'Authentic Madurai Jigarthanda, creamy elaneer payasam, and royal Indian sweets',
    dishes: [
      {
        name: 'Madurai Jigarthanda Special',
        description: 'Iconic Madurai dessert drink prepared with almond gum (badam pisin), nannari syrup, basundi, and ice cream.',
        price: 110,
        photoId: 'photo-1551024709-8f23befc6f87',
      },
      {
        name: 'Elaneer Payasam',
        description: 'Creamy luxurious pudding prepared with freshly harvested tender coconut pulp, coconut milk, and cardamom.',
        price: 130,
        photoId: 'photo-1579954115545-a95591f28bfc',
      },
      {
        name: 'Gulab Jamun with Ice Cream',
        description: 'Warm golden khoya dumplings steeped in rose cardamom syrup served beside a scoop of vanilla ice cream.',
        price: 100,
        photoId: 'photo-1501443762994-82bd5dace89a',
      },
      {
        name: 'Royal Shahi Tukda',
        description: 'Crispy ghee-fried bread triangles soaked in saffron sugar syrup, smothered in rich thickened rabri and pistachios.',
        price: 120,
        photoId: 'photo-1551024709-8f23befc6f87',
      },
      {
        name: 'Matka Kulfi',
        description: 'Traditional slow-churned creamy dense Indian ice cream infused with saffron and pistachios in a clay pot.',
        price: 90,
        photoId: 'photo-1563805042-7684c019e1cb',
      },
      {
        name: 'Mango Malai Kulfi',
        description: 'Rich creamy kulfi stick made with 100% natural Alphonso mango pulp and condensed milk.',
        price: 100,
        photoId: 'photo-1563805042-7684c019e1cb',
      },
    ],
  },
  {
    category: 'Beverages & Coolers',
    description: 'Refreshing traditional thirst quenchers, Madurai degree coffee, and milk coolers',
    dishes: [
      {
        name: 'Nannari Sarbath',
        description: 'Traditional Ayurvedic cooling root syrup beverage served ice-cold with freshly squeezed lime juice.',
        price: 60,
        photoId: 'photo-1513558161293-cdaf765ed2fd',
      },
      {
        name: 'Masala Butter Milk (Neer Mor)',
        description: 'Refreshing churned yogurt cooler tempered with crushed ginger, green chili, asafoetida, and curry leaves.',
        price: 50,
        photoId: 'photo-1556881286-fc6915169721',
      },
      {
        name: 'Fresh Lime Soda',
        description: 'Effervescent chilled soda stirred with fresh lime juice, mint leaves, and a pinch of black rock salt.',
        price: 50,
        photoId: 'photo-1513558161293-cdaf765ed2fd',
      },
      {
        name: 'Madurai Degree Filter Coffee',
        description: 'Freshly brewed dark chicory decoction whipped with hot foaming full-cream milk in traditional brass davarah.',
        price: 45,
        photoId: 'photo-1544787219-7f47ccb76574',
      },
      {
        name: 'Mango Lassi',
        description: 'Thick luscious chilled yogurt smoothie blended with ripe Alphonso mangoes and a touch of cardamom.',
        price: 90,
        photoId: 'photo-1556881286-fc6915169721',
      },
      {
        name: 'Rose Milk Cooler',
        description: 'Fragrant vintage rose syrup blended with chilled milk and soaked sweet sabja basil seeds.',
        price: 60,
        photoId: 'photo-1536935338788-846bb9981813',
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
    } catch (err) {
      // Try next url
    }
  }

  console.warn(`Could not download image for ${filename}, skipping`);
  return null;
}

async function main() {
  console.log('🚀 Starting demo data feeding for Ananda Non veg...');

  // 1. Ensure Demo Owner User exists
  console.log('Step 1: Ensuring demo owner account exists...');
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  const ownerUser = await prisma.user.upsert({
    where: { email: 'demo@yopmail.com' },
    update: { name: 'Demo Owner' },
    create: {
      id: 'd0000000-0000-0000-0000-000000000001',
      email: 'demo@yopmail.com',
      passwordHash,
      name: 'Demo Owner',
      role: 'ADMIN',
    },
  });
  console.log(`Owner account ready: ${ownerUser.email}`);

  // 1.1 Ensure Restaurant exists
  const restaurant = await prisma.restaurant.upsert({
    where: { id: RESTAURANT_ID },
    update: { name: 'Ananda Non veg' },
    create: {
      id: RESTAURANT_ID,
      ownerId: ownerUser.id,
      name: 'Ananda Non veg',
      slug: 'ananda-non-veg',
      description: 'Authentic South Indian & Chettinad Non-Veg Cuisine',
      defaultCurrency: 'INR',
    },
  });
  console.log(`Restaurant ready: ${restaurant.name} (${restaurant.slug})`);

  // 1.2 Ensure Branches exist
  const branch1 = await prisma.branch.upsert({
    where: { id: BRANCH_IDS[0] },
    update: { name: 'Theppakulam Branch' },
    create: {
      id: BRANCH_IDS[0],
      restaurantId: restaurant.id,
      name: 'Theppakulam Branch',
      slug: 'ananda-non-veg-theppakulam',
      address: '14 East Veli Street, Near Theppakulam, Madurai',
      phone: '9876543210',
      currency: 'INR',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: BRANCH_IDS[1] },
    update: { name: 'Downtown Branch' },
    create: {
      id: BRANCH_IDS[1],
      restaurantId: restaurant.id,
      name: 'Downtown Branch',
      slug: 'downtown-branch',
      address: '42 Main Boulevard, Downtown',
      phone: '9876543211',
      currency: 'INR',
    },
  });
  console.log(`Branches ready: ${branch1.slug}, ${branch2.slug}`);

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // 2. Fetch existing categories and products for Ananda Non veg
  const existingCategories = await prisma.category.findMany({
    where: { restaurantId: RESTAURANT_ID, isDeleted: false },
  });
  console.log(`Found ${existingCategories.length} existing categories.`);

  let totalProductsAdded = 0;
  let totalBranchProductsAdded = 0;

  for (let cIdx = 0; cIdx < MENU_DATA.length; cIdx++) {
    const catData = MENU_DATA[cIdx];
    const sortOrder = cIdx + 1;

    // Check if category already exists by exact or matching name
    let category = existingCategories.find(
      (c) => c.name.toLowerCase() === catData.category.toLowerCase() ||
             (catData.category.includes('Starters') && c.name.toLowerCase().includes('starter'))
    );

    if (category) {
      category = await prisma.category.update({
        where: { id: category.id },
        data: {
          name: catData.category,
          description: catData.description,
          sortOrder,
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
          sortOrder,
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

      let imageUrl = dish.existingImage;
      if (!imageUrl) {
        imageUrl = await downloadImage(dish.photoId, filename);
      }

      // Check if product exists
      let product = null;
      if (dish.existingId) {
        product = await prisma.product.findUnique({ where: { id: dish.existingId } });
      }

      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            restaurantId: RESTAURANT_ID,
            name: { equals: dish.name, mode: 'insensitive' },
          },
        });
      }

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
        totalProductsAdded++;
        console.log(`  Created dish: ${product.name} (₹${product.basePrice})`);
      }

      // Link product to both branches in branch_products
      for (const branchId of BRANCH_IDS) {
        const bp = await prisma.branchProduct.upsert({
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
        totalBranchProductsAdded++;
      }
    }
  }

  console.log('✅ Demo data seeding completed successfully!');
  console.log(`Summary:`);
  console.log(`- Categories: ${MENU_DATA.length}`);
  console.log(`- Total dishes processed: ${MENU_DATA.reduce((acc, c) => acc + c.dishes.length, 0)}`);
  console.log(`- Owner credentials: demo@yopmail.com / 123456`);
}

main()
  .catch((e) => {
    console.error('Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

