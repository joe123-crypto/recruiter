export enum AgentStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum DashboardTab {
  SCANNER = 'SCANNER',
  SETTINGS = 'SETTINGS',
  HISTORY = 'HISTORY'
}

export enum AppState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PRESENTATION = 'PRESENTATION'
}

export interface CandidateAnalysis {
  name: string;
  email: string;
  matchScore: number;
  summary: string;
  status: 'Shortlisted' | 'Rejected' | 'Pending';
  skills: string[];
  experience: number;
  education: string;
  uid?: number; // Added for resume capability
}

export interface CompanyProfile {
  name: string;
  location: string;
  email: string;
  industry: string;
  role?: string;
  imapUser?: string;
  imapHost?: string;
  imapPassword?: string;
  onboardingComplete?: boolean;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  jobCriteria: string;
  candidates: CandidateAnalysis[];
  lastScannedUid?: number;
}