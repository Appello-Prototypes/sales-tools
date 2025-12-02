import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, Rect } from '@react-pdf/renderer';

const colors = {
  primary: '#3D6AFF',
  primaryDark: '#26303D',
  accent: '#879ACE',
  success: '#059669',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  green50: '#ecfdf5',
  green100: '#d1fae5',
  green600: '#059669',
  green700: '#047857',
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: colors.gray800,
    backgroundColor: 'white',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoSvg: {
    width: 38,
    height: 38,
    marginRight: 10,
  },
  companyDetails: {
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDark,
    marginBottom: 3,
  },
  companyAddress: {
    fontSize: 8,
    color: colors.gray500,
    lineHeight: 1.4,
  },
  quoteHeader: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 8,
    color: colors.gray400,
    width: 55,
    textAlign: 'right',
    marginRight: 8,
  },
  metaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray700,
    width: 80,
  },
  
  // Two column layout
  twoCol: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  colLeft: {
    flex: 1,
    marginRight: 14,
  },
  colRight: {
    width: 115,
  },
  
  // Prepared For
  preparedFor: {
    backgroundColor: colors.gray50,
    padding: 10,
    borderRadius: 5,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  customerName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray800,
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: 8,
    color: colors.gray500,
    lineHeight: 1.4,
  },
  
  // Config Box
  configBox: {
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue100,
    borderRadius: 5,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  configItem: {
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 7,
    color: colors.blue600,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  configValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.blue700,
  },
  
  // Section
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray800,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  
  // Tables
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray500,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  tableRowAlt: {
    backgroundColor: colors.gray50,
  },
  
  // Modules Grid
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moduleItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingRight: 6,
  },
  moduleItemExcluded: {
    opacity: 0.5,
  },
  checkboxContainer: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  moduleName: {
    flex: 1,
    fontSize: 8,
    color: colors.gray700,
  },
  moduleNameExcluded: {
    color: colors.gray400,
    textDecoration: 'line-through',
  },
  modulePrice: {
    fontSize: 8,
    color: colors.gray500,
  },
  
  // Module totals row
  moduleTotalRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 5,
  },
  
  // Summary & Payment - Side by side
  summaryPaymentRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  summaryBox: {
    width: 160,
    backgroundColor: colors.gray50,
    padding: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 8,
    color: colors.gray600,
  },
  summaryValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray800,
  },
  summaryTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.gray300,
    marginTop: 5,
    paddingTop: 5,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray800,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  
  // Payment Cards - Enhanced
  paymentSection: {
    flex: 1,
  },
  paymentGrid: {
    flexDirection: 'row',
  },
  paymentCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
    marginRight: 6,
  },
  paymentCardLast: {
    marginRight: 0,
  },
  paymentCardQuarterly: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue100,
  },
  paymentCardAnnual: {
    backgroundColor: colors.green50,
    borderColor: colors.green600,
    borderWidth: 2,
  },
  paymentBadge: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 3,
  },
  paymentBadgeBlue: {
    backgroundColor: colors.blue600,
  },
  paymentLabel: {
    fontSize: 8,
    color: colors.gray500,
    marginBottom: 1,
  },
  paymentAmount: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray800,
  },
  paymentAmountQuarterly: {
    color: colors.blue700,
  },
  paymentAmountAnnual: {
    color: colors.green700,
  },
  paymentPeriod: {
    fontSize: 7,
    color: colors.gray400,
    marginTop: 1,
  },
  paymentDetail: {
    fontSize: 7,
    color: colors.gray500,
    marginTop: 3,
    textAlign: 'center',
  },
  paymentDetailHighlight: {
    fontFamily: 'Helvetica-Bold',
  },
  paymentSavings: {
    fontSize: 7,
    color: colors.green600,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  
  // Terms & Conditions
  termsSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  termsTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray700,
    marginBottom: 6,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  termNumber: {
    fontSize: 7,
    color: colors.gray400,
    width: 14,
  },
  termText: {
    flex: 1,
    fontSize: 7,
    color: colors.gray500,
    lineHeight: 1.5,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    paddingTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray500,
    marginBottom: 2,
  },
  footerHighlight: {
    fontFamily: 'Helvetica-Bold',
    color: colors.gray700,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerCta: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 2,
  },
  footerContact: {
    fontSize: 8,
    color: colors.gray500,
  },
  
  // Utility
  textGreen: { color: colors.success },
  textGray: { color: colors.gray400 },
  textRight: { textAlign: 'right' },
  fontBold: { fontFamily: 'Helvetica-Bold' },
  flex1: { flex: 1 },
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (date: Date | string) => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Appello Logo Component
const AppelloLogo = () => (
  <Svg style={styles.logoSvg} viewBox="0 0 612 612">
    <Path fill={colors.primaryDark} d="M579.4,273l-141.1,86.6L286,274.9L0,441.8l274.8,162.9c9.6,5.7,21.6,5.7,31.2-0.2l273.7-165.7L579.4,273z"/>
    <Path fill={colors.primary} d="M0.1,337.9l141-86.6l129.4,72c14.1,7.8,31.2,7.6,45.1-0.5l264.4-154.4L312.4,10.7C297.9,2.2,280,2.3,265.6,11L0,172.5L0.1,337.9z"/>
    <Path fill={colors.accent} d="M0,338l141.1-86.7L0,172.5L0,338z"/>
    <Path fill="#455367" d="M579.8,272.8v166l-141.7-78.5L579.8,272.8z"/>
  </Svg>
);

// Checkbox Components
const CheckboxChecked = () => (
  <Svg style={styles.checkboxContainer} viewBox="0 0 20 20">
    <Rect x="0" y="0" width="20" height="20" rx="4" fill={colors.primary} />
    <Path d="M5 10l3 3 7-7" stroke="white" strokeWidth="2.5" fill="none" />
  </Svg>
);

const CheckboxUnchecked = () => (
  <Svg style={styles.checkboxContainer} viewBox="0 0 20 20">
    <Rect x="1" y="1" width="18" height="18" rx="3" fill="white" stroke={colors.gray300} strokeWidth="2" />
  </Svg>
);

interface LineItem {
  id: string;
  type: string;
  description: string;
  included: boolean;
  quantity: number;
  unitPrice: number;
  discountedPrice: number;
  notes?: string;
}

interface Discount {
  id: string;
  name: string;
  percentage: number;
  enabled: boolean;
  appliedTo: string;
  amount: number;
}

interface PreparedFor {
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
}

interface Totals {
  modulePrice: number;
  userPrice: number;
  serverStorage: number;
  subtotal: number;
  totalDiscounts: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface PaymentOption {
  amount: number;
  annual: number;
  monthlyEquiv: number;
  savings?: number;
  discountPct?: number;
}

interface EstimateData {
  estimateNumber: string;
  preparedFor: PreparedFor;
  numberOfUsers: number;
  moduleTier: number;
  currency: string;
  lineItems: LineItem[];
  discounts: Discount[];
  totals: Totals;
  paymentOptions: {
    monthly: PaymentOption;
    quarterly: PaymentOption;
    annual: PaymentOption;
  };
  notes?: string;
  createdAt: Date | string;
  validUntil?: Date | string;
}

// Standard Terms & Conditions
const TERMS_AND_CONDITIONS = [
  'Users added to your Appello account during an ongoing billing cycle—be it monthly, quarterly, or annually—will be prorated. You will only be billed for the portion of the billing cycle during which the new users have access to the application.',
  'All discounts shall be maintained in perpetuity for as long as you utilize the Appello platform, without interruption of service.',
  'Onboarding and Subscription Payments are via PAD/ACH (bank transfer). Onboarding/training fee is payable in advance of kickoff meeting, subscriptions are due at the time of go-live.',
  'Customer will only pay for the modules they are actively using at time of launch. Any additional modules added throughout the billing period, will still receive the discounted rate and will be prorated for the number of months remaining in the subscription period.',
];

export const EstimatePdfDocument = ({ estimate }: { estimate: EstimateData }) => {
  const lineItems = estimate.lineItems || [];
  const allModules = lineItems.filter((i) => i.type === 'module' || i.type === 'custom');
  const includedModules = allModules.filter((m) => m.included);
  const onboarding = lineItems.find((i) => i.type === 'onboarding');
  const userSub = lineItems.find((i) => i.type === 'user_subscription');
  const serverStorage = lineItems.find((i) => i.type === 'server_storage');
  const enabledDiscounts = (estimate.discounts || []).filter((d) => d.enabled);
  
  const onboardingDiscount = enabledDiscounts.find(d => d.appliedTo === 'onboarding');
  const userDiscount = enabledDiscounts.find(d => d.appliedTo === 'users');
  const serverDiscount = enabledDiscounts.find(d => d.appliedTo === 'server');
  const moduleDiscounts = enabledDiscounts.filter(d => d.appliedTo === 'modules');
  
  const onboardingBase = onboarding ? (onboarding.unitPrice || 0) * (onboarding.quantity || 1) : 0;
  const onboardingTotal = onboardingBase - (onboardingDiscount?.amount || 0);
  const moduleListTotal = includedModules.reduce((sum, m) => sum + (m.unitPrice || 0), 0);
  
  const preparedFor = estimate.preparedFor || { companyName: 'N/A', contactName: 'N/A' };
  const totals = estimate.totals || { subtotal: 0, taxRate: 13, taxAmount: 0, total: 0, modulePrice: 0, userPrice: 0, serverStorage: 0 };
  const paymentOptions = estimate.paymentOptions || { 
    monthly: { amount: 0, annual: 0, monthlyEquiv: 0 }, 
    quarterly: { amount: 0, annual: 0, monthlyEquiv: 0, discountPct: 8.3, savings: 0 }, 
    annual: { amount: 0, annual: 0, monthlyEquiv: 0, discountPct: 16.7, savings: 0 } 
  };

  // Calculate annual savings
  const monthlyAnnual = paymentOptions.monthly.annual || (paymentOptions.monthly.amount * 12);
  const quarterlyAnnual = paymentOptions.quarterly.annual || (paymentOptions.quarterly.amount * 4);
  const annualTotal = paymentOptions.annual.amount;
  const quarterlySavings = monthlyAnnual - quarterlyAnnual;
  const annualSavings = monthlyAnnual - annualTotal;
  const monthlyEquivAnnual = annualTotal / 12;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <AppelloLogo />
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>Appello</Text>
              <Text style={styles.companyAddress}>Appello Inc.</Text>
              <Text style={styles.companyAddress}>643 Railroad St</Text>
              <Text style={styles.companyAddress}>Mount Brydges, ON N0L 1W0</Text>
              <Text style={styles.companyAddress}>416-388-3907</Text>
            </View>
          </View>
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteTitle}>Software License Quote</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Estimate #</Text>
              <Text style={styles.metaValue}>{estimate.estimateNumber || 'DRAFT'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(estimate.createdAt)}</Text>
            </View>
            {estimate.validUntil && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Valid Until</Text>
                <Text style={styles.metaValue}>{formatDate(estimate.validUntil)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer & Config */}
        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <View style={styles.preparedFor}>
              <Text style={styles.sectionLabel}>Prepared For</Text>
              <Text style={styles.customerName}>{preparedFor.companyName}</Text>
              <Text style={styles.customerDetail}>{preparedFor.contactName}</Text>
              {preparedFor.email && <Text style={styles.customerDetail}>{preparedFor.email}</Text>}
              {preparedFor.phone && <Text style={styles.customerDetail}>{preparedFor.phone}</Text>}
            </View>
          </View>
          <View style={styles.colRight}>
            <View style={styles.configBox}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Users</Text>
                <Text style={styles.configValue}>{estimate.numberOfUsers || 1}</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Tier</Text>
                <Text style={styles.configValue}>{estimate.moduleTier || 1}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Onboarding */}
        {onboarding && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onboarding & Training (One-Time)</Text>
            <View style={styles.tableRow}>
              <Text style={[styles.flex1, { fontSize: 8 }]}>{onboarding.description}</Text>
              <Text style={[{ width: 65 }, styles.textRight, { fontSize: 8 }]}>{formatCurrency(onboardingBase)}</Text>
              <Text style={[{ width: 80 }, styles.textRight, styles.textGreen, { fontSize: 8 }]}>
                {onboardingDiscount && onboardingDiscount.amount > 0 ? `-${formatCurrency(onboardingDiscount.amount)} (${onboardingDiscount.percentage}%)` : '-'}
              </Text>
              <Text style={[{ width: 65 }, styles.textRight, styles.fontBold, { fontSize: 8 }]}>{formatCurrency(onboardingTotal)}</Text>
            </View>
          </View>
        )}

        {/* Monthly Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Subscription</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.flex1]}>Item</Text>
            <Text style={[styles.tableHeaderText, { width: 35 }, styles.textRight]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { width: 55 }, styles.textRight]}>Rate</Text>
            <Text style={[styles.tableHeaderText, { width: 55 }, styles.textRight]}>Base</Text>
            <Text style={[styles.tableHeaderText, { width: 80 }, styles.textRight]}>Discount</Text>
            <Text style={[styles.tableHeaderText, { width: 55 }, styles.textRight]}>Total</Text>
          </View>
          {userSub && (
            <View style={styles.tableRow}>
              <Text style={[styles.flex1, { fontSize: 8 }]}>User Subscription</Text>
              <Text style={[{ width: 35, fontSize: 8 }, styles.textRight]}>{userSub.quantity || 1}</Text>
              <Text style={[{ width: 55, fontSize: 8 }, styles.textRight]}>{formatCurrency(userSub.unitPrice)}</Text>
              <Text style={[{ width: 55, fontSize: 8 }, styles.textRight]}>{formatCurrency((userSub.unitPrice || 0) * (userSub.quantity || 1))}</Text>
              <Text style={[{ width: 80, fontSize: 8 }, styles.textRight, styles.textGreen]}>
                {userDiscount && userDiscount.amount > 0 ? `-${formatCurrency(userDiscount.amount)} (${userDiscount.percentage}%)` : '-'}
              </Text>
              <Text style={[{ width: 55, fontSize: 8 }, styles.textRight, styles.fontBold]}>{formatCurrency(totals.userPrice)}</Text>
            </View>
          )}
          {serverStorage && (
            <View style={styles.tableRow}>
              <Text style={[styles.flex1, { fontSize: 8 }]}>Server & Storage (Tier {estimate.moduleTier || 1})</Text>
              <Text style={[{ width: 35, fontSize: 8 }, styles.textRight]}>1</Text>
              <Text style={[{ width: 55, fontSize: 8 }, styles.textRight]}>{formatCurrency(serverStorage.unitPrice)}</Text>
              <Text style={[{ width: 55, fontSize: 8 }, styles.textRight]}>{formatCurrency(serverStorage.unitPrice)}</Text>
              <Text style={[{ width: 80, fontSize: 8 }, styles.textRight, styles.textGreen]}>
                {serverDiscount && serverDiscount.amount > 0 ? `-${formatCurrency(serverDiscount.amount)} (${serverDiscount.percentage}%)` : '-'}
              </Text>
              <Text style={[{ width: 55, fontSize: 8 }, styles.textRight, styles.fontBold]}>{formatCurrency(totals.serverStorage)}</Text>
            </View>
          )}
        </View>

        {/* Modules */}
        {allModules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modules</Text>
            <View style={styles.modulesGrid}>
              {allModules.map((m) => (
                <View key={m.id} style={[styles.moduleItem, !m.included && styles.moduleItemExcluded]}>
                  {m.included ? <CheckboxChecked /> : <CheckboxUnchecked />}
                  <Text style={[styles.moduleName, !m.included && styles.moduleNameExcluded]}>{m.description}</Text>
                  <Text style={styles.modulePrice}>
                    {m.included ? ((m.unitPrice || 0) > 0 ? formatCurrency(m.unitPrice) : 'Free') : '-'}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Module Totals */}
            <View style={[styles.moduleTotalRow, styles.tableRowAlt]}>
              <Text style={[styles.flex1, { fontSize: 8 }, styles.fontBold]}>Module List Price</Text>
              <Text style={[{ width: 75, fontSize: 8 }, styles.textRight, styles.fontBold]}>{formatCurrency(moduleListTotal)}</Text>
            </View>
            {moduleDiscounts.map((d) => (
              <View key={d.id} style={[styles.moduleTotalRow, { backgroundColor: colors.green50 }]}>
                <Text style={[styles.flex1, { fontSize: 8 }, styles.textGreen]}>{d.name} ({d.percentage}%)</Text>
                <Text style={[{ width: 75, fontSize: 8 }, styles.textRight, styles.textGreen]}>-{formatCurrency(d.amount)}</Text>
              </View>
            ))}
            <View style={[styles.moduleTotalRow, styles.tableRowAlt]}>
              <Text style={[styles.flex1, { fontSize: 9 }, styles.fontBold]}>Module Total</Text>
              <Text style={[{ width: 75, fontSize: 9 }, styles.textRight, styles.fontBold]}>{formatCurrency(totals.modulePrice)}</Text>
            </View>
          </View>
        )}

        {/* Summary & Payment Options */}
        <View style={styles.summaryPaymentRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.sectionLabel}>Monthly Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Module Price</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totals.modulePrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>User Price</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totals.userPrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Server & Storage</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totals.serverStorage)}</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.gray300, marginTop: 3, paddingTop: 3 }]}>
              <Text style={[styles.summaryLabel, styles.fontBold]}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totals.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.textGray]}>Tax ({totals.taxRate || 13}%)</Text>
              <Text style={[styles.summaryValue, styles.textGray]}>{formatCurrency(totals.taxAmount)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Monthly Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.total)}</Text>
            </View>
          </View>

          <View style={styles.paymentSection}>
            <Text style={[styles.sectionLabel, { marginBottom: 5 }]}>Payment Options</Text>
            <View style={styles.paymentGrid}>
              {/* Monthly */}
              <View style={styles.paymentCard}>
                <Text style={styles.paymentLabel}>Monthly</Text>
                <Text style={styles.paymentAmount}>{formatCurrency(paymentOptions.monthly.amount)}</Text>
                <Text style={styles.paymentPeriod}>per month</Text>
                <Text style={styles.paymentDetail}>Annual equivalent</Text>
                <Text style={[styles.paymentDetail, styles.paymentDetailHighlight]}>{formatCurrency(monthlyAnnual)}</Text>
              </View>
              
              {/* Quarterly */}
              <View style={[styles.paymentCard, styles.paymentCardQuarterly]}>
                <Text style={[styles.paymentBadge, styles.paymentBadgeBlue]}>Save {paymentOptions.quarterly.discountPct || 8.3}%</Text>
                <Text style={[styles.paymentLabel, { color: colors.blue600 }]}>Quarterly</Text>
                <Text style={[styles.paymentAmount, styles.paymentAmountQuarterly]}>
                  {formatCurrency(paymentOptions.quarterly.amount)}
                </Text>
                <Text style={styles.paymentPeriod}>per quarter</Text>
                <Text style={[styles.paymentDetail, { color: colors.blue600 }]}>Annual equivalent</Text>
                <Text style={[styles.paymentDetail, styles.paymentDetailHighlight, { color: colors.blue700 }]}>{formatCurrency(quarterlyAnnual)}</Text>
                <Text style={[styles.paymentSavings, { color: colors.blue600 }]}>Save {formatCurrency(quarterlySavings)}/yr</Text>
              </View>
              
              {/* Annual */}
              <View style={[styles.paymentCard, styles.paymentCardAnnual, styles.paymentCardLast]}>
                <Text style={styles.paymentBadge}>Best Value • Save {paymentOptions.annual.discountPct || 16.7}%</Text>
                <Text style={[styles.paymentLabel, { color: colors.green600 }]}>Annual</Text>
                <Text style={[styles.paymentAmount, styles.paymentAmountAnnual]}>
                  {formatCurrency(annualTotal)}
                </Text>
                <Text style={styles.paymentPeriod}>per year</Text>
                <Text style={[styles.paymentDetail, { color: colors.green600 }]}>Monthly equivalent</Text>
                <Text style={[styles.paymentDetail, styles.paymentDetailHighlight, { color: colors.green700 }]}>{formatCurrency(monthlyEquivAnnual)}/mo</Text>
                <Text style={styles.paymentSavings}>Save {formatCurrency(annualSavings)}/yr</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Notes</Text>
          {TERMS_AND_CONDITIONS.map((term, index) => (
            <View key={index} style={styles.termItem}>
              <Text style={styles.termNumber}>{index + 1}.</Text>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerText}>
                <Text style={styles.footerHighlight}>Quote Valid Until: </Text>
                {estimate.validUntil ? formatDate(estimate.validUntil) : '30 days from issue date'}
              </Text>
              <Text style={styles.footerText}>
                This quote is subject to final review and approval. Pricing may change based on final requirements.
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerCta}>Ready to get started?</Text>
              <Text style={styles.footerContact}>Contact us at 416-388-3907</Text>
              <Text style={styles.footerContact}>or sales@appello.com</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default EstimatePdfDocument;
