
export enum AgentRole {
  ORCHESTRATOR = 'Orchestrator',
  PLANNER = 'Planner',
  REASONING = 'Reasoning',
  TOOL_EXECUTOR = 'Tool Executor',
  MEMORY = 'Memory',
  CRITIC = 'Critic'
}

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole;
  content: string;
  timestamp: number;
  type: 'goal' | 'thought' | 'action' | 'feedback' | 'observation';
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  problemDefinition: string;
  interviewContext: string;
}

export interface MemoryEntry {
  id: string;
  type: 'short-term' | 'long-term' | 'episodic';
  data: string;
  timestamp: number;
}

export interface Tool {
  name: string;
  description: string;
  status: 'active' | 'idle' | 'executing';
}
