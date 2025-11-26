import { create } from 'zustand';
import { AssessmentData } from '@/types/assessment';

interface AssessmentState {
  submissionId: string | null;
  currentStep: number;
  data: AssessmentData;
  setSubmissionId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  updateData: (section: keyof AssessmentData, data: any) => void;
  reset: () => void;
}

const initialState: Omit<AssessmentState, 'setSubmissionId' | 'setCurrentStep' | 'updateData' | 'reset'> = {
  submissionId: null,
  currentStep: 1,
  data: {} as AssessmentData,
};

export const useAssessmentStore = create<AssessmentState>((set) => ({
  ...initialState,
  
  setSubmissionId: (id: string) => set({ submissionId: id }),
  
  setCurrentStep: (step: number) => set({ currentStep: step }),
  
  updateData: (section: keyof AssessmentData | 'name' | 'email' | 'companyName' | 'website', newData: any) =>
    set((state) => {
      // Handle top-level fields like name, email, companyName, website
      if (section === 'name' || section === 'email' || section === 'companyName' || section === 'website') {
        return {
          data: {
            ...state.data,
            [section]: newData,
          },
        };
      }
      
      // Handle section data
      const currentSection = state.data[section as keyof AssessmentData] || {};
      return {
        data: {
          ...state.data,
          [section]: {
            ...(currentSection as object),
            ...newData,
          },
        },
      };
    }),
  
  reset: () => set(initialState),
}));

