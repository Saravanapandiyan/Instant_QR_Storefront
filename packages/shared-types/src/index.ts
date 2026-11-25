// 1. User Roles
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'OWNER';

// 2. User Profile Object
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  countryCode: string | null;
  phone: string | null;
  isPlatformAdmin?: boolean;
  staffProfiles?: StaffMember[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 3. User Register & Login Inputs
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  countryCode?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface BootstrapSuperAdminInput {
  email: string;
  password: string;
  name: string;
  countryCode?: string;
  phone?: string;
  setupKey?: string;
}

export interface AdminStatusResponse {
  hasSuperAdmin: boolean;
  totalSuperAdmins: number;
}

// 4. Currencies
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

// 4.1 Storefront Theme Config (Customer App Branding)
export interface StorefrontThemePalette {
  primary: string;       // Buttons, active badges, highlights, floating cart bar
  background: string;    // Main page canvas background
  surface: string;       // Food cards, category pill containers, header
  text: string;          // Main headings, dish titles
  textMuted: string;     // Subtext, descriptions, item count
}

export interface StorefrontThemeConfig {
  presetId?: string;     // E.g. 'terracotta' | 'emerald' | 'crimson' | 'amber' | 'espresso' | 'ocean' | 'midnight' | 'custom'
  receiptWidth?: '80mm' | '58mm';
  light: StorefrontThemePalette;
  dark: StorefrontThemePalette;
}

// 5. Restaurant Object (Parent Concept & Master Menu Catalog Holder)
export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  defaultCurrency?: string;
  creditBalance?: number;
  themeConfig?: StorefrontThemeConfig | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  branches?: Branch[];
  _count?: {
    branches?: number;
    categories?: number;
    products?: number;
  };
}

export interface CreateRestaurantInput {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  defaultCurrency?: string;
  creditBalance?: number;
  themeConfig?: StorefrontThemeConfig | null;
}

export type UpdateRestaurantInput = Partial<CreateRestaurantInput>;

// 6. Branch Object (Physical Storefront Location with QR Code)
export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  slug: string; // Customer QR scan storefront slug: /r/:slug
  address: string | null;
  phone: string | null;
  countryCode: string | null;
  currency?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  restaurant?: Restaurant;
}

export interface CreateBranchInput {
  restaurantId: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  currency?: string;
}

export type UpdateBranchInput = Partial<Omit<CreateBranchInput, 'restaurantId'>>;

// 6. Category Object (Belongs to Restaurant Master Catalog)
export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  translations?: Record<string, { name?: string; description?: string }> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    products?: number;
  };
}

export interface CreateCategoryInput {
  restaurantId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, 'restaurantId'>>;

// 7. Product Object (Belongs to Restaurant Master Catalog)
export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: number | string;
  imageUrl: string | null;
  translations?: Record<string, { name?: string; description?: string }> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  category?: Category;
  branchProducts?: BranchProduct[];
}

export interface CreateProductInput {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number | string;
  imageUrl?: string;
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'restaurantId'>>;

// 8. BranchProduct Object (Local Availability & Override Junction Table)
export interface BranchProduct {
  id: string;
  branchId: string;
  productId: string;
  isAvailable: boolean; // In Stock / Sold Out at THIS branch
  priceOverride: number | string | null;
  isEnabled: boolean;
  product?: Product;
  branch?: Branch;
}

export interface UpdateBranchProductInput {
  isAvailable?: boolean;
  priceOverride?: number | string | null;
  isEnabled?: boolean;
}

// 9. Staff & Role Permissions Management
export type StaffRole = 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'CUSTOM';

export interface ModulePermissions {
  view: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  [key: string]: boolean | undefined;
}

export interface PagePermissions {
  overview: boolean;     // Overview (/)
  orders: boolean;       // Live Orders (/orders)
  kds: boolean;          // Kitchen (KDS) (/kds)
  tv: boolean;           // TV Order Board (/tv)
  analytics: boolean;    // Sales & Analytics (/analytics)
  branches: boolean;     // Branches (/branches)
  menu: boolean;         // Digital Menu (/menu)
  staff: boolean;        // Staff & Roles (/staff)
  billing: boolean;      // Plans & Credits (/billing)
  payments: boolean;     // Payment Settings (/payments)
}

export interface StaffPermissions {
  pages?: PagePermissions;
  orders: {
    view: boolean;
    accept: boolean;
    collectCash: boolean;
    cancel: boolean;
  };
  menu: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    toggleStock: boolean;
  };
  branches: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manageTables: boolean;
  };
  overview: {
    view: boolean;
    viewFinancials: boolean;
  };
  payments: {
    view: boolean;
    manage: boolean;
  };
  staff: {
    view: boolean;
    manage: boolean;
  };
}

export const ROLE_PRESET_PERMISSIONS: Record<StaffRole, StaffPermissions> = {
  MANAGER: {
    pages: {
      overview: true,
      orders: true,
      kds: true,
      tv: true,
      analytics: true,
      branches: true,
      menu: true,
      staff: false,
      billing: false,
      payments: false,
    },
    orders: { view: true, accept: true, collectCash: true, cancel: true },
    menu: { view: true, create: true, edit: true, delete: true, toggleStock: true },
    branches: { view: true, create: true, edit: true, delete: false, manageTables: true },
    overview: { view: true, viewFinancials: true },
    payments: { view: true, manage: false },
    staff: { view: true, manage: false },
  },
  CASHIER: {
    pages: {
      overview: false,
      orders: true,
      kds: true,
      tv: false,
      analytics: false,
      branches: false,
      menu: false,
      staff: false,
      billing: false,
      payments: false,
    },
    orders: { view: true, accept: true, collectCash: true, cancel: false },
    menu: { view: true, create: false, edit: false, delete: false, toggleStock: true },
    branches: { view: true, create: false, edit: false, delete: false, manageTables: false },
    overview: { view: true, viewFinancials: false },
    payments: { view: false, manage: false },
    staff: { view: false, manage: false },
  },
  KITCHEN: {
    pages: {
      overview: false,
      orders: false,
      kds: true,
      tv: false,
      analytics: false,
      branches: false,
      menu: false,
      staff: false,
      billing: false,
      payments: false,
    },
    orders: { view: true, accept: true, collectCash: false, cancel: false },
    menu: { view: true, create: false, edit: false, delete: false, toggleStock: true },
    branches: { view: false, create: false, edit: false, delete: false, manageTables: false },
    overview: { view: false, viewFinancials: false },
    payments: { view: false, manage: false },
    staff: { view: false, manage: false },
  },
  CUSTOM: {
    pages: {
      overview: false,
      orders: true,
      kds: true,
      tv: false,
      analytics: false,
      branches: false,
      menu: false,
      staff: false,
      billing: false,
      payments: false,
    },
    orders: { view: true, accept: true, collectCash: false, cancel: false },
    menu: { view: true, create: false, edit: false, delete: false, toggleStock: false },
    branches: { view: true, create: false, edit: false, delete: false, manageTables: false },
    overview: { view: true, viewFinancials: false },
    payments: { view: false, manage: false },
    staff: { view: false, manage: false },
  },
};

export interface StaffMember {
  id: string;
  restaurantId: string;
  userId: string;
  role: StaffRole | string;
  assignedBranches: string[]; // ["ALL"] or list of branch IDs
  permissions: StaffPermissions;
  isActive: boolean;
  pinCode?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    countryCode?: string | null;
    role: Role;
  };
  restaurant?: {
    id: string;
    name: string;
  };
}

export interface CreateStaffInput {
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  password?: string;
  pinCode?: string;
  role: StaffRole | string;
  assignedBranches: string[]; // ["ALL"] or array of branch IDs
  permissions: StaffPermissions;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  password?: string;
  pinCode?: string;
  role?: StaffRole | string;
  assignedBranches?: string[];
  permissions?: StaffPermissions;
  isActive?: boolean;
}

// 10. Restaurant Table Object (Table QR Ordering & Floor Management)
export interface RestaurantTable {
  id: string;
  branchId: string;
  tableNumber: string;
  section: string;
  capacity: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  activeOrder?: {
    id: string;
    orderNumber: number;
    status: string;
    totalAmount: number;
    customerName: string;
    itemCount: number;
    elapsedSeconds: number;
    createdAt: string;
  } | null;
}

export interface CreateTableInput {
  branchId: string;
  tableNumber: string;
  section?: string;
  capacity?: number;
}

export interface BulkCreateTablesInput {
  branchId: string;
  section?: string;
  prefix?: string;
  startNumber: number;
  count: number;
  capacity?: number;
}
