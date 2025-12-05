export enum AgentStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  GENERATING_EMAILS = 'GENERATING_EMAILS',
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
  id: string;
  name: string;
  email: string;
  role: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendationReason: string;
  status: string;
  originalEmailId?: string;
  uid?: number;
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

export interface JobCriteria {
  jobTitle: string;
  experienceLevel: string;
  keySkills: string;
  deadline?: string;
}

export interface EmailData {
  subject: string;
  from: string;
  body: string;
  uid: number;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  jobCriteria: JobCriteria;
  candidates: CandidateAnalysis[];
  lastScannedUid?: number;
}