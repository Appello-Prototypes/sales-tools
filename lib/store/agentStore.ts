/**
 * Agent Store - Manages multiple running Letter Studio Agents
 * 
 * Similar to how Cursor manages multiple AI agents working in parallel,
 * this store tracks all agent instances, their status, logs, and results.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityLogEntry } from '@/components/ai/AgentActivityLog';

// ============================================================================
// Types
// ============================================================================

export type AgentStatus = 
  | 'idle' 
  | 'preparing' 
  | 'researching' 
  | 'generating' 
  | 'complete' 
  | 'error' 
  | 'cancelled';

export interface AgentTarget {
  companyId?: string;
  companyName: string;
  companyIndustry?: string;
  companyDomain?: string;
  companyLocation?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  letterType: string;
  tone: string;
  customInstructions?: string;
}

export interface AgentResult {
  letter: string;
  subject?: string;
  researchSummary?: {
    companyInsights: string[];
    industryContext: string[];
    similarCustomers: string[];
    painPoints: string[];
    opportunities: string[];
    customerStatus?: 'existing_customer' | 'prospect' | 'unknown';
  };
  personalizationPoints?: string[];
  suggestedFollowUp?: string;
  confidence?: number;
  savedLetterId?: string;
}

export interface AgentInstance {
  id: string;
  name: string; // Display name (e.g., "Agent for Acme Corp")
  status: AgentStatus;
  target: AgentTarget;
  logs: ActivityLogEntry[];
  result?: AgentResult;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  stats?: {
    iterations: number;
    toolCalls: number;
  };
  isMinimized: boolean;
  abortController?: AbortController;
}

export interface AgentStore {
  // State
  agents: Map<string, AgentInstance>;
  activeCount: number;
  
  // Actions
  createAgent: (target: AgentTarget) => string;
  updateAgent: (id: string, updates: Partial<AgentInstance>) => void;
  addLog: (id: string, log: ActivityLogEntry) => void;
  setResult: (id: string, result: AgentResult) => void;
  setError: (id: string, error: string) => void;
  setStatus: (id: string, status: AgentStatus) => void;
  removeAgent: (id: string) => void;
  cancelAgent: (id: string) => void;
  clearCompleted: () => void;
  toggleMinimize: (id: string) => void;
  
  // Selectors
  getAgent: (id: string) => AgentInstance | undefined;
  getActiveAgents: () => AgentInstance[];
  getCompletedAgents: () => AgentInstance[];
  getAllAgents: () => AgentInstance[];
}

// ============================================================================
// Store
// ============================================================================

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: new Map(),
      activeCount: 0,
      
      createAgent: (target: AgentTarget) => {
        const id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const agent: AgentInstance = {
          id,
          name: `${target.companyName}`,
          status: 'preparing',
          target,
          logs: [],
          startedAt: new Date(),
          isMinimized: false,
        };
        
        set((state) => {
          const newAgents = new Map(state.agents);
          newAgents.set(id, agent);
          return { 
            agents: newAgents,
            activeCount: state.activeCount + 1 
          };
        });
        
        return id;
      },
      
      updateAgent: (id: string, updates: Partial<AgentInstance>) => {
        set((state) => {
          const agent = state.agents.get(id);
          if (!agent) return state;
          
          const newAgents = new Map(state.agents);
          newAgents.set(id, { ...agent, ...updates });
          return { agents: newAgents };
        });
      },
      
      addLog: (id: string, log: ActivityLogEntry) => {
        set((state) => {
          const agent = state.agents.get(id);
          if (!agent) return state;
          
          const newAgents = new Map(state.agents);
          newAgents.set(id, {
            ...agent,
            logs: [...agent.logs, log],
          });
          return { agents: newAgents };
        });
      },
      
      setResult: (id: string, result: AgentResult) => {
        set((state) => {
          const agent = state.agents.get(id);
          if (!agent) return state;
          
          const newAgents = new Map(state.agents);
          newAgents.set(id, {
            ...agent,
            result,
            status: 'complete',
            completedAt: new Date(),
          });
          
          return { 
            agents: newAgents,
            activeCount: Math.max(0, state.activeCount - 1)
          };
        });
      },
      
      setError: (id: string, error: string) => {
        set((state) => {
          const agent = state.agents.get(id);
          if (!agent) return state;
          
          const newAgents = new Map(state.agents);
          newAgents.set(id, {
            ...agent,
            error,
            status: 'error',
            completedAt: new Date(),
          });
          
          return { 
            agents: newAgents,
            activeCount: Math.max(0, state.activeCount - 1)
          };
        });
      },
      
      setStatus: (id: string, status: AgentStatus) => {
        set((state) => {
          const agent = state.agents.get(id);
          if (!agent) return state;
          
          const newAgents = new Map(state.agents);
          const updates: Partial<AgentInstance> = { status };
          
          if (status === 'complete' || status === 'error' || status === 'cancelled') {
            updates.completedAt = new Date();
          }
          
          newAgents.set(id, { ...agent, ...updates });
          
          // Update active count
          let activeCount = state.activeCount;
          if ((status === 'complete' || status === 'error' || status === 'cancelled') && 
              agent.status !== 'complete' && agent.status !== 'error' && agent.status !== 'cancelled') {
            activeCount = Math.max(0, activeCount - 1);
          }
          
          return { agents: newAgents, activeCount };
        });
      },
      
      removeAgent: (id: string) => {
        set((state) => {
          const agent = state.agents.get(id);
          const newAgents = new Map(state.agents);
          newAgents.delete(id);
          
          // Update active count if removing an active agent
          let activeCount = state.activeCount;
          if (agent && agent.status !== 'complete' && agent.status !== 'error' && agent.status !== 'cancelled') {
            activeCount = Math.max(0, activeCount - 1);
          }
          
          return { agents: newAgents, activeCount };
        });
      },
      
      cancelAgent: (id: string) => {
        const agent = get().agents.get(id);
        if (agent?.abortController) {
          agent.abortController.abort();
        }
        get().setStatus(id, 'cancelled');
      },
      
      clearCompleted: () => {
        set((state) => {
          const newAgents = new Map(state.agents);
          for (const [id, agent] of newAgents) {
            if (agent.status === 'complete' || agent.status === 'error' || agent.status === 'cancelled') {
              newAgents.delete(id);
            }
          }
          return { agents: newAgents };
        });
      },
      
      toggleMinimize: (id: string) => {
        set((state) => {
          const agent = state.agents.get(id);
          if (!agent) return state;
          
          const newAgents = new Map(state.agents);
          newAgents.set(id, { ...agent, isMinimized: !agent.isMinimized });
          return { agents: newAgents };
        });
      },
      
      // Selectors
      getAgent: (id: string) => get().agents.get(id),
      
      getActiveAgents: () => {
        const agents = Array.from(get().agents.values());
        return agents.filter(a => 
          a.status !== 'complete' && 
          a.status !== 'error' && 
          a.status !== 'cancelled'
        );
      },
      
      getCompletedAgents: () => {
        const agents = Array.from(get().agents.values());
        return agents.filter(a => 
          a.status === 'complete' || 
          a.status === 'error' || 
          a.status === 'cancelled'
        );
      },
      
      getAllAgents: () => Array.from(get().agents.values()),
    }),
    {
      name: 'letter-agents-storage',
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Convert agents array back to Map
          if (parsed?.state?.agents) {
            parsed.state.agents = new Map(parsed.state.agents);
          }
          return parsed;
        },
        setItem: (name, value: any) => {
          // Convert Map to array for serialization
          const toStore = {
            ...value,
            state: {
              ...value.state,
              agents: Array.from(value.state.agents.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      // Only persist completed agents, not running ones
      partialize: (state) => ({
        agents: new Map(
          Array.from(state.agents.entries()).filter(
            ([, agent]) => agent.status === 'complete'
          )
        ),
        activeCount: 0, // Reset on load
      }),
    }
  )
);

// ============================================================================
// Agent Runner Hook
// ============================================================================

export function useAgentRunner() {
  const store = useAgentStore();
  
  const runAgent = async (target: AgentTarget): Promise<string> => {
    const agentId = store.createAgent(target);
    const abortController = new AbortController();
    
    // Store the abort controller
    store.updateAgent(agentId, { abortController });
    
    try {
      store.addLog(agentId, {
        step: 'init',
        message: '🚀 Initializing Letter Intelligence Agent...',
        status: 'loading',
        timestamp: new Date(),
      });
      
      const response = await fetch('/api/admin/letter-studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          ...target,
          saveDraft: true,
        }),
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start generation: ${response.status}`);
      }
      
      store.setStatus(agentId, 'researching');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        let currentEvent = '';
        let currentData = '';
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.substring(7);
          } else if (line.startsWith('data: ')) {
            currentData = line.substring(6);
            
            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);
                
                if (currentEvent === 'progress') {
                  // Update status based on step
                  if (data.step?.includes('research') || data.step?.includes('tool')) {
                    store.setStatus(agentId, 'researching');
                  } else if (data.step?.includes('generat') || data.step?.includes('writ')) {
                    store.setStatus(agentId, 'generating');
                  }
                  
                  store.addLog(agentId, {
                    step: data.step || 'progress',
                    message: data.message || '',
                    status: data.status || 'info',
                    data: data.data,
                    timestamp: new Date(),
                  });
                } else if (currentEvent === 'complete') {
                  store.setResult(agentId, {
                    letter: data.letter,
                    subject: data.subject,
                    researchSummary: data.researchSummary,
                    personalizationPoints: data.personalizationPoints,
                    suggestedFollowUp: data.suggestedFollowUp,
                    confidence: data.confidence,
                    savedLetterId: data.savedLetterId,
                  });
                  
                  store.updateAgent(agentId, { 
                    stats: data.stats,
                  });
                } else if (currentEvent === 'error') {
                  store.setError(agentId, data.message || 'Unknown error');
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
              
              currentEvent = '';
              currentData = '';
            }
          }
        }
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        store.setStatus(agentId, 'cancelled');
        store.addLog(agentId, {
          step: 'cancelled',
          message: '⛔ Agent cancelled by user',
          status: 'warning',
          timestamp: new Date(),
        });
      } else {
        store.setError(agentId, err.message || 'Failed to run agent');
      }
    }
    
    return agentId;
  };
  
  const runBatchAgents = async (targets: AgentTarget[]): Promise<string[]> => {
    // Launch all agents in parallel
    const agentPromises = targets.map(target => runAgent(target));
    return Promise.all(agentPromises);
  };
  
  return {
    runAgent,
    runBatchAgents,
    ...store,
  };
}


