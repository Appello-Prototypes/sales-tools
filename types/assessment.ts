export interface AssessmentData {
  submissionId: string;
  name?: string;
  email?: string;
  companyName?: string;
  website?: string;
  
  section1?: {
    trade?: string;
    fieldWorkers?: string;
    role?: string;
  };
  
  section2?: {
    painPoints?: string[];
    magicWand?: string;
    urgency?: number;
    hoursPerWeek?: string;
  };
  
  section3?: {
    timesheetMethod?: string;
    unionized?: string;
    cbaCount?: string;
    unions?: string[];
    accountingSoftware?: string;
    payrollSoftware?: string;
    constructionSoftware?: string;
    notDoing?: string[];
  };
  
  section4?: {
    demoFocus?: string[];
    evaluators?: string[];
    techComfort?: string;
    smartphones?: string;
  };
  
  section5?: {
    timeline?: string;
    evaluating?: string[];
    nextSteps?: string[];
    likelihood?: number;
    specificQuestions?: string;
  };
}

export interface AssessmentResponse {
  submissionId: string;
  currentStep: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  data?: AssessmentData;
}

