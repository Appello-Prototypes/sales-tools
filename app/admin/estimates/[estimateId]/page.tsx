'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { 
  ArrowLeft, Download, Send, Check, X,
  Loader2, Building2, User, Mail, AlertCircle,
  ChevronDown, ChevronUp, Copy, Phone, Edit2
} from 'lucide-react';

interface LineItem {
  id: string;
  type: string;
  description: string;
  included: boolean;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount: number;
  discountedPrice: number;
  notes?: string;
  isOverridden?: boolean;
}

interface Discount {
  id: string;
  name: string;
  percentage: number;
  enabled: boolean;
  appliedTo: string;
  amount: number;
}

interface Estimate {
  _id: string;
  estimateNumber: string;
  preparedFor: {
    companyName: string;
    contactName: string;
    email?: string;
    phone?: string;
  };
  hubspotDealId?: string;
  hubspotCompanyId?: string;
  hubspotContactId?: string;
  numberOfUsers: number;
  moduleTier: number;
  currency: 'CAD' | 'USD';
  lineItems: LineItem[];
  discounts: Discount[];
  totals: {
    modulePrice: number;
    userPrice: number;
    serverStorage: number;
    subtotal: number;
    totalDiscounts: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  };
  paymentOptions: {
    monthly: { amount: number; annual: number; monthlyEquiv: number };
    quarterly: { amount: number; annual: number; monthlyEquiv: number; savings?: number; discountPct?: number };
    annual: { amount: number; annual: number; monthlyEquiv: number; savings?: number; discountPct?: number };
  };
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    case 'expired': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Checkbox display (read-only)
const CheckIndicator = ({ checked }: { checked: boolean }) => (
  <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 ${
    checked 
      ? 'bg-blue-600 border-blue-600 text-white' 
      : 'border-gray-300 bg-white'
  }`}>
    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
  </span>
);

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { theme, resolvedTheme } = useTheme();
  const estimateId = params.estimateId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [showModules, setShowModules] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && estimateId) {
      fetchEstimate();
    }
  }, [loading, estimateId]);

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

  const fetchEstimate = async () => {
    try {
      const response = await fetch(`/api/admin/estimates/${estimateId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Estimate not found');
        } else {
          throw new Error('Failed to fetch estimate');
        }
        return;
      }
      const data = await response.json();
      setEstimate(data.estimate);
    } catch (err) {
      console.error('Error fetching estimate:', err);
      setError('Failed to load estimate');
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!estimate) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstimate(data.estimate);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setSaving(false);
    }
  };

  const duplicateEstimate = () => {
    router.push('/admin/estimates/create');
  };

  const generatePdf = async () => {
    try {
      const response = await fetch(`/api/admin/estimates/${estimateId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${estimate?.estimateNumber || 'estimate'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  // Get section-specific discounts
  const getDiscount = (appliedTo: string) => {
    return estimate?.discounts?.find(d => d.appliedTo === appliedTo && d.enabled);
  };

  const onboardingDiscount = getDiscount('onboarding');
  const userDiscount = getDiscount('users');
  const serverDiscount = getDiscount('server');
  const moduleDiscounts = estimate?.discounts?.filter(d => d.appliedTo === 'modules' && d.enabled) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <Link href="/admin/estimates" className="text-blue-600 hover:text-blue-800">
            ← Back to Estimates
          </Link>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
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
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-gray-900">{estimate.estimateNumber}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(estimate.status)}`}>
                    {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Created {formatDate(estimate.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {estimate.status === 'draft' && (
                <button
                  onClick={() => updateStatus('sent')}
                  disabled={saving}
                  className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Mark as Sent
                </button>
              )}
              {estimate.status === 'sent' && (
                <>
                  <button
                    onClick={() => updateStatus('accepted')}
                    disabled={saving}
                    className="px-4 py-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus('rejected')}
                    disabled={saving}
                    className="px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </>
              )}
              <Link href={`/admin/estimates/${estimateId}/edit`}>
                <button className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 text-sm font-medium transition-colors">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </Link>
              <button
                onClick={duplicateEstimate}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </button>
              <button
                onClick={generatePdf}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
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
                    <span className="text-gray-400">Estimate #</span>
                    <span className="font-medium text-gray-700 w-32">{estimate.estimateNumber}</span>
                  </div>
                  <div className="flex justify-end gap-4">
                    <span className="text-gray-400">Date</span>
                    <span className="font-medium text-gray-700 w-32">{formatDate(estimate.createdAt)}</span>
                  </div>
                  {estimate.validUntil && (
                    <div className="flex justify-end gap-4">
                      <span className="text-gray-400">Valid Until</span>
                      <span className="font-medium text-gray-700 w-32">{formatDate(estimate.validUntil)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-4">
                    <span className="text-gray-400">Currency</span>
                    <span className="font-medium text-gray-700 w-32">{estimate.currency}</span>
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
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Prepared For</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {estimate.preparedFor.companyName}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="h-4 w-4 text-gray-400" />
                    {estimate.preparedFor.contactName}
                  </div>
                  {estimate.preparedFor.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {estimate.preparedFor.email}
                    </div>
                  )}
                  {estimate.preparedFor.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {estimate.preparedFor.phone}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Config */}
              <div className="w-56">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Configuration</h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-center mb-3">
                    <span className="text-xs text-blue-600/70 font-medium">Number of Users</span>
                    <div className="text-3xl font-bold text-blue-700">{estimate.numberOfUsers}</div>
                  </div>
                  <div className="text-center pt-3 border-t border-blue-200/50">
                    <span className="text-xs text-blue-600/70 font-medium">Module Tier</span>
                    <div className="text-2xl font-bold text-blue-700">{estimate.moduleTier}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Section */}
          <div className="p-8 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Onboarding & Training</h3>
            {estimate.lineItems?.filter(i => i.type === 'onboarding' && i.included).map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{item.description}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
                  <span className={`font-medium ${item.isOverridden ? 'text-amber-600' : 'text-gray-900'}`}>
                    {formatCurrency(item.unitPrice)}
                  </span>
                </div>
              </div>
            ))}
            {onboardingDiscount && (
              <div className="mt-4 flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckIndicator checked={true} />
                  <span className="text-sm text-green-700 font-medium">{onboardingDiscount.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-600">{onboardingDiscount.percentage}%</span>
                  <span className="text-sm font-medium text-green-600">-{formatCurrency(onboardingDiscount.amount)}</span>
                </div>
              </div>
            )}
            {(() => {
              const onboardingItem = estimate.lineItems?.find(i => i.type === 'onboarding' && i.included);
              const base = onboardingItem ? onboardingItem.unitPrice * onboardingItem.quantity : 0;
              const discount = onboardingDiscount?.amount || 0;
              return (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="font-semibold text-gray-900">Onboarding Total</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(base - discount)}</span>
                </div>
              );
            })()}
          </div>

          {/* User Subscription */}
          <div className="p-8 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Subscription - Users</h3>
            {estimate.lineItems?.filter(i => i.type === 'user_subscription' && i.included).map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{item.description}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{item.quantity} users × {formatCurrency(item.unitPrice)}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(item.quantity * item.unitPrice)}</span>
                </div>
              </div>
            ))}
            {userDiscount && (
              <div className="mt-4 flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckIndicator checked={true} />
                  <span className="text-sm text-green-700 font-medium">{userDiscount.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-600">{userDiscount.percentage}%</span>
                  <span className="text-sm font-medium text-green-600">-{formatCurrency(userDiscount.amount)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold text-gray-900">User Subtotal</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(estimate.totals.userPrice)}</span>
            </div>
          </div>

          {/* Server & Storage */}
          <div className="p-8 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Server & Data Storage</h3>
            {estimate.lineItems?.filter(i => i.type === 'server_storage' && i.included).map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">Tier {estimate.moduleTier}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.unitPrice)}</span>
              </div>
            ))}
            {serverDiscount && (
              <div className="mt-4 flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckIndicator checked={true} />
                  <span className="text-sm text-green-700 font-medium">{serverDiscount.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-600">{serverDiscount.percentage}%</span>
                  <span className="text-sm font-medium text-green-600">-{formatCurrency(serverDiscount.amount)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold text-gray-900">Server Subtotal</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(estimate.totals.serverStorage)}</span>
            </div>
          </div>

          {/* Modules */}
          <div className="p-8 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Modules</h3>
              <button onClick={() => setShowModules(!showModules)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                {showModules ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
            
            {showModules && (
              <div className="space-y-1">
                {estimate.lineItems?.filter(i => i.type === 'module' || i.type === 'custom').map(item => (
                  <div key={item.id} className={`flex items-center gap-4 py-2.5 px-3 rounded-lg ${item.included ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}>
                    <CheckIndicator checked={item.included} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{item.description}</span>
                        {item.notes && item.notes !== 'free with all subscriptions' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium uppercase">{item.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {item.unitPrice > 0 && (
                        <span className="text-gray-400 w-20 text-right">{formatCurrency(item.unitPrice)}</span>
                      )}
                      {item.included ? (
                        item.unitPrice > 0 ? (
                          <span className={`w-24 text-right font-medium ${item.isOverridden ? 'text-amber-600' : 'text-gray-900'}`}>
                            {formatCurrency(item.unitPrice)}
                          </span>
                        ) : (
                          <span className="w-24 text-right text-emerald-600 font-medium">Free</span>
                        )
                      ) : (
                        <span className="w-24 text-right text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {(() => {
              const moduleItems = estimate.lineItems?.filter(i => (i.type === 'module' || i.type === 'custom') && i.included) || [];
              const listTotal = moduleItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
              return (
                <div className="flex justify-between items-center mt-4 py-3 border-t border-b">
                  <span className="text-gray-600">Module List Price</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(listTotal)}</span>
                </div>
              );
            })()}
            
            {moduleDiscounts.length > 0 && (
              <div className="mt-4 space-y-2">
                {moduleDiscounts.map(discount => (
                  <div key={discount.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckIndicator checked={true} />
                      <span className="text-sm text-green-700 font-medium">{discount.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600">{discount.percentage}%</span>
                      <span className="text-sm font-medium text-green-600">-{formatCurrency(discount.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold text-gray-900">Module Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(estimate.totals.modulePrice)}</span>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="p-8 border-b bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Module Price</span><span className="font-medium">{formatCurrency(estimate.totals.modulePrice)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">User Price</span><span className="font-medium">{formatCurrency(estimate.totals.userPrice)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Server & Storage</span><span className="font-medium">{formatCurrency(estimate.totals.serverStorage)}</span></div>
              <div className="flex justify-between pt-3 border-t"><span className="font-semibold text-gray-900">Subtotal</span><span className="font-semibold">{formatCurrency(estimate.totals.subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax ({estimate.totals.taxRate}%)</span><span>{formatCurrency(estimate.totals.taxAmount)}</span></div>
              <div className="flex justify-between pt-3 border-t text-lg">
                <span className="font-bold text-gray-900">Monthly Total</span>
                <span className="font-bold text-blue-600">{formatCurrency(estimate.totals.total)}</span>
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
                <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(estimate.paymentOptions.monthly.amount)}</div>
                <div className="text-xs text-gray-400">per month</div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">Annual equivalent</div>
                  <div className="font-semibold text-gray-700">{formatCurrency(estimate.paymentOptions.monthly.annual)}</div>
                </div>
              </div>
              
              {/* Quarterly */}
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Save {estimate.paymentOptions.quarterly.discountPct || 8.3}%
                </div>
                <div className="text-sm font-medium text-blue-600 mb-2">Quarterly</div>
                <div className="text-3xl font-bold text-blue-700 mb-1">{formatCurrency(estimate.paymentOptions.quarterly.amount)}</div>
                <div className="text-xs text-blue-500">per quarter</div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-500">Annual equivalent</div>
                  <div className="font-semibold text-blue-700">{formatCurrency(estimate.paymentOptions.quarterly.annual)}</div>
                  {estimate.paymentOptions.quarterly.savings && (
                    <div className="text-xs text-emerald-600 font-medium mt-1">Save {formatCurrency(estimate.paymentOptions.quarterly.savings)}/yr</div>
                  )}
                </div>
              </div>
              
              {/* Annual */}
              <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-6 text-center shadow-lg shadow-emerald-100">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-xs font-medium rounded-full">
                  Best Value • Save {estimate.paymentOptions.annual.discountPct || 16.7}%
                </div>
                <div className="text-sm font-medium text-emerald-600 mb-2">Annual</div>
                <div className="text-3xl font-bold text-emerald-700 mb-1">{formatCurrency(estimate.paymentOptions.annual.amount)}</div>
                <div className="text-xs text-emerald-500">per year</div>
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <div className="text-xs text-emerald-500">Monthly equivalent</div>
                  <div className="font-semibold text-emerald-700">{formatCurrency(estimate.paymentOptions.annual.monthlyEquiv)}/mo</div>
                  {estimate.paymentOptions.annual.savings && (
                    <div className="text-xs text-emerald-600 font-medium mt-1">Save {formatCurrency(estimate.paymentOptions.annual.savings)}/yr</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {estimate.notes && (
            <div className="p-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes</h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{estimate.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
