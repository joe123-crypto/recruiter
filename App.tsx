import React, { useState, useEffect } from 'react';
import { AppState, CompanyProfile, CandidateAnalysis } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { PresentationMode } from './components/PresentationMode';
import { getProfile, clearProfile } from './services/storageService';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [presentationCandidates, setPresentationCandidates] = useState<CandidateAnalysis[]>([]);

  // Check for existing session on mount
  useEffect(() => {
    const storedProfile = getProfile();
    if (storedProfile) {
      setCompany(storedProfile);
      setAppState(AppState.DASHBOARD);
    }
  }, []);

  const handleLogin = (profile: CompanyProfile) => {
    setCompany(profile);
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    clearProfile();
    setCompany(null);
    setAppState(AppState.AUTH);
  };

  const handleStartPresentation = (candidates: CandidateAnalysis[]) => {
    setPresentationCandidates(candidates);
    setAppState(AppState.PRESENTATION);
  };

  const handleClosePresentation = () => {
    setAppState(AppState.DASHBOARD);
  };

  const handleUpdateCompany = (updated: CompanyProfile) => {
    setCompany(updated);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      {appState === AppState.AUTH && (
        <Auth onLogin={handleLogin} />
      )}

      {appState === AppState.DASHBOARD && company && (
        <Dashboard 
          company={company} 
          onStartPresentation={handleStartPresentation}
          onLogout={handleLogout}
          onUpdateCompany={handleUpdateCompany}
        />
      )}

      {appState === AppState.PRESENTATION && company && (
        <PresentationMode 
          candidates={presentationCandidates}
          company={company}
          onClose={handleClosePresentation}
        />
      )}
    </div>
  );
}