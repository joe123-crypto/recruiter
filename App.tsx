import React, { useState, useEffect } from 'react';
import { AppState, CompanyProfile, CandidateAnalysis } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { PresentationMode } from './components/PresentationMode';
import { Onboarding } from './components/Onboarding';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { auth } from './src/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserProfile } from './services/userService';

export default function App() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [presentationCandidates, setPresentationCandidates] = useState<CandidateAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, fetch profile from Firestore
        const profile = await getUserProfile(user.uid);

        if (profile) {
          setCompany(profile);
          if (profile.onboardingComplete) {
            setAppState(AppState.DASHBOARD);
          } else {
            setAppState(AppState.ONBOARDING);
          }
        } else {
          // Profile doesn't exist yet (new user)
          setCompany({
            name: '',
            location: '',
            email: user.email || '',
            industry: 'Technology',
            onboardingComplete: false
          });
          setAppState(AppState.ONBOARDING);
        }
      } else {
        // User is signed out
        setAppState(AppState.AUTH);
        setCompany(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (profile: CompanyProfile) => {
    setCompany(profile);
    if (profile.onboardingComplete) {
      setAppState(AppState.DASHBOARD);
    } else {
      setAppState(AppState.ONBOARDING);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCompany(null);
      setAppState(AppState.AUTH);
    } catch (error) {
      console.error("Error signing out", error);
    }
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
    if (updated.onboardingComplete) {
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleOnboardingComplete = (updatedProfile: CompanyProfile) => {
    setCompany(updatedProfile);
    setAppState(AppState.DASHBOARD);
  };

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  if (isLoading) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>;
  }

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