import React, { useState, useEffect } from 'react';
import { AppState, CompanyProfile, CandidateAnalysis } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { PresentationMode } from './components/PresentationMode';
import { Onboarding } from './components/Onboarding';
import { getProfile, clearProfile } from './services/storageService';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  const [company, setCompany] = useState<CompanyProfile | null>(getProfile());
  const [appState, setAppState] = useState<AppState>(() => {
    const profile = getProfile();
    if (!profile) return AppState.AUTH;
    return profile.imapPassword ? AppState.DASHBOARD : AppState.ONBOARDING;
  });
  const [presentationCandidates, setPresentationCandidates] = useState<CandidateAnalysis[]>([]);

  const handleLogin = (profile: CompanyProfile) => {
    setCompany(profile);
    if (profile.imapPassword) {
      setAppState(AppState.DASHBOARD);
    } else {
      setAppState(AppState.ONBOARDING);
    }
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
    // If they updated and added password, go to dashboard
    if (updated.imapPassword) {
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleOnboardingComplete = (updatedProfile: CompanyProfile) => {
    setCompany(updatedProfile);
    setAppState(AppState.DASHBOARD);
  };

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen font-sans">
        {appState === AppState.AUTH && (
          <Auth onLogin={handleLogin} />
        )}

        {appState === AppState.ONBOARDING && company && (
          <Onboarding
            company={company}
            onComplete={handleOnboardingComplete}
          />
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
    </GoogleOAuthProvider>
  );
}