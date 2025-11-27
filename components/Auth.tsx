import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, MapPin, Mail, Briefcase, ArrowRight, Lock } from 'lucide-react';
import { saveProfile, getProfile } from '../services/storageService';

interface Props {
  onLogin: (profile: CompanyProfile) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      // Registration Logic
      if (formData.name && formData.email) {
        const profile: CompanyProfile = {
          name: formData.name,
          location: formData.location,
          email: formData.email,
          industry: formData.industry
        };
        // In a real app, we'd hash password and save to DB. 
        // Here we just save profile to local storage.
        saveProfile(profile);
        onLogin(profile);
      }
    } else {
      // Login Logic
      const stored = getProfile();
      if (stored && stored.email === formData.email) {
        onLogin(stored);
      } else {
        setError('Invalid credentials or no account found.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
       </div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-700 z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 transform rotate-3">
            <Building2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RecruitAI</h1>
          <p className="text-slate-400">
            {isRegistering ? 'Create your recruitment agent.' : 'Welcome back, hiring manager.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required={isRegistering}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Acme Corp"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Headquarters</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required={isRegistering}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="hr@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

           {/* Dummy Password Field for aesthetics of Auth */}
           <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Target Industry</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <select
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
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
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4"
            >
                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
        </div>
      </div>
    </div>
  );
};