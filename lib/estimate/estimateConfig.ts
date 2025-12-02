// Estimate Configuration - Pricing data matching your quote format

export interface ModuleConfig {
  id: string;
  name: string;
  listPrice: number;
  included: boolean;
  comingSoon?: boolean;
  freeWithSubscription?: boolean;
  notes?: string;
}

export interface TierConfig {
  tier: number;
  minUsers: number;
  maxUsers: number;
  serverStorage: number;
  onboardingPrice: number;
}

// User Cost Configuration
export const USER_COST_BASE = 16.59;
export const USER_DISCOUNT_RATE = 0.40; // 40% discount = $9.95 effective
export const EFFECTIVE_USER_COST = USER_COST_BASE * (1 - USER_DISCOUNT_RATE); // $9.95

// Standard Discounts
export const STANDARD_DISCOUNTS = {
  earlyAdopter: {
    id: 'early_adopter',
    name: 'Early Adopter Discount',
    percentage: 20,
    appliedTo: 'modules' as const,
  },
  niaRegional: {
    id: 'nia_regional',
    name: 'NIA / Regional Association Discount',
    percentage: 10,
    appliedTo: 'all' as const,
  },
  onboarding: {
    id: 'onboarding_discount',
    name: 'Onboarding Discount',
    percentage: 30,
    appliedTo: 'subtotal' as const,
  },
};

// Payment Frequency Discounts
export const PAYMENT_DISCOUNTS = {
  monthly: 0,
  quarterly: 8.3, // 8.3% discount
  annual: 16.7, // 16.7% discount
};

// Tax Configuration
export const TAX_RATE = 13; // 13% HST (Ontario)

// Module List with Pricing
export const MODULES: ModuleConfig[] = [
  {
    id: 'core',
    name: 'Core Module',
    listPrice: 0,
    included: true,
    freeWithSubscription: true,
    notes: 'Free with all subscriptions',
  },
  {
    id: 'crm_sales',
    name: 'CRM, Sales & Estimation',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'scheduling',
    name: 'Scheduling & Dispatch',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'timesheets',
    name: 'Timesheets & Workforce Admin',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'equipment',
    name: 'Equipment & Asset Mgmt',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'job_financials',
    name: 'Job Financials & Cost Control',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'project_mgmt',
    name: 'Project Mgmt',
    listPrice: 399.99,
    included: true,
    notes: 'beta',
  },
  {
    id: 'po_inventory',
    name: 'PO & Inventory Mgmt',
    listPrice: 399.99,
    included: true,
    comingSoon: true,
  },
  {
    id: 'safety_forms',
    name: 'Safety & Forms',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'training',
    name: 'Training & Compliance',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'progress_billing',
    name: 'Progress Billing & Invoicing',
    listPrice: 399.99,
    included: true,
  },
  {
    id: 'accounting',
    name: 'Accounting Integration',
    listPrice: 299.99,
    included: true,
  },
  {
    id: 'hr_onboarding',
    name: 'HR Onboarding',
    listPrice: 299.99,
    included: true,
  },
  {
    id: 'intelligence',
    name: 'Appello Intelligence',
    listPrice: 299.99,
    included: true,
    comingSoon: true,
  },
];

// Tier Configuration
export const TIERS: TierConfig[] = [
  { tier: 1, minUsers: 1, maxUsers: 10, serverStorage: 199.99, onboardingPrice: 7000 },
  { tier: 2, minUsers: 11, maxUsers: 25, serverStorage: 299.99, onboardingPrice: 10500 },
  { tier: 3, minUsers: 26, maxUsers: 50, serverStorage: 399.99, onboardingPrice: 14000 },
  { tier: 4, minUsers: 51, maxUsers: 100, serverStorage: 499.99, onboardingPrice: 17500 },
  { tier: 5, minUsers: 101, maxUsers: 200, serverStorage: 599.99, onboardingPrice: 21000 },
  { tier: 6, minUsers: 201, maxUsers: 500, serverStorage: 699.99, onboardingPrice: 28000 },
];

// Helper Functions
export function getTierForUsers(users: number): TierConfig {
  const tier = TIERS.find(t => users >= t.minUsers && users <= t.maxUsers);
  return tier || TIERS[TIERS.length - 1];
}

export function calculateModulePrice(listPrice: number, discounts: { earlyAdopter: boolean; niaRegional: boolean }): number {
  let price = listPrice;
  if (discounts.earlyAdopter) {
    price = price * (1 - STANDARD_DISCOUNTS.earlyAdopter.percentage / 100);
  }
  if (discounts.niaRegional) {
    price = price * (1 - STANDARD_DISCOUNTS.niaRegional.percentage / 100);
  }
  return Math.round(price * 100) / 100;
}

export function calculateUserPrice(users: number): number {
  return Math.round(users * EFFECTIVE_USER_COST * 100) / 100;
}

export function calculateOnboardingPrice(basePrice: number, hasDiscount: boolean = true): number {
  if (hasDiscount) {
    return Math.round(basePrice * (1 - STANDARD_DISCOUNTS.onboarding.percentage / 100) * 100) / 100;
  }
  return basePrice;
}

export function generateEstimateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EST-${year}${month}-${random}`;
}

// Create default line items for a new estimate
export function createDefaultLineItems(
  users: number,
  tier: TierConfig,
  selectedModules: string[] = MODULES.filter(m => m.included).map(m => m.id),
  discounts: { earlyAdopter: boolean; niaRegional: boolean } = { earlyAdopter: true, niaRegional: true }
): import('../models/Estimate').ILineItem[] {
  const items: import('../models/Estimate').ILineItem[] = [];
  
  // Onboarding & Training
  const onboardingBase = tier.onboardingPrice;
  const onboardingDiscounted = calculateOnboardingPrice(onboardingBase);
  items.push({
    id: 'onboarding',
    type: 'onboarding',
    description: 'System Configuration, Data Migration, Onboarding, Training',
    included: true,
    quantity: 1,
    unitPrice: onboardingBase,
    discount: STANDARD_DISCOUNTS.onboarding.percentage,
    discountedPrice: onboardingDiscounted,
  });
  
  // User Subscription
  const userTotal = calculateUserPrice(users);
  items.push({
    id: 'users',
    type: 'user_subscription',
    description: `User Cost (${users} users × $${EFFECTIVE_USER_COST.toFixed(2)})`,
    included: true,
    quantity: users,
    unitPrice: USER_COST_BASE,
    discount: USER_DISCOUNT_RATE * 100,
    discountedPrice: userTotal,
    notes: '40% discount applied',
  });
  
  // Server & Storage
  items.push({
    id: 'server_storage',
    type: 'server_storage',
    description: `Server and Data Storage Costs - Tier ${tier.tier}`,
    included: true,
    quantity: 1,
    unitPrice: tier.serverStorage,
    discount: 0,
    discountedPrice: tier.serverStorage,
  });
  
  // Modules
  MODULES.forEach(module => {
    const isSelected = selectedModules.includes(module.id);
    const discountedPrice = module.listPrice > 0 
      ? calculateModulePrice(module.listPrice, discounts)
      : 0;
    
    items.push({
      id: module.id,
      type: 'module',
      description: module.name + (module.comingSoon ? ' (coming soon)' : '') + (module.notes ? ` (${module.notes})` : ''),
      included: isSelected,
      quantity: 1,
      unitPrice: module.listPrice,
      discount: discounts.earlyAdopter || discounts.niaRegional 
        ? (discounts.earlyAdopter ? 20 : 0) + (discounts.niaRegional ? 10 : 0)
        : 0,
      discountedPrice: discountedPrice,
      notes: module.freeWithSubscription ? 'Free with all subscriptions' : undefined,
    });
  });
  
  return items;
}

// Calculate totals from line items
export function calculateTotals(
  lineItems: import('../models/Estimate').ILineItem[],
  discounts: import('../models/Estimate').IDiscount[],
  taxRate: number = TAX_RATE
) {
  // Calculate category totals
  const onboarding = lineItems
    .filter(i => i.type === 'onboarding' && i.included)
    .reduce((sum, i) => sum + i.discountedPrice, 0);
    
  const userPrice = lineItems
    .filter(i => i.type === 'user_subscription' && i.included)
    .reduce((sum, i) => sum + i.discountedPrice, 0);
    
  const serverStorage = lineItems
    .filter(i => i.type === 'server_storage' && i.included)
    .reduce((sum, i) => sum + i.discountedPrice, 0);
    
  const modulePrice = lineItems
    .filter(i => i.type === 'module' && i.included)
    .reduce((sum, i) => sum + i.discountedPrice, 0);
  
  // Monthly recurring (excludes onboarding)
  const monthlySubtotal = userPrice + serverStorage + modulePrice;
  
  // Calculate discount amounts
  let totalDiscountAmount = 0;
  discounts.forEach(d => {
    let base = 0;
    switch (d.appliedTo) {
      case 'modules':
        base = modulePrice;
        break;
      case 'users':
        base = userPrice;
        break;
      case 'subtotal':
      case 'all':
        base = monthlySubtotal;
        break;
    }
    d.amount = Math.round(base * (d.percentage / 100) * 100) / 100;
    totalDiscountAmount += d.amount;
  });
  
  const subtotalAfterDiscounts = monthlySubtotal - totalDiscountAmount;
  const taxAmount = Math.round(subtotalAfterDiscounts * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotalAfterDiscounts + taxAmount) * 100) / 100;
  
  // Payment options
  const monthlyAmount = total;
  const quarterlyAmount = Math.round(monthlyAmount * 3 * (1 - PAYMENT_DISCOUNTS.quarterly / 100) * 100) / 100;
  const annualAmount = Math.round(monthlyAmount * 12 * (1 - PAYMENT_DISCOUNTS.annual / 100) * 100) / 100;
  
  return {
    totals: {
      modulePrice,
      userPrice,
      serverStorage,
      subtotal: monthlySubtotal,
      totalDiscounts: totalDiscountAmount,
      taxRate,
      taxAmount,
      total,
    },
    paymentOptions: {
      monthly: {
        amount: monthlyAmount,
        annualEquivalent: Math.round(monthlyAmount * 12 * 100) / 100,
      },
      quarterly: {
        amount: quarterlyAmount,
        annualEquivalent: Math.round(quarterlyAmount * 4 * 100) / 100,
        savings: Math.round((monthlyAmount * 12 - quarterlyAmount * 4) * 100) / 100,
      },
      annual: {
        amount: annualAmount,
        annualEquivalent: annualAmount,
        savings: Math.round((monthlyAmount * 12 - annualAmount) * 100) / 100,
      },
    },
    onboardingTotal: onboarding,
  };
}

