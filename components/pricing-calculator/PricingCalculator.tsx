"use client";

import { useState, useMemo, useEffect } from "react";
import Button from "./Button";
import { getModuleVisual } from "./ModuleVisuals";

// Icon Components
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ModuleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const DiscountIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface PricingTier {
  min: number;
  max: number;
  tier: number;
  serverStorage: number;
  modulePrice: number;
  onboarding: number;
}

const PRICING_TIERS: PricingTier[] = [
  { min: 0, max: 10, tier: 1, serverStorage: 249.99, modulePrice: 149.99, onboarding: 7500 },
  { min: 11, max: 20, tier: 2, serverStorage: 349.99, modulePrice: 299.99, onboarding: 10000 },
  { min: 21, max: 40, tier: 3, serverStorage: 399.99, modulePrice: 399.99, onboarding: 14000 },
  { min: 41, max: 99, tier: 4, serverStorage: 499.99, modulePrice: 499.99, onboarding: 20000 },
  { min: 100, max: 299, tier: 5, serverStorage: 699.99, modulePrice: 599.99, onboarding: 30000 },
];

type BusinessFunction = 
  | "Sales & Preconstruction"
  | "Field Execution & Workforce Operations"
  | "Project Delivery & Controls"
  | "Safety & Compliance"
  | "Financial & Administrative Operations"
  | "Foundational Platform";

interface ModuleInfo {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  businessFunction: BusinessFunction;
  basePrice: number;
  note?: string;
  comingSoon?: boolean;
}

const MODULES: ModuleInfo[] = [
  { 
    id: "core", 
    name: "CORE", 
    subtitle: "The Foundational Platform",
    description: "Everything connects through our unified CORE platform—the foundation that all modules are built on top of. One source of truth for your entire business.",
    businessFunction: "Foundational Platform",
    basePrice: 0,
    note: "Free with all subscriptions"
  },
  { 
    id: "crm", 
    name: "CRM, Sales & Estimation", 
    subtitle: "Estimate Smarter",
    description: "Create accurate estimates faster with integrated CRM, track leads through your sales pipeline, and convert quotes to jobs seamlessly.",
    businessFunction: "Sales & Preconstruction",
    basePrice: 399.99 
  },
  { 
    id: "scheduling", 
    name: "Scheduling & Dispatch", 
    subtitle: "Schedule Smarter",
    description: "Assign crews to jobs with certification cross-checking, drag-and-drop simplicity, and instant mobile notifications to your field teams.",
    businessFunction: "Field Execution & Workforce Operations",
    basePrice: 399.99 
  },
  { 
    id: "timesheets", 
    name: "Timesheets & Workforce Admin", 
    subtitle: "Track Time Better",
    description: "GPS-enabled clock in/out with automatic union payroll calculations—multi-classification, shift differentials, prevailing wage, travel pay handled automatically.",
    businessFunction: "Field Execution & Workforce Operations",
    basePrice: 399.99 
  },
  { 
    id: "equipment", 
    name: "Equipment & Asset Management", 
    subtitle: "Manage Assets",
    description: "Full lifecycle management with QR codes: inspection history, installation records, service logs, work orders and mapping —all at your fingertips.",
    businessFunction: "Field Execution & Workforce Operations",
    basePrice: 399.99 
  },
  { 
    id: "job-financials", 
    name: "Job Financials & Cost Control", 
    subtitle: "Control Costs",
    description: "Monitor job profitability in real-time, track labor and material costs, and make data-driven decisions to improve margins.",
    businessFunction: "Project Delivery & Controls",
    basePrice: 399.99 
  },
  { 
    id: "project-mgmt", 
    name: "Project Management", 
    subtitle: "Manage Projects",
    description: "Projects, Jobs, Notes, Documents and File Sharing. Coordinate multiple jobs, track progress, manage documents and photos, and keep your entire team aligned.",
    businessFunction: "Project Delivery & Controls",
    basePrice: 399.99,
    note: "beta"
  },
  { 
    id: "po-inventory", 
    name: "Purchase Order & Inventory Management", 
    subtitle: "Coming Soon",
    description: "Streamline procurement, track inventory across job sites, and manage purchase orders from request to delivery.",
    businessFunction: "Project Delivery & Controls",
    basePrice: 399.99,
    comingSoon: true
  },
  { 
    id: "safety-forms", 
    name: "Safety & Forms", 
    subtitle: "Stay Compliant",
    description: "Digital safety forms with conditional logic, certification tracking with expiration alerts, and instant audit-ready documentation.",
    businessFunction: "Safety & Compliance",
    basePrice: 399.99 
  },
  { 
    id: "training-compliance", 
    name: "Training & Compliance", 
    subtitle: "Train Your Team",
    description: "Manage employee training records, track certification expirations, and ensure your workforce stays compliant and qualified.",
    businessFunction: "Safety & Compliance",
    basePrice: 399.99 
  },
  { 
    id: "progress-billing", 
    name: "Progress Billing & Invoicing", 
    subtitle: "Bill Faster",
    description: "Generate AIA-style progress invoices in minutes instead of hours. Automatic QuickBooks sync means you get paid 1-2 weeks faster—cashflow when you need it.",
    businessFunction: "Financial & Administrative Operations",
    basePrice: 399.99 
  },
  { 
    id: "accounting-integration", 
    name: "Accounting Integration", 
    subtitle: "Sync Seamlessly",
    description: "Seamless integration with QuickBooks Online and other accounting systems. Automatic data sync eliminates double entry and reduces errors.",
    businessFunction: "Financial & Administrative Operations",
    basePrice: 299.99 
  },
  { 
    id: "hr-onboarding", 
    name: "Human Resources", 
    subtitle: "Manage Your Team",
    description: "Streamline employee onboarding, track employee information, manage benefits and payroll, and maintain comprehensive HR records.",
    businessFunction: "Financial & Administrative Operations",
    basePrice: 299.99 
  },
  { 
    id: "appello-intelligence", 
    name: "Appello Intelligence", 
    subtitle: "Coming Soon",
    description: "AI-powered insights that analyze real-time field, financial, and workforce data to provide actionable recommendations and predictions.",
    businessFunction: "Financial & Administrative Operations",
    basePrice: 299.99,
    comingSoon: true
  },
];

const businessFunctionColors: Record<BusinessFunction, { bg: string; text: string; border: string }> = {
  "Sales & Preconstruction": {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200"
  },
  "Field Execution & Workforce Operations": {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200"
  },
  "Project Delivery & Controls": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200"
  },
  "Safety & Compliance": {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200"
  },
  "Financial & Administrative Operations": {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200"
  },
  "Foundational Platform": {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200"
  }
};

const USER_COST_BASE = 16.59; // Base price per user
const USER_COST_DISCOUNT = 0.4; // 40% discount
const EARLY_ADOPTER_DISCOUNT = 0.2; // 20% Early Adopter discount
const NIA_DISCOUNT = 0.1; // 10% NIA/Regional Association discount (additional)
const ONBOARDING_DISCOUNT = 0.3; // 30% discount
const QUARTERLY_DISCOUNT = 0.083; // 8.3% discount for quarterly payment
const ANNUAL_DISCOUNT = 0.167; // 16.7% discount for annual payment
const TAX_RATE = 0.13; // 13% HST (Ontario)

type Step = 1 | 2 | 3 | 4;

export default function PricingCalculator() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [numUsers, setNumUsers] = useState<number>(40);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    new Set(MODULES.map(m => m.id)) // All modules selected by default
  );
  const [hasNIADiscount, setHasNIADiscount] = useState<boolean>(true);
  const [paymentFrequency, setPaymentFrequency] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [showModuleDetails, setShowModuleDetails] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");

  const currentTier = useMemo(() => {
    return PRICING_TIERS.find(tier => numUsers >= tier.min && numUsers <= tier.max) || PRICING_TIERS[PRICING_TIERS.length - 1];
  }, [numUsers]);

  const calculations = useMemo(() => {
    // User cost with 40% discount
    const userCostPerUser = USER_COST_BASE * (1 - USER_COST_DISCOUNT);
    const totalUserCost = userCostPerUser * numUsers;

    // Server and storage cost
    const serverStorageCost = currentTier.serverStorage;

    // Module costs - calculate based on actual module base prices
    const selectedModulesList = Array.from(selectedModules).filter(id => id !== "core");
    let totalModuleListPrice = 0;
    
    selectedModulesList.forEach(moduleId => {
      const module = MODULES.find(m => m.id === moduleId);
      if (module && module.basePrice) {
        totalModuleListPrice += module.basePrice;
      }
    });

    // Apply Early Adopter discount (20%)
    const earlyAdopterDiscount = totalModuleListPrice * EARLY_ADOPTER_DISCOUNT;
    const afterEarlyAdopter = totalModuleListPrice - earlyAdopterDiscount;

    // Apply NIA/Regional Association discount (10% additional) if applicable
    const niaDiscount = hasNIADiscount ? afterEarlyAdopter * NIA_DISCOUNT : 0;
    const totalModuleCost = afterEarlyAdopter - niaDiscount;

    // Monthly subscription subtotal (before tax)
    const monthlySubscriptionSubtotal = totalUserCost + serverStorageCost + totalModuleCost;

    // Tax calculation
    const taxAmount = monthlySubscriptionSubtotal * TAX_RATE;
    const monthlySubscriptionWithTax = monthlySubscriptionSubtotal + taxAmount;

    // Onboarding cost with 30% discount
    const onboardingCost = currentTier.onboarding * (1 - ONBOARDING_DISCOUNT);

    // Payment frequency calculations
    let monthlyEquivalent = monthlySubscriptionSubtotal;
    let paymentAmount = monthlySubscriptionSubtotal;
    let annualEquivalent = monthlySubscriptionSubtotal * 12;

    if (paymentFrequency === "quarterly") {
      monthlyEquivalent = monthlySubscriptionSubtotal * (1 - QUARTERLY_DISCOUNT);
      paymentAmount = monthlyEquivalent * 3;
      annualEquivalent = monthlyEquivalent * 12;
    } else if (paymentFrequency === "annual") {
      monthlyEquivalent = monthlySubscriptionSubtotal * (1 - ANNUAL_DISCOUNT);
      paymentAmount = monthlyEquivalent * 12;
      annualEquivalent = paymentAmount;
    }

    const savings = (monthlySubscriptionSubtotal * 12) - annualEquivalent;

    return {
      userCostPerUser,
      totalUserCost,
      serverStorageCost,
      totalModuleListPrice,
      earlyAdopterDiscount,
      niaDiscount,
      totalModuleCost,
      monthlySubscriptionSubtotal,
      taxAmount,
      monthlySubscriptionWithTax,
      onboardingCost,
      monthlyEquivalent,
      paymentAmount,
      annualEquivalent,
      savings,
      selectedModulesCount: selectedModulesList.length,
    };
  }, [numUsers, currentTier, selectedModules, hasNIADiscount, paymentFrequency]);

  const toggleModule = (moduleId: string) => {
    if (moduleId === "core") return; // Core module is always included
    
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const selectAllModules = () => {
    setSelectedModules(new Set(MODULES.map(m => m.id)));
  };

  const deselectAllModules = () => {
    setSelectedModules(new Set(["core"])); // Keep core module
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const copyQuote = async () => {
    const quoteText = `Appello Pricing Quote
Number of Users: ${numUsers}
Tier: ${currentTier.tier}
Selected Modules: ${calculations.selectedModulesCount}
Payment Frequency: ${paymentFrequency}
Monthly Equivalent: ${formatCurrency(calculations.monthlyEquivalent)}
Annual Total: ${formatCurrency(calculations.annualEquivalent)}
First Year Total: ${formatCurrency(calculations.onboardingCost + (paymentFrequency === "annual" ? calculations.paymentAmount : paymentFrequency === "quarterly" ? calculations.paymentAmount * 4 : calculations.monthlySubscriptionSubtotal * 12))}`;
    
    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Scroll to top when step changes - optimized
  useEffect(() => {
    // Use requestAnimationFrame for smoother performance
    const scrollId = requestAnimationFrame(() => {
      const calculatorElement = document.getElementById('pricing-calculator');
      if (calculatorElement) {
        const headerOffset = 100;
        const elementPosition = calculatorElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
    });

    return () => cancelAnimationFrame(scrollId);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < 4) {
      setAnimationDirection("forward");
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setAnimationDirection("backward");
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const goToStep = (step: Step) => {
    setAnimationDirection(step > currentStep ? "forward" : "backward");
    setCurrentStep(step);
  };

  const steps = [
    { number: 1, title: "Configure", subtitle: "Users & Modules" },
    { number: 2, title: "Discounts", subtitle: "Save More" },
    { number: 3, title: "Payment", subtitle: "Choose Plan" },
    { number: 4, title: "Review", subtitle: "Your Quote" },
  ];

  const selectedModulesList = Array.from(selectedModules).filter(id => id !== "core");
  const selectedModulesData = selectedModulesList
    .map(id => MODULES.find(m => m.id === id))
    .filter((m) => m !== undefined) as Array<typeof MODULES[number]>;

  return (
    <div id="pricing-calculator" className="max-w-7xl mx-auto relative">
      {/* Main Content */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:p-8 shadow-xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Build Your Appello Plan
            </h2>
            <p className="text-gray-600">Customize your pricing in just a few steps</p>
          </div>
          <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-lg">
            <CartIcon />
            <span className="text-sm font-medium text-gray-700">
              {calculations.selectedModulesCount} modules
            </span>
          </div>
        </div>

        {/* Progress Steps */}
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <button
                  key={step.number}
                  onClick={() => goToStep(step.number as Step)}
                  className={`relative flex flex-col items-center ${
                    currentStep >= step.number ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                  disabled={currentStep < step.number}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      currentStep === step.number
                        ? "bg-primary text-white scale-110 shadow-lg"
                        : currentStep > step.number
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircleIcon />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-xs font-semibold ${
                        currentStep === step.number ? "text-primary" : "text-gray-600"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px] relative">
        <div
          key={currentStep}
          className={`transition-all duration-500 ease-in-out ${
            animationDirection === "forward"
              ? "animate-fadeInUp"
              : "animate-fadeInUp"
          }`}
        >

          {/* Step 1: Configure Users & Modules */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Configure Your Plan</h3>
                <p className="text-gray-600">Start by selecting the number of users and modules you need</p>
              </div>
        {/* Number of Users */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <label htmlFor="numUsers" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-4">
            <UsersIcon />
            <span>Number of Users</span>
          </label>
          
          {/* Slider */}
          <div className="mb-4 relative">
            <input
              id="numUsers"
              type="range"
              min="1"
              max="299"
              value={numUsers}
              onChange={(e) => setNumUsers(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer pricing-slider"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((numUsers - 1) / 298) * 100}%, #e5e7eb ${((numUsers - 1) / 298) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>

          {/* Display Value and Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setNumUsers(Math.max(1, numUsers - 1))}
                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors font-bold text-lg"
              >
                −
              </button>
              <div className="text-center min-w-[80px]">
                <div className="text-3xl font-bold text-primary">{numUsers}</div>
                <div className="text-xs text-gray-500">users</div>
              </div>
              <button
                type="button"
                onClick={() => setNumUsers(Math.min(299, numUsers + 1))}
                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors font-bold text-lg"
              >
                +
              </button>
            </div>
            <div className="text-right">
                  <div className="text-sm font-semibold text-gray-700">
                    {formatCurrency(calculations.userCostPerUser)}/user
                  </div>
                  <div className="text-xs text-gray-500">per month</div>
            </div>
          </div>

          {/* Tier Info */}
          <div className="flex items-center justify-between pt-4 border-t border-blue-200">
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                currentTier.tier === 1 ? "bg-blue-100 text-blue-700" :
                currentTier.tier === 2 ? "bg-green-100 text-green-700" :
                currentTier.tier === 3 ? "bg-yellow-100 text-yellow-700" :
                currentTier.tier === 4 ? "bg-orange-100 text-orange-700" :
                "bg-purple-100 text-purple-700"
              }`}>
                Tier {currentTier.tier}
              </div>
              <span className="text-sm text-gray-600">
                {currentTier.min}-{currentTier.max} users
              </span>
            </div>
                <div className="text-sm font-semibold text-gray-900">
                  Total: {formatCurrency(calculations.totalUserCost)}/mo
            </div>
          </div>
        </div>

        {/* Module Selection */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
              <ModuleIcon />
              <span>Select Modules</span>
            </label>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedModulesList.length} of {MODULES.filter(m => m.id !== "core").length} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={selectAllModules}
                  className="text-xs px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium border border-primary/20"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllModules}
                  className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-300"
                >
                  Deselect All
                </button>
              </div>
            </div>
          </div>

          {/* Core Module - Always Included */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl border-2 border-indigo-300 shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-3 gap-6 p-6">
                {/* Visual Section */}
                <div className="md:col-span-1">
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg overflow-hidden flex items-center justify-center relative border-2 border-indigo-200">
                    {(() => {
                      const CoreVisual = getModuleVisual("CORE");
                      return <CoreVisual className="w-full h-full" />;
                    })()}
                    <div className="absolute top-2 right-2">
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>INCLUDED</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-3 flex-wrap">
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200">
                        Foundational Platform
                      </span>
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
                        Always Included
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{MODULES.find(m => m.id === "core")?.name}</h3>
                    <h4 className="text-base font-semibold text-indigo-600 mb-3">{MODULES.find(m => m.id === "core")?.subtitle}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{MODULES.find(m => m.id === "core")?.description}</p>
                  </div>
                  
                  {/* Features List */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-indigo-200">
                    <div className="flex items-center space-x-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Desktop & Mobile Apps</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Real-Time Sync</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Unified Data Platform</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>All Modules Built On Top</span>
                    </div>
                  </div>
                  
                  {/* Price Badge */}
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-indigo-200">
                    <div>
                      <div className="text-3xl font-bold text-green-600">Free</div>
                      <div className="text-xs text-gray-500">with all subscriptions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">No additional cost</div>
                      <div className="text-sm font-semibold text-indigo-700">Included in every plan</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.filter(m => m.id !== "core").map((module) => {
              const isSelected = selectedModules.has(module.id);
              const discountedPrice = module.basePrice > 0 
                ? module.basePrice * (1 - EARLY_ADOPTER_DISCOUNT) * (hasNIADiscount ? (1 - NIA_DISCOUNT) : 1)
                : 0;
              const colors = businessFunctionColors[module.businessFunction];
              
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className={`relative text-left p-5 rounded-xl border-2 transition-all duration-300 group ${
                    isSelected
                      ? `border-primary bg-primary/5 shadow-lg scale-[1.02] ${colors.border}`
                      : `border-gray-200 bg-white hover:border-primary/50 hover:shadow-md ${colors.border}`
                  }`}
                >
                  {/* Visual */}
                  <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center relative">
                    {(() => {
                      const ModuleVisual = getModuleVisual(module.name);
                      return <ModuleVisual className="w-full h-full group-hover:scale-105 transition-transform duration-300" />;
                    })()}
                    
                    {/* Selection Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg ring-2 ring-white ring-offset-2 ring-offset-primary/20 z-10">
                          <CheckIcon />
                        </div>
                      </div>
                    )}
                    
                    {/* Unselected hover indicator */}
                    {!isSelected && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md border-2 border-gray-300">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-block ${colors.bg} ${colors.text} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                      {module.businessFunction}
                    </span>
                    {module.comingSoon && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        COMING SOON
                      </span>
                    )}
                    {module.note && !module.comingSoon && (
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        {module.note.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {module.name}
                  </h3>
                  <h4 className="text-sm font-medium text-primary mb-3">
                    {module.subtitle}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">
                    {module.description}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      {module.basePrice > 0 ? (
                        <>
                          <div className="text-xs text-gray-500 line-through">
                            ${module.basePrice.toFixed(2)}/mo
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(discountedPrice)}/mo
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-bold text-green-600">
                          Free
                        </div>
                      )}
                    </div>
                    {!isSelected && (
                      <div className="text-xs text-gray-400 group-hover:text-primary transition-colors">
                        Click to add
                      </div>
                    )}
                    {isSelected && (
                      <div className="text-xs text-primary font-medium">
                        Selected ✓
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

            </div>
          )}

          {/* Step 2: Discounts */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Apply Discounts</h3>
                <p className="text-gray-600">Unlock additional savings with available discounts</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-6">
                <label className="flex items-center space-x-3 cursor-pointer group">
                          <div className="relative">
                            <input
                      type="checkbox"
                      checked={hasNIADiscount}
                      onChange={(e) => setHasNIADiscount(e.target.checked)}
                      className="w-6 h-6 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    {hasNIADiscount && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckIcon />
                  </div>
                )}
                              </div>
                  <div className="flex-1">
                      <div className="flex items-center space-x-2">
                      <DiscountIcon />
                      <span className="text-lg font-bold text-gray-900">
                        NIA / Regional Association Discount
                              </span>
                      <span className="text-sm px-3 py-1 bg-yellow-200 rounded-full font-bold text-yellow-900">
                        10% OFF
                      </span>
                          </div>
                    {hasNIADiscount && calculations.niaDiscount > 0 && (
                      <div className="mt-2 p-3 bg-white rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">You're saving:</span>
                          <span className="text-xl font-bold text-green-600">
                            {formatCurrency(calculations.niaDiscount)}/month
                        </span>
                      </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatCurrency(calculations.niaDiscount * 12)} per year
                      </div>
                    </div>
                    )}
                  </div>
                </label>
                </div>

              {/* Summary Card */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <CartIcon />
                  <span>Your Current Selection</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Users</div>
                    <div className="text-xl font-bold text-gray-900">{numUsers}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Modules</div>
                    <div className="text-xl font-bold text-gray-900">{calculations.selectedModulesCount}</div>
                  </div>
                  <div className="col-span-2 pt-4 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Monthly Subtotal:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(calculations.monthlySubscriptionSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Frequency */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Choose Payment Plan</h3>
                <p className="text-gray-600">Select how you'd like to pay and save more with annual plans</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["monthly", "quarterly", "annual"] as const).map((freq) => {
                  const monthlyEq = freq === "monthly" 
                    ? calculations.monthlySubscriptionSubtotal
                    : freq === "quarterly"
                    ? calculations.monthlySubscriptionSubtotal * (1 - QUARTERLY_DISCOUNT)
                    : calculations.monthlySubscriptionSubtotal * (1 - ANNUAL_DISCOUNT);
                  const annualTotal = monthlyEq * 12;
                  const savings = (calculations.monthlySubscriptionSubtotal * 12) - annualTotal;
                  const discount = freq === "quarterly" ? "8.3%" : freq === "annual" ? "16.7%" : null;
                  
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setPaymentFrequency(freq)}
                      className={`relative p-6 rounded-xl border-2 text-left transition-all transform hover:scale-105 ${
                        paymentFrequency === freq
                          ? "border-primary bg-primary text-white shadow-xl scale-105"
                          : "border-gray-300 bg-white hover:border-primary hover:shadow-lg"
                      }`}
                    >
                      {discount && (
                        <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                          paymentFrequency === freq 
                            ? "bg-white text-primary" 
                            : "bg-green-500 text-white"
                        }`}>
                          Save {discount}
                        </div>
                      )}
                      <div className="mb-4">
                        <div className="text-2xl font-bold mb-1">
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </div>
                        <div className={`text-sm ${paymentFrequency === freq ? "text-white/90" : "text-gray-600"}`}>
                          Billed {freq === "monthly" ? "monthly" : freq === "quarterly" ? "every 3 months" : "annually"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className={`text-3xl font-bold ${paymentFrequency === freq ? "text-white" : "text-gray-900"}`}>
                          {formatCurrency(monthlyEq)}
                        </div>
                        <div className={`text-xs ${paymentFrequency === freq ? "text-white/80" : "text-gray-500"}`}>
                          per month equivalent
                        </div>
                        {freq !== "monthly" && (
                          <div className={`pt-2 border-t ${paymentFrequency === freq ? "border-white/30" : "border-gray-200"}`}>
                            <div className={`text-sm ${paymentFrequency === freq ? "text-white/90" : "text-gray-600"}`}>
                              Annual: {formatCurrency(annualTotal)}
                            </div>
                            {savings > 0 && (
                              <div className={`text-xs font-medium mt-1 ${paymentFrequency === freq ? "text-white" : "text-green-600"}`}>
                                Save {formatCurrency(savings)}/year
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {paymentFrequency === freq && (
                        <div className="absolute bottom-4 right-4">
                          <CheckCircleIcon />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                <h4 className="font-bold text-gray-900 mb-4">Payment Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Monthly Equivalent:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(calculations.monthlyEquivalent)}
                    </span>
                  </div>
                  {paymentFrequency !== "monthly" && (
                    <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                      <span className="text-gray-700">Annual Total:</span>
                      <span className="font-bold text-green-700 text-lg">
                        {formatCurrency(calculations.annualEquivalent)}
                      </span>
                    </div>
                  )}
                  {calculations.savings > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t-2 border-green-300">
                      <span className="font-bold text-green-700">Total Annual Savings:</span>
                      <span className="font-bold text-green-700 text-xl">
                        {formatCurrency(calculations.savings)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                  <CheckCircleIcon />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Step 4: Review Your Quote</h3>
                <p className="text-gray-600">Everything looks great! Here's your complete pricing breakdown</p>
              </div>

              {/* Complete Quote */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Configuration</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-700">Users:</span>
                          <span className="font-bold">{numUsers} (Tier {currentTier.tier})</span>
                    </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Modules:</span>
                          <span className="font-bold">{calculations.selectedModulesCount} selected</span>
                  </div>
                </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Onboarding</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-gray-700 line-through">{formatCurrency(currentTier.onboarding)}</span>
                          <span className="font-bold text-green-600">{formatCurrency(calculations.onboardingCost)}</span>
                    </div>
                        <div className="text-xs text-gray-500 mt-1">30% discount applied</div>
                    </div>
                  </div>
                </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Monthly Subscription</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Users ({numUsers} × {formatCurrency(calculations.userCostPerUser)})</span>
                          <span className="font-medium">{formatCurrency(calculations.totalUserCost)}</span>
                      </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Server & Storage</span>
                          <span className="font-medium">{formatCurrency(calculations.serverStorageCost)}</span>
                    </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Modules</span>
                          <span className="font-medium">{formatCurrency(calculations.totalModuleCost)}</span>
                    </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(calculations.monthlySubscriptionSubtotal)}</span>
                  </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Tax (HST 13%):</span>
                      <span className="text-gray-600">{formatCurrency(calculations.taxAmount)}</span>
                    </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-primary/10 rounded-lg p-6 border-2 border-primary">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-900">First Year Total</h4>
                      <button
                        onClick={copyQuote}
                        className="flex items-center space-x-2 px-3 py-1 text-xs font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {copied ? (
                          <>
                            <CheckIcon />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {formatCurrency(calculations.onboardingCost)} onboarding + {formatCurrency(
                          paymentFrequency === "annual" 
                            ? calculations.paymentAmount 
                            : paymentFrequency === "quarterly"
                            ? calculations.paymentAmount * 4
                            : calculations.monthlySubscriptionSubtotal * 12
                        )} subscription
                      </div>
                      <div className="text-xs text-gray-500">
                        Monthly: {formatCurrency(calculations.monthlyEquivalent)} | Annual: {formatCurrency(calculations.annualEquivalent)}
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      {formatCurrency(
                        calculations.onboardingCost + 
                        (paymentFrequency === "annual" 
                          ? calculations.paymentAmount 
                          : paymentFrequency === "quarterly"
                          ? calculations.paymentAmount * 4
                          : calculations.monthlySubscriptionSubtotal * 12)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center space-x-2">
                  <InfoIcon />
                  <span>Important Notes</span>
                </h4>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Users added during billing cycles are prorated</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>All discounts maintained for lifetime of service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Payments via PAD/ACH bank transfer</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Additional modules receive same discounts and are prorated</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t-2 border-gray-200">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === step.number
                    ? "bg-primary w-8"
                    : currentStep > step.number
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-0"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5"
            }`}
          >
            <ArrowLeftIcon />
            <span>Previous</span>
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl ml-auto"
            >
              <span>Continue to Next Step</span>
              <ArrowRightIcon />
            </button>
          ) : (
            <div className="ml-auto">
              <Button
                href="https://meetings.hubspot.com/shelson/appello-demo"
                variant="primary"
                size="lg"
                className="shadow-lg hover:shadow-xl"
              >
                Book a Demo to Get Started
              </Button>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
