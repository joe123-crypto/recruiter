import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, MapPin, Mail, Briefcase, ArrowRight, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { auth } from '../src/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getUserProfile, createUserProfile } from '../services/userService';

interface Props {
  onLogin: (profile: CompanyProfile) => void;
}

export const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists in Firestore
      let profile = await getUserProfile(user.uid);

      if (!profile) {
        // Create new profile
        profile = await createUserProfile(user.uid, user.email || '', user.displayName || '');
      }

      onLogin(profile);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!formData.email || !formData.password) {
          throw new Error('Please fill in all fields');
        }

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

        // Create profile in Firestore
        const profile = await createUserProfile(userCredential.user.uid, formData.email);

        onLogin(profile);

      } else {
        // Sign in
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

        // Fetch profile
        const profile = await getUserProfile(userCredential.user.uid);

        if (profile) {
          onLogin(profile);
        } else {
          // Fallback: Create if missing
          const newProfile = await createUserProfile(userCredential.user.uid, formData.email);
          onLogin(newProfile);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please sign in.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#020617] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-glow delay-1000"></div>
      </div>

      {/* Left Side - Hero/Info */}
      <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-between p-12 border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">RecruitAI</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Hire smarter with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              AI-powered agents
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md leading-relaxed">
            Automate your recruitment workflow. Let our intelligent agents scan, filter, and organize candidates while you focus on interviewing the best talent.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
              <CheckCircle2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Smart Filtering</h3>
              <p className="text-sm text-slate-500">Automatically rank candidates by relevance</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
              <CheckCircle2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Automated Outreach</h3>
              <p className="text-sm text-slate-500">Schedule interviews without lifting a finger</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          © 2024 RecruitAI Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md">
          <div className="glass-panel p-8 rounded-2xl shadow-2xl animate-fadeIn">
            <div className="text-center mb-8 lg:hidden">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white">RecruitAI</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isRegistering
                  ? 'Get started with your AI recruitment assistant today.'
                  : 'Sign in to access your candidate dashboard.'}
              </p>
            </div>

            <div className="mb-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-slate-900 font-semibold py-3 rounded-xl shadow hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                  <path fill="#EA4335" d="M12 4.66c1.61 0 3.02.56 4.13 1.62L19.16 3.29C17.17 1.45 14.75 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-4 bg-[#131b2e] text-slate-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-fadeIn">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-8 text-center space-y-6">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isRegistering ? (
                  <>Already have an account? <span className="text-blue-400 font-medium">Sign In</span></>
                ) : (
                  <>Don't have an account? <span className="text-blue-400 font-medium">Sign Up</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};