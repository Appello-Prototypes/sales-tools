// Using any for now since AssessmentData structure may differ from DB model
type AssessmentData = any;

export interface AppelloFeature {
  module: string;
  feature: string;
  description: string;
  relevance: 'High' | 'Medium' | 'Low';
  reason: string;
  painPoints: string[];
}

export interface FeatureAnalysis {
  topFeatures: AppelloFeature[];
  recommendedModules: string[];
  demoFocus: string[];
  keyDifferentiators: string[];
}

/**
 * Analyzes assessment responses to identify which Appello features/modules
 * are most relevant to the prospect
 */
export function analyzeAppelloFeatures(data: AssessmentData): FeatureAnalysis {
  const painPoints = data.section2?.painPoints || [];
  const section3 = data.section3 || {};
  const section4 = data.section4 || {};
  const section5 = data.section5 || {};
  
  const features: AppelloFeature[] = [];
  
  // Analyze pain points and map to Appello features
  painPoints.forEach((painPoint: string) => {
    const lowerPain = painPoint.toLowerCase();
    
    // Time Tracking & Payroll
    if (lowerPain.includes('time tracking') || lowerPain.includes('timesheet') || lowerPain.includes('payroll')) {
      features.push({
        module: 'Workforce Admin',
        feature: 'GPS-Enabled Time Tracking & Union Payroll',
        description: 'Mobile clock in/out with automatic union payroll calculations (multi-classification, shift differentials, prevailing wage, travel pay)',
        relevance: 'High',
        reason: 'Directly addresses time tracking and payroll processing pain',
        painPoints: [painPoint],
      });
    }
    
    // Job Profitability & Costing
    if (lowerPain.includes('job profitability') || lowerPain.includes('job costing') || lowerPain.includes('budget') || lowerPain.includes('over budget')) {
      features.push({
        module: 'Financials',
        feature: 'Real-Time Job Costing & Profitability',
        description: 'Real-time visibility into job costs vs. budget with profitability dashboards and early warning alerts',
        relevance: 'High',
        reason: 'Addresses lack of visibility into job profitability',
        painPoints: [painPoint],
      });
    }
    
    // Material Ordering & Procurement
    if (lowerPain.includes('material') || lowerPain.includes('ordering') || lowerPain.includes('procurement') || lowerPain.includes('purchase order')) {
      features.push({
        module: 'Material Management',
        feature: 'Material Request → PO → Receiving Workflow',
        description: 'Streamlined material ordering workflow from field request to purchase order to receiving, with automatic cost posting to jobs',
        relevance: 'High',
        reason: 'Solves chaotic material ordering and cost tracking challenges',
        painPoints: [painPoint],
      });
    }
    
    // Change Orders
    if (lowerPain.includes('change order') || lowerPain.includes('change orders') || lowerPain.includes('billing') || lowerPain.includes('invoicing')) {
      features.push({
        module: 'Financials',
        feature: 'Change Order Capture & Billing',
        description: 'Mobile change order documentation and tracking to capture 100% of billable changes',
        relevance: 'High',
        reason: 'Prevents missed change orders and revenue leakage',
        painPoints: [painPoint],
      });
    }
    
    // Scheduling
    if (lowerPain.includes('scheduling') || lowerPain.includes('crew') || lowerPain.includes('allocation')) {
      features.push({
        module: 'Scheduling',
        feature: 'Crew Scheduling with Certification Cross-Referencing',
        description: 'Drag-and-drop crew scheduling with automatic certification validation and conflict detection',
        relevance: 'High',
        reason: 'Eliminates scheduling conflicts and ensures qualified crews',
        painPoints: [painPoint],
      });
    }
    
    // Paper Forms & Documentation
    if (lowerPain.includes('paper') || lowerPain.includes('forms') || lowerPain.includes('document') || lowerPain.includes('compliance')) {
      features.push({
        module: 'Safety & Compliance',
        feature: 'Digital Safety Forms & Compliance Tracking',
        description: 'Digital forms replace paper, with automated compliance tracking and certification management',
        relevance: 'High',
        reason: 'Eliminates paper forms and ensures compliance',
        painPoints: [painPoint],
      });
    }
    
    // Communication
    if (lowerPain.includes('communication') || lowerPain.includes('field-office') || lowerPain.includes('phone tag')) {
      features.push({
        module: 'Core',
        feature: 'Field-to-Office Communication Hub',
        description: 'Integrated messaging and notes system connecting field and office teams',
        relevance: 'Medium',
        reason: 'Improves communication between field and office',
        painPoints: [painPoint],
      });
    }
    
    // Service Work
    if (lowerPain.includes('service') || lowerPain.includes('work order') || lowerPain.includes('time & materials')) {
      features.push({
        module: 'Work Orders',
        feature: 'Service Work & Time & Materials Tracking',
        description: 'Complete service work management with work order tracking and time & materials billing',
        relevance: 'High',
        reason: 'Addresses service work tracking needs',
        painPoints: [painPoint],
      });
    }
  });
  
  // Add features based on current state
  if (section3.unionized === 'Yes, fully unionized' || section3.unionized === 'Yes, mixed union and non-union workforce') {
    features.push({
      module: 'Workforce Admin',
      feature: 'Union Payroll Complexity Mastery',
      description: 'Automatic handling of multiple CBAs, multi-classification, shift differentials, prevailing wage, and travel pay',
      relevance: 'High',
      reason: 'Union complexity is a signature Appello strength',
      painPoints: ['Union payroll complexity'],
    });
  }
  
  if (section3.cbaCount && parseInt(section3.cbaCount) > 1) {
    features.push({
      module: 'Workforce Admin',
      feature: 'Multi-CBA Payroll Management',
      description: 'Handle multiple Collective Bargaining Agreements with automatic wage rule application',
      relevance: 'High',
      reason: 'Multiple CBAs require sophisticated payroll handling',
      painPoints: ['Multiple CBAs'],
    });
  }
  
  // Add features based on gaps (notDoing)
  const notDoing = section3.notDoing || [];
  notDoing.forEach((gap: string) => {
    const lowerGap = gap.toLowerCase();
    
    if (lowerGap.includes('estimating')) {
      features.push({
        module: 'Sales & Estimation',
        feature: 'AI-Assisted Estimating',
        description: 'Digital estimating system with AI-powered policy writing and estimate generation',
        relevance: 'Medium',
        reason: 'Addresses lack of formal estimating process',
        painPoints: ['No formal estimating system'],
      });
    }
    
    if (lowerGap.includes('equipment')) {
      features.push({
        module: 'Equipment Management',
        feature: 'Equipment Tracking & Inspections',
        description: 'Track equipment location, maintenance schedules, and inspection records',
        relevance: 'Medium',
        reason: 'Provides equipment tracking capabilities',
        painPoints: ['No equipment tracking'],
      });
    }
    
    if (lowerGap.includes('business intelligence') || lowerGap.includes('analytics')) {
      features.push({
        module: 'AI-Powered Intelligence',
        feature: 'Appello Apex - Business Intelligence',
        description: 'Automated business intelligence with predictive analytics, proactive alerts, and multi-platform data integration',
        relevance: 'High',
        reason: 'AI-powered insights are a signature Appello differentiator',
        painPoints: ['No business intelligence'],
      });
    }
  });
  
  // Consolidate duplicate features
  const consolidatedFeatures = consolidateFeatures(features);
  
  // Sort by relevance (High first)
  const sortedFeatures = consolidatedFeatures.sort((a, b) => {
    const relevanceOrder = { High: 3, Medium: 2, Low: 1 };
    return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
  });
  
  // Get top 10 features
  const topFeatures = sortedFeatures.slice(0, 10);
  
  // Extract unique modules
  const recommendedModules = Array.from(new Set(topFeatures.map(f => f.module)));
  
  // Generate demo focus based on top features
  const demoFocus = topFeatures.slice(0, 5).map(f => `${f.module}: ${f.feature}`);
  
  // Identify key differentiators
  const keyDifferentiators: string[] = [];
  if (topFeatures.some(f => f.module === 'Workforce Admin' && f.feature.includes('Union'))) {
    keyDifferentiators.push('Union Payroll Mastery - Handles complex multi-CBA scenarios automatically');
  }
  if (topFeatures.some(f => f.module === 'AI-Powered Intelligence')) {
    keyDifferentiators.push('AI-Powered Intelligence - Automated insights and predictive analytics');
  }
  if (topFeatures.some(f => f.module === 'Material Management')) {
    keyDifferentiators.push('Material Management - Complete PO workflow from field to receiving');
  }
  if (topFeatures.some(f => f.module === 'Work Orders')) {
    keyDifferentiators.push('Service Work Management - Handles both projects and service work');
  }
  
  return {
    topFeatures,
    recommendedModules,
    demoFocus,
    keyDifferentiators,
  };
}

function consolidateFeatures(features: AppelloFeature[]): AppelloFeature[] {
  const featureMap = new Map<string, AppelloFeature>();
  
  features.forEach(feature => {
    const key = `${feature.module}:${feature.feature}`;
    if (featureMap.has(key)) {
      const existing = featureMap.get(key)!;
      // Merge pain points
      existing.painPoints = Array.from(new Set([...existing.painPoints, ...feature.painPoints]));
      // Keep highest relevance
      const relevanceOrder = { High: 3, Medium: 2, Low: 1 };
      if (relevanceOrder[feature.relevance] > relevanceOrder[existing.relevance]) {
        existing.relevance = feature.relevance;
        existing.reason = feature.reason;
      }
    } else {
      featureMap.set(key, { ...feature });
    }
  });
  
  return Array.from(featureMap.values());
}

