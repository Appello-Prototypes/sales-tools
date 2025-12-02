'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import {
  Plus, Trash2, Save, Download, ArrowLeft, 
  Building2, User, Search, Loader2, X, Edit2,
  ChevronDown, ChevronUp, FileText, Check, Percent
} from 'lucide-react';

// Types
interface LineItem {
  id: string;
  type: 'onboarding' | 'user_subscription' | 'server_storage' | 'module' | 'custom';
  description: string;
  included: boolean;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountedPrice: number;
  notes?: string;
  isOverridden?: boolean;
}

interface SectionDiscount {
  enabled: boolean;
  percentage: number;
  name: string;
}

interface Deal {
  id: string;
  dealname: string;
  amount: string | null;
  dealstage: string;
}

interface Company {
  id: string;
  name: string;
  domain: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Contact {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  fullName: string;
}

// Configuration Constants
const USER_COST_BASE = 16.59;
const TAX_RATE = 13;

const TIERS = [
  { tier: 1, minUsers: 1, maxUsers: 10, serverStorage: 199.99, onboarding: 7000 },
  { tier: 2, minUsers: 11, maxUsers: 25, serverStorage: 299.99, onboarding: 10500 },
  { tier: 3, minUsers: 26, maxUsers: 50, serverStorage: 399.99, onboarding: 14000 },
  { tier: 4, minUsers: 51, maxUsers: 100, serverStorage: 499.99, onboarding: 17500 },
  { tier: 5, minUsers: 101, maxUsers: 200, serverStorage: 599.99, onboarding: 21000 },
  { tier: 6, minUsers: 201, maxUsers: 500, serverStorage: 699.99, onboarding: 28000 },
];

const DEFAULT_MODULES = [
  { id: 'core', name: 'Core Module', price: 0, free: true },
  { id: 'crm_sales', name: 'CRM, Sales & Estimation', price: 399.99 },
  { id: 'scheduling', name: 'Scheduling & Dispatch', price: 399.99 },
  { id: 'timesheets', name: 'Timesheets & Workforce Admin', price: 399.99 },
  { id: 'equipment', name: 'Equipment & Asset Mgmt', price: 399.99 },
  { id: 'job_financials', name: 'Job Financials & Cost Control', price: 399.99 },
  { id: 'project_mgmt', name: 'Project Mgmt', price: 399.99, badge: 'beta' },
  { id: 'po_inventory', name: 'PO & Inventory Mgmt', price: 399.99, badge: 'coming soon' },
  { id: 'safety_forms', name: 'Safety & Forms', price: 399.99 },
  { id: 'training', name: 'Training & Compliance', price: 399.99 },
  { id: 'progress_billing', name: 'Progress Billing & Invoicing', price: 399.99 },
  { id: 'accounting', name: 'Accounting Integration', price: 299.99 },
  { id: 'hr_onboarding', name: 'HR Onboarding', price: 299.99 },
  { id: 'intelligence', name: 'Appello Intelligence', price: 299.99, badge: 'coming soon' },
];

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

const getTierForUsers = (users: number) => {
  return TIERS.find(t => users >= t.minUsers && users <= t.maxUsers) || TIERS[0];
};

const generateEstimateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EST-${year}${month}-${random}`;
};

// Checkbox Component
const Checkbox = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
      checked 
        ? 'bg-blue-600 border-blue-600 text-white' 
        : 'border-gray-300 hover:border-blue-400 bg-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
  </button>
);

// Discount Toggle Component
const DiscountToggle = ({ 
  label, 
  percentage, 
  enabled, 
  onToggle, 
  onPercentageChange,
  amount 
}: { 
  label: string;
  percentage: number;
  enabled: boolean;
  onToggle: () => void;
  onPercentageChange: (value: number) => void;
  amount: number;
}) => (
  <div className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${enabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
    <div className="flex items-center gap-3">
      <Checkbox checked={enabled} onChange={onToggle} />
      <span className={`text-sm ${enabled ? 'text-green-700 font-medium' : 'text-gray-500'}`}>{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={percentage}
          onChange={(e) => onPercentageChange(parseFloat(e.target.value) || 0)}
          className={`w-14 text-right px-2 py-1 border rounded text-sm ${enabled ? 'border-green-300 bg-white' : 'border-gray-200 bg-gray-100 text-gray-400'}`}
          disabled={!enabled}
        />
        <span className={`text-sm ${enabled ? 'text-green-600' : 'text-gray-400'}`}>%</span>
      </div>
      {enabled && amount > 0 && (
        <span className="text-sm font-medium text-green-600 w-24 text-right">-{formatCurrency(amount)}</span>
      )}
    </div>
  </div>
);

export default function CreateEstimatePage() {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Customer Info
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [estimateNumber, setEstimateNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');
  
  // Customer Selection
  const [showSelector, setShowSelector] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'deals' | 'companies' | 'contacts'>('deals');
  
  // HubSpot Data
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  
  // Selected IDs
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  // Configuration
  const [numberOfUsers, setNumberOfUsers] = useState(40);
  const [currency, setCurrency] = useState<'CAD' | 'USD'>('CAD');
  
  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showModules, setShowModules] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Section-level Discounts
  const [onboardingDiscount, setOnboardingDiscount] = useState<SectionDiscount>({ enabled: true, percentage: 30, name: 'Onboarding Discount' });
  const [userDiscount, setUserDiscount] = useState<SectionDiscount>({ enabled: true, percentage: 40, name: 'User Discount' });
  const [serverDiscount, setServerDiscount] = useState<SectionDiscount>({ enabled: false, percentage: 0, name: 'Server Discount' });
  const [moduleDiscount, setModuleDiscount] = useState<SectionDiscount>({ enabled: true, percentage: 20, name: 'Early Adopter Discount' });
  const [niaDiscount, setNiaDiscount] = useState<SectionDiscount>({ enabled: true, percentage: 10, name: 'NIA / Regional Discount' });
  
  // Notes
  const [notes, setNotes] = useState('');

  // Initialize
  useEffect(() => {
    checkAuth();
    setEstimateNumber(generateEstimateNumber());
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    setValidUntil(thirtyDaysFromNow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    initializeLineItems();
  }, [numberOfUsers]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      setLoading(false);
    } catch {
      router.push('/admin/login');
    }
  };

  const initializeLineItems = () => {
    const tier = getTierForUsers(numberOfUsers);
    const items: LineItem[] = [];
    
    // Onboarding
    items.push({
      id: 'onboarding',
      type: 'onboarding',
      description: 'System Configuration, Data Migration, Onboarding, Training',
      included: true,
      quantity: 1,
      unitPrice: tier.onboarding,
      originalPrice: tier.onboarding,
      discountedPrice: tier.onboarding,
    });
    
    // User Subscription
    items.push({
      id: 'users',
      type: 'user_subscription',
      description: 'User Subscription',
      included: true,
      quantity: numberOfUsers,
      unitPrice: USER_COST_BASE,
      originalPrice: USER_COST_BASE,
      discountedPrice: numberOfUsers * USER_COST_BASE,
    });
    
    // Server & Storage
    items.push({
      id: 'server_storage',
      type: 'server_storage',
      description: `Server and Data Storage Costs`,
      included: true,
      quantity: 1,
      unitPrice: tier.serverStorage,
      originalPrice: tier.serverStorage,
      discountedPrice: tier.serverStorage,
    });
    
    // Modules
    DEFAULT_MODULES.forEach(module => {
      items.push({
        id: module.id,
        type: 'module',
        description: module.name,
        included: true,
        quantity: 1,
        unitPrice: module.price,
        originalPrice: module.price,
        discountedPrice: module.price,
        notes: module.free ? 'free with all subscriptions' : (module as any).badge,
      });
    });
    
    setLineItems(items);
  };

  // Calculate totals
  const calculations = useMemo(() => {
    const tier = getTierForUsers(numberOfUsers);
    
    // Onboarding
    const onboardingItem = lineItems.find(i => i.type === 'onboarding' && i.included);
    const onboardingBase = onboardingItem ? onboardingItem.unitPrice * onboardingItem.quantity : 0;
    const onboardingDiscountAmt = onboardingDiscount.enabled ? onboardingBase * (onboardingDiscount.percentage / 100) : 0;
    const onboardingTotal = onboardingBase - onboardingDiscountAmt;
    
    // Users
    const userItem = lineItems.find(i => i.type === 'user_subscription' && i.included);
    const userBase = userItem ? userItem.unitPrice * userItem.quantity : 0;
    const userDiscountAmt = userDiscount.enabled ? userBase * (userDiscount.percentage / 100) : 0;
    const userTotal = userBase - userDiscountAmt;
    
    // Server
    const serverItem = lineItems.find(i => i.type === 'server_storage' && i.included);
    const serverBase = serverItem ? serverItem.unitPrice * serverItem.quantity : 0;
    const serverDiscountAmt = serverDiscount.enabled ? serverBase * (serverDiscount.percentage / 100) : 0;
    const serverTotal = serverBase - serverDiscountAmt;
    
    // Modules
    const moduleItems = lineItems.filter(i => (i.type === 'module' || i.type === 'custom') && i.included);
    const moduleListTotal = moduleItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
    
    // Apply early adopter first, then NIA
    const afterEarlyAdopter = moduleDiscount.enabled 
      ? moduleListTotal * (1 - moduleDiscount.percentage / 100)
      : moduleListTotal;
    const moduleDiscountAmt = moduleListTotal - afterEarlyAdopter;
    
    const afterNia = niaDiscount.enabled 
      ? afterEarlyAdopter * (1 - niaDiscount.percentage / 100)
      : afterEarlyAdopter;
    const niaDiscountAmt = afterEarlyAdopter - afterNia;
    
    const moduleTotal = afterNia;
    const totalModuleDiscounts = moduleDiscountAmt + niaDiscountAmt;
    
    // Monthly subtotal (excluding onboarding)
    const subtotal = userTotal + serverTotal + moduleTotal;
    const taxAmount = subtotal * (TAX_RATE / 100);
    const monthlyTotal = subtotal + taxAmount;
    
    // Payment options
    const quarterlyDiscount = 8.3;
    const annualDiscount = 16.7;
    
    return {
      tier,
      onboardingBase,
      onboardingDiscountAmt,
      onboardingTotal,
      userBase,
      userDiscountAmt,
      userTotal,
      serverBase,
      serverDiscountAmt,
      serverTotal,
      moduleListTotal,
      moduleDiscountAmt,
      niaDiscountAmt,
      totalModuleDiscounts,
      moduleTotal,
      subtotal,
      taxAmount,
      monthlyTotal,
      payments: {
        monthly: { 
          amount: monthlyTotal, 
          annual: monthlyTotal * 12,
          monthlyEquiv: monthlyTotal,
        },
        quarterly: { 
          amount: (monthlyTotal * 3) * (1 - quarterlyDiscount / 100),
          annual: (monthlyTotal * 3) * (1 - quarterlyDiscount / 100) * 4,
          monthlyEquiv: ((monthlyTotal * 3) * (1 - quarterlyDiscount / 100)) / 3,
          savings: (monthlyTotal * 12) - ((monthlyTotal * 3) * (1 - quarterlyDiscount / 100) * 4),
          discountPct: quarterlyDiscount,
        },
        annual: {
          amount: (monthlyTotal * 12) * (1 - annualDiscount / 100),
          annual: (monthlyTotal * 12) * (1 - annualDiscount / 100),
          monthlyEquiv: ((monthlyTotal * 12) * (1 - annualDiscount / 100)) / 12,
          savings: (monthlyTotal * 12) - ((monthlyTotal * 12) * (1 - annualDiscount / 100)),
          discountPct: annualDiscount,
        },
      },
    };
  }, [lineItems, numberOfUsers, onboardingDiscount, userDiscount, serverDiscount, moduleDiscount, niaDiscount]);

  // Fetch functions
  const fetchDeals = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/hubspot/deals?limit=100&useSync=true');
      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/hubspot/companies?limit=500');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchContacts = async (companyId?: string) => {
    setLoadingData(true);
    try {
      const url = companyId 
        ? `/api/admin/hubspot/companies/${companyId}/contacts`
        : '/api/admin/hubspot/contacts?limit=100';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
    }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const openSelector = (tab: 'deals' | 'companies' | 'contacts') => {
    setSelectorTab(tab);
    setShowSelector(true);
    setSearchQuery('');
    if (tab === 'deals' && deals.length === 0) fetchDeals();
    if (tab === 'companies' && companies.length === 0) fetchCompanies();
    if (tab === 'contacts') fetchContacts(selectedCompanyId || undefined);
  };

  const selectDeal = async (dealId: string) => {
    try {
      const response = await fetch(`/api/admin/hubspot/deals/${dealId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.companies?.[0]) {
          const company = data.companies[0];
          setCompanyName(company.name || company.properties?.name || '');
          setSelectedCompanyId(company.id);
          // Build address from company properties
          const props = company.properties || company;
          const addressParts = [props.address, props.city, props.state, props.zip || props.country].filter(Boolean);
          if (addressParts.length > 0) {
            setCompanyAddress(addressParts.join(', '));
          }
          // Set company phone if no contact phone
          if (props.phone && !data.contacts?.[0]?.phone) {
            setContactPhone(props.phone);
          }
        }
        if (data.contacts?.[0]) {
          const contact = data.contacts[0];
          setContactName(contact.fullName);
          setContactEmail(contact.email || '');
          setContactPhone(contact.phone || '');
          setSelectedContactId(contact.id);
        }
        setSelectedDealId(dealId);
        setShowSelector(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const selectCompany = (company: Company) => {
    setCompanyName(company.name);
    setSelectedCompanyId(company.id);
    setShowSelector(false);
    // Populate company address
    const addressParts = [company.address, company.city, company.state, company.zip].filter(Boolean);
    setCompanyAddress(addressParts.join(', '));
    // Populate company phone if available
    if (company.phone) {
      setContactPhone(company.phone);
    }
    // Clear contact-specific fields
    setContactName('');
    setContactEmail('');
    setSelectedContactId(null);
  };

  const selectContact = (contact: Contact) => {
    setContactName(contact.fullName);
    setContactEmail(contact.email || '');
    setContactPhone(contact.phone || '');
    setSelectedContactId(contact.id);
    setShowSelector(false);
  };

  // Line Item Management
  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(items => 
      items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if ('unitPrice' in updates && updates.unitPrice !== item.originalPrice) {
          updated.isOverridden = true;
        }
        updated.discountedPrice = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const toggleLineItem = (id: string) => {
    updateLineItem(id, { included: !lineItems.find(i => i.id === id)?.included });
  };

  const resetItemPrice = (id: string) => {
    const item = lineItems.find(i => i.id === id);
    if (item) {
      updateLineItem(id, { unitPrice: item.originalPrice, isOverridden: false });
    }
  };

  const addCustomLineItem = () => {
    const newItem: LineItem = {
      id: `custom_${Date.now()}`,
      type: 'custom',
      description: 'Custom Item',
      included: true,
      quantity: 1,
      unitPrice: 0,
      originalPrice: 0,
      discountedPrice: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(i => i.id !== id));
  };

  // Save Estimate
  const saveEstimate = async (status: 'draft' | 'sent' = 'draft') => {
    if (!companyName || !contactName) {
      alert('Please enter company and contact information');
      return;
    }
    
    setSaving(true);
    try {
      const discounts = [
        { ...onboardingDiscount, id: 'onboarding', appliedTo: 'onboarding', amount: calculations.onboardingDiscountAmt },
        { ...userDiscount, id: 'users', appliedTo: 'users', amount: calculations.userDiscountAmt },
        { ...serverDiscount, id: 'server', appliedTo: 'server', amount: calculations.serverDiscountAmt },
        { ...moduleDiscount, id: 'early_adopter', appliedTo: 'modules', amount: calculations.moduleDiscountAmt },
        { ...niaDiscount, id: 'nia', appliedTo: 'modules', amount: calculations.niaDiscountAmt },
      ];
      
      const response = await fetch('/api/admin/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateNumber,
          preparedFor: { companyName, contactName, email: contactEmail, phone: contactPhone, address: companyAddress },
          hubspotDealId: selectedDealId,
          hubspotCompanyId: selectedCompanyId,
          hubspotContactId: selectedContactId,
          numberOfUsers,
          moduleTier: calculations.tier.tier,
          currency,
          lineItems,
          discounts,
          totals: {
            modulePrice: calculations.moduleTotal,
            userPrice: calculations.userTotal,
            serverStorage: calculations.serverTotal,
            subtotal: calculations.subtotal,
            totalDiscounts: calculations.onboardingDiscountAmt + calculations.userDiscountAmt + calculations.serverDiscountAmt + calculations.totalModuleDiscounts,
            taxRate: TAX_RATE,
            taxAmount: calculations.taxAmount,
            total: calculations.monthlyTotal,
          },
          paymentOptions: {
            monthly: calculations.payments.monthly,
            quarterly: calculations.payments.quarterly,
            annual: calculations.payments.annual,
          },
          status,
          validUntil: new Date(validUntil),
          notes,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/estimates/${data.estimateId}`);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save estimate');
    } finally {
      setSaving(false);
    }
  };

  const generatePdf = async () => {
    if (!companyName || !contactName) {
      alert('Please enter company and contact information');
      return;
    }
    setGeneratingPdf(true);
    try {
      const discounts = [
        { ...onboardingDiscount, id: 'onboarding', appliedTo: 'onboarding', amount: calculations.onboardingDiscountAmt },
        { ...userDiscount, id: 'users', appliedTo: 'users', amount: calculations.userDiscountAmt },
        { ...serverDiscount, id: 'server', appliedTo: 'server', amount: calculations.serverDiscountAmt },
        { ...moduleDiscount, id: 'early_adopter', appliedTo: 'modules', amount: calculations.moduleDiscountAmt },
        { ...niaDiscount, id: 'nia', appliedTo: 'modules', amount: calculations.niaDiscountAmt },
      ];
      
      const response = await fetch('/api/admin/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateNumber,
          preparedFor: { companyName, contactName, email: contactEmail, phone: contactPhone, address: companyAddress },
          hubspotDealId: selectedDealId,
          hubspotCompanyId: selectedCompanyId,
          hubspotContactId: selectedContactId,
          numberOfUsers,
          moduleTier: calculations.tier.tier,
          currency,
          lineItems,
          discounts,
          totals: {
            modulePrice: calculations.moduleTotal,
            userPrice: calculations.userTotal,
            serverStorage: calculations.serverTotal,
            subtotal: calculations.subtotal,
            totalDiscounts: calculations.onboardingDiscountAmt + calculations.userDiscountAmt + calculations.serverDiscountAmt + calculations.totalModuleDiscounts,
            taxRate: TAX_RATE,
            taxAmount: calculations.taxAmount,
            total: calculations.monthlyTotal,
          },
          paymentOptions: {
            monthly: calculations.payments.monthly,
            quarterly: calculations.payments.quarterly,
            annual: calculations.payments.annual,
          },
          status: 'draft',
          validUntil: new Date(validUntil),
          notes,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Fetch the PDF and trigger download
        const pdfResponse = await fetch(`/api/admin/estimates/${data.estimateId}/pdf`);
        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${estimateNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        
        router.push(`/admin/estimates/${data.estimateId}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const filteredDeals = deals.filter(d => d.dealname.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredContacts = contacts.filter(c => 
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/estimates" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            <div>
                <h1 className="text-lg font-semibold text-gray-900">New Estimate</h1>
                <p className="text-sm text-gray-500">{estimateNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => saveEstimate('draft')}
                disabled={saving}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </button>
              <button
                onClick={generatePdf}
                disabled={generatingPdf}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
              >
                {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          
          {/* Quote Header */}
          <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-b">
            <div className="flex justify-between items-start">
              <div>
                <Image src="/Appello-Logo-Dark.svg" alt="Appello" width={140} height={40} className="mb-4" style={{ height: '40px', width: 'auto' }} />
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p>Appello Inc.</p>
                  <p>643 Railroad St, Mount Brydges, ON N0L 1W0</p>
                  <p>416-388-3907</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-light text-gray-400 tracking-tight mb-4">Software License Quote</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-end gap-4">
                    <span className="text-gray-400">Date</span>
                    <span className="font-medium text-gray-700 w-32">{formatDate(new Date())}</span>
                  </div>
                  <div className="flex justify-end gap-4 items-center">
                    <span className="text-gray-400">Valid Until</span>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="font-medium text-gray-700 border-0 bg-transparent p-0 text-right focus:ring-0 w-32"
                    />
                  </div>
                  <div className="flex justify-end gap-4 items-center">
                    <span className="text-gray-400">Currency</span>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'CAD' | 'USD')}
                      className="font-medium text-gray-700 border-0 bg-transparent p-0 text-right focus:ring-0 w-32"
                    >
                      <option value="CAD">CAD</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Config */}
          <div className="p-8 border-b bg-white">
            <div className="flex gap-8">
              {/* Customer Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prepared For</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openSelector('deals')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Select Deal">
                      <FileText className="h-4 w-4" />
                    </button>
                    <button onClick={() => openSelector('companies')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Select Company">
                      <Building2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => openSelector('contacts')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Select Contact">
                      <User className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company Name *"
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact Name *"
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email"
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Phone"
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Address"
                    className="col-span-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                {(selectedDealId || selectedCompanyId || selectedContactId) && (
                  <div className="mt-3 flex gap-2">
                    {selectedDealId && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                        <FileText className="h-3 w-3" />Deal
                        <button onClick={() => setSelectedDealId(null)} className="hover:text-blue-800"><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {selectedCompanyId && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-medium">
                        <Building2 className="h-3 w-3" />Company
                        <button onClick={() => setSelectedCompanyId(null)} className="hover:text-emerald-800"><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {selectedContactId && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-violet-50 text-violet-600 rounded-md text-xs font-medium">
                        <User className="h-3 w-3" />Contact
                        <button onClick={() => setSelectedContactId(null)} className="hover:text-violet-800"><X className="h-3 w-3" /></button>
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Config */}
              <div className="w-56">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Configuration</h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-center mb-3">
                    <label className="text-xs text-blue-600/70 font-medium">Number of Users</label>
                    <input
                      type="number"
                      value={numberOfUsers}
                      onChange={(e) => setNumberOfUsers(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center text-3xl font-bold text-blue-700 bg-transparent border-0 focus:ring-0 p-0 mt-1"
                    />
                    </div>
                  <div className="text-center pt-3 border-t border-blue-200/50">
                    <span className="text-xs text-blue-600/70 font-medium">Module Tier</span>
                    <div className="text-2xl font-bold text-blue-700">{calculations.tier.tier}</div>
                    <span className="text-xs text-blue-500">{calculations.tier.minUsers}-{calculations.tier.maxUsers} users</span>
                  </div>
                </div>
            </div>
          </div>
        </div>

          {/* Selector Modal */}
          {showSelector && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[70vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {['deals', 'companies', 'contacts'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => { 
                          setSelectorTab(tab as typeof selectorTab); 
                          if (tab === 'deals' && deals.length === 0) fetchDeals();
                          if (tab === 'companies' && companies.length === 0) fetchCompanies();
                          if (tab === 'contacts') fetchContacts(selectedCompanyId || undefined);
                        }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          selectorTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowSelector(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <X className="h-5 w-5" />
                  </button>
              </div>
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${selectorTab}...`}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {loadingData ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                  ) : (
                    <div className="space-y-1">
                      {selectorTab === 'deals' && (filteredDeals.length === 0 ? <p className="text-center text-gray-400 py-12">No deals found</p> :
                        filteredDeals.map(deal => (
                          <button key={deal.id} onClick={() => selectDeal(deal.id)} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="font-medium text-gray-900">{deal.dealname}</div>
                            <div className="text-xs text-gray-500">{deal.dealstage}</div>
                          </button>
                        ))
                      )}
                      {selectorTab === 'companies' && (filteredCompanies.length === 0 ? <p className="text-center text-gray-400 py-12">No companies found</p> :
                        filteredCompanies.map(company => (
                          <button key={company.id} onClick={() => selectCompany(company)} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="font-medium text-gray-900">{company.name}</div>
                            {company.domain && <div className="text-xs text-gray-500">{company.domain}</div>}
                          </button>
                        ))
                      )}
                      {selectorTab === 'contacts' && (filteredContacts.length === 0 ? <p className="text-center text-gray-400 py-12">No contacts found</p> :
                        filteredContacts.map(contact => (
                          <button key={contact.id} onClick={() => selectContact(contact)} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="font-medium text-gray-900">{contact.fullName}</div>
                            <div className="text-xs text-gray-500">{contact.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
                          </div>
          )}

          {/* Onboarding Section */}
          <div className="p-8 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Onboarding & Training</h3>
            {lineItems.filter(i => i.type === 'onboarding').map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{item.description}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
                  {editingItemId === item.id ? (
                    <input type="number" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} onBlur={() => setEditingItemId(null)} className="w-28 text-right px-2 py-1 border rounded text-sm" autoFocus />
                  ) : (
                    <button onClick={() => setEditingItemId(item.id)} className={`text-right font-medium ${item.isOverridden ? 'text-amber-600' : 'text-gray-900'} hover:bg-gray-100 px-2 py-1 rounded`}>
                      {formatCurrency(item.unitPrice)}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-4">
              <DiscountToggle
                label={onboardingDiscount.name}
                percentage={onboardingDiscount.percentage}
                enabled={onboardingDiscount.enabled}
                onToggle={() => setOnboardingDiscount(d => ({ ...d, enabled: !d.enabled }))}
                onPercentageChange={(v) => setOnboardingDiscount(d => ({ ...d, percentage: v }))}
                amount={calculations.onboardingDiscountAmt}
              />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold text-gray-900">Onboarding Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(calculations.onboardingTotal)}</span>
            </div>
                              </div>

          {/* User Subscription */}
          <div className="p-8 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Subscription - Users</h3>
            {lineItems.filter(i => i.type === 'user_subscription').map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{item.description}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Users:</span>
                    <input type="number" value={item.quantity} onChange={(e) => setNumberOfUsers(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center px-2 py-1 border rounded text-sm" />
                  </div>
                  <span className="text-sm text-gray-400">×</span>
                  {editingItemId === item.id ? (
                    <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} onBlur={() => setEditingItemId(null)} className="w-24 text-right px-2 py-1 border rounded text-sm" autoFocus />
                  ) : (
                    <button onClick={() => setEditingItemId(item.id)} className={`font-medium ${item.isOverridden ? 'text-amber-600' : 'text-gray-900'} hover:bg-gray-100 px-2 py-1 rounded`}>
                      {formatCurrency(item.unitPrice)}
                    </button>
                  )}
                  <span className="text-sm text-gray-400">=</span>
                  <span className="font-medium text-gray-900 w-24 text-right">{formatCurrency(calculations.userBase)}</span>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <DiscountToggle
                label={userDiscount.name}
                percentage={userDiscount.percentage}
                enabled={userDiscount.enabled}
                onToggle={() => setUserDiscount(d => ({ ...d, enabled: !d.enabled }))}
                onPercentageChange={(v) => setUserDiscount(d => ({ ...d, percentage: v }))}
                amount={calculations.userDiscountAmt}
              />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold text-gray-900">User Subtotal</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(calculations.userTotal)}</span>
            </div>
                      </div>

          {/* Server & Storage */}
          <div className="p-8 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Server & Data Storage</h3>
            {lineItems.filter(i => i.type === 'server_storage').map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">Tier {calculations.tier.tier} ({calculations.tier.minUsers}-{calculations.tier.maxUsers} users)</span>
                {editingItemId === item.id ? (
                  <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} onBlur={() => setEditingItemId(null)} className="w-28 text-right px-2 py-1 border rounded text-sm" autoFocus />
                ) : (
                  <button onClick={() => setEditingItemId(item.id)} className={`font-medium ${item.isOverridden ? 'text-amber-600' : 'text-gray-900'} hover:bg-gray-100 px-2 py-1 rounded`}>
                    {formatCurrency(item.unitPrice)}
                  </button>
                                )}
                              </div>
                            ))}
            <div className="mt-4">
              <DiscountToggle
                label={serverDiscount.name}
                percentage={serverDiscount.percentage}
                enabled={serverDiscount.enabled}
                onToggle={() => setServerDiscount(d => ({ ...d, enabled: !d.enabled }))}
                onPercentageChange={(v) => setServerDiscount(d => ({ ...d, percentage: v }))}
                amount={calculations.serverDiscountAmt}
              />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold text-gray-900">Server Subtotal</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(calculations.serverTotal)}</span>
            </div>
          </div>

          {/* Modules */}
          <div className="p-8 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Modules</h3>
              <div className="flex items-center gap-2">
                <button onClick={addCustomLineItem} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                  <Plus className="h-4 w-4" />Add Item
                </button>
                <button onClick={() => setShowModules(!showModules)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                  {showModules ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                          </div>
                        </div>

            {showModules && (
                          <div className="space-y-1">
                {lineItems.filter(i => i.type === 'module' || i.type === 'custom').map(item => (
                  <div key={item.id} className={`flex items-center gap-4 py-2.5 px-3 rounded-lg transition-colors ${item.included ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}>
                    <Checkbox checked={item.included} onChange={() => toggleLineItem(item.id)} />
                    <div className="flex-1 min-w-0">
                      {item.type === 'custom' ? (
                        <input type="text" value={item.description} onChange={(e) => updateLineItem(item.id, { description: e.target.value })} className="w-full bg-transparent border-0 p-0 text-sm text-gray-900 focus:ring-0 placeholder:text-gray-400" placeholder="Item description" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{item.description}</span>
                          {item.notes && item.notes !== 'free with all subscriptions' && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium uppercase">{item.notes}</span>
                                )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {item.originalPrice > 0 && (
                        <span className="text-gray-400 w-20 text-right">{formatCurrency(item.originalPrice)}</span>
                      )}
                      {item.included ? (
                        item.unitPrice > 0 || item.type === 'custom' ? (
                          editingItemId === item.id ? (
                            <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} onBlur={() => setEditingItemId(null)} className="w-24 text-right px-2 py-1 border rounded text-sm" autoFocus />
                          ) : (
                            <button onClick={() => setEditingItemId(item.id)} className={`w-24 text-right font-medium ${item.isOverridden ? 'text-amber-600' : 'text-gray-900'} hover:bg-gray-100 px-2 py-1 rounded`}>
                              {formatCurrency(item.unitPrice)}
                            </button>
                          )
                        ) : (
                          <span className="w-24 text-right text-emerald-600 font-medium">Free</span>
                        )
                      ) : (
                        <span className="w-24 text-right text-gray-400">—</span>
                      )}
                      {item.type === 'custom' && (
                        <button onClick={() => removeLineItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4 py-3 border-t border-b">
              <span className="text-gray-600">Module List Price</span>
              <span className="font-semibold text-gray-900">{formatCurrency(calculations.moduleListTotal)}</span>
                  </div>

            <div className="mt-4 space-y-2">
              <DiscountToggle
                label={moduleDiscount.name}
                percentage={moduleDiscount.percentage}
                enabled={moduleDiscount.enabled}
                onToggle={() => setModuleDiscount(d => ({ ...d, enabled: !d.enabled }))}
                onPercentageChange={(v) => setModuleDiscount(d => ({ ...d, percentage: v }))}
                amount={calculations.moduleDiscountAmt}
              />
              <DiscountToggle
                label={niaDiscount.name}
                percentage={niaDiscount.percentage}
                enabled={niaDiscount.enabled}
                onToggle={() => setNiaDiscount(d => ({ ...d, enabled: !d.enabled }))}
                onPercentageChange={(v) => setNiaDiscount(d => ({ ...d, percentage: v }))}
                amount={calculations.niaDiscountAmt}
                    />
                  </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold text-gray-900">Module Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(calculations.moduleTotal)}</span>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="p-8 border-b bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Module Price</span><span className="font-medium">{formatCurrency(calculations.moduleTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">User Price</span><span className="font-medium">{formatCurrency(calculations.userTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Server & Storage</span><span className="font-medium">{formatCurrency(calculations.serverTotal)}</span></div>
              <div className="flex justify-between pt-3 border-t"><span className="font-semibold text-gray-900">Subtotal</span><span className="font-semibold">{formatCurrency(calculations.subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax ({TAX_RATE}%)</span><span>{formatCurrency(calculations.taxAmount)}</span></div>
              <div className="flex justify-between pt-3 border-t text-lg">
                <span className="font-bold text-gray-900">Monthly Total</span>
                <span className="font-bold text-blue-600">{formatCurrency(calculations.monthlyTotal)}</span>
              </div>
            </div>
                  </div>

          {/* Payment Options */}
          <div className="p-8 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Payment Options</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Monthly */}
              <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-sm font-medium text-gray-500 mb-2">Monthly</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(calculations.payments.monthly.amount)}</div>
                <div className="text-xs text-gray-400">per month</div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">Annual equivalent</div>
                  <div className="font-semibold text-gray-700">{formatCurrency(calculations.payments.monthly.annual)}</div>
                </div>
              </div>

              {/* Quarterly */}
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Save {calculations.payments.quarterly.discountPct}%
                </div>
                <div className="text-sm font-medium text-blue-600 mb-2">Quarterly</div>
                <div className="text-3xl font-bold text-blue-700 mb-1">{formatCurrency(calculations.payments.quarterly.amount)}</div>
                <div className="text-xs text-blue-500">per quarter</div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-500">Annual equivalent</div>
                  <div className="font-semibold text-blue-700">{formatCurrency(calculations.payments.quarterly.annual)}</div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">Save {formatCurrency(calculations.payments.quarterly.savings!)}/yr</div>
                </div>
              </div>
              
              {/* Annual */}
              <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-6 text-center shadow-lg shadow-emerald-100">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-xs font-medium rounded-full">
                  Best Value • Save {calculations.payments.annual.discountPct}%
                </div>
                <div className="text-sm font-medium text-emerald-600 mb-2">Annual</div>
                <div className="text-3xl font-bold text-emerald-700 mb-1">{formatCurrency(calculations.payments.annual.amount)}</div>
                <div className="text-xs text-emerald-500">per year</div>
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <div className="text-xs text-emerald-500">Monthly equivalent</div>
                  <div className="font-semibold text-emerald-700">{formatCurrency(calculations.payments.annual.monthlyEquiv!)}/mo</div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">Save {formatCurrency(calculations.payments.annual.savings!)}/yr</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="p-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or terms..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
