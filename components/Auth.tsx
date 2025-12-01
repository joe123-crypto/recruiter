import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, MapPin, Mail, Briefcase, ArrowRight, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { saveProfile, getProfile } from '../services/storageService';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface Props {
  onLogin: (profile: CompanyProfile) => void;
}

interface GoogleJWT {
  name?: string;
  email?: string;
  picture?: string;
}

export const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CompanyProfile & { password?: string }>({
    name: '',
    location: '',
    email: '',
    industry: 'Technology',
    password: ''
  });

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) return;

      const decoded = jwtDecode<GoogleJWT>(credentialResponse.credential);
      const googleEmail = decoded.email || '';
      const googleName = decoded.name || '';

      if (isRegistering) {
        setFormData({
          ...formData,
          name: googleName,
          email: googleEmail
        });
      } else {
        const stored = getProfile();
        if (stored && stored.email === googleEmail) {
          onLogin(stored);
        } else {
          setError('No account found with this Google email. Please sign up first.');
        }
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError('Failed to process Google Sign-In');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (formData.name && formData.email) {
        const profile: CompanyProfile = {
          name: formData.name,
          location: formData.location,
          email: formData.email,
          industry: formData.industry
        };
        saveProfile(profile);
        onLogin(profile);
      }
    } else {
      const stored = getProfile();
      if (stored && stored.email === formData.email) {
        onLogin(stored);
      } else {
        setError('Invalid credentials or no account found.');
      }
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
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In failed')}
                useOneTap
                theme="filled_black"
                size="large"
                width="100%"
                locale="en"
                shape="pill"
              />
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

              {isRegistering && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Company</label>
                    <div className="relative group">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        required={isRegistering}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Acme Inc"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Location</label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        required={isRegistering}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="New York"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </div>
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
                  />
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Industry</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <select
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    >
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                {isRegistering ? 'Create Account' : 'Sign In'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

              <div className="pt-6 border-t border-slate-800/50">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all app data? This will reset your account.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                >
                  Reset Application Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};