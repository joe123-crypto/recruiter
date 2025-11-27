import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, MapPin, Mail, Briefcase } from 'lucide-react';

interface Props {
  onComplete: (profile: CompanyProfile) => void;
}

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [profile, setProfile] = useState<CompanyProfile>({
    name: '',
    location: '',
    email: '',
    industry: 'Technology'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name && profile.email) {
      onComplete(profile);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Building2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RecruitAI</h1>
          <p className="text-slate-400">Initialize your AI recruitment agent.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Acme Corp"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="San Francisco, CA"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">HR Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="hr@acmecorp.com"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Industry</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <select
                className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
              >
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4"
          >
            Launch Agent
          </button>
        </form>
      </div>
    </div>
  );
};
