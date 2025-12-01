export interface CompanyProfile {
  name: string;
  location: string;
  email: string;
  industry: string;
  imapUser?: string;
  imapHost?: string;
  imapPassword?: string;
}

export interface JobCriteria {
  jobTitle: string;
  experienceLevel: string;
  keySkills: string;
  deadline: string;
}

export interface EmailData {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
}

export interface CandidateAnalysis {
  id: string;
  name: string;
  email: string;
  role: string;
  score: number; // 0-100
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendationReason: string;
  status: 'pending' | 'rejected' | 'interview';
  originalEmailId: string;
}

export enum AppState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PRESENTATION = 'PRESENTATION'
}

export enum AgentStatus {
  IDLE = 'IDLE',
  GENERATING_EMAILS = 'GENERATING_EMAILS',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE'
}

export enum DashboardTab {
  SCANNER = 'SCANNER',
  SETTINGS = 'SETTINGS'
}