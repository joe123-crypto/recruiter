import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { saveProfile } from '../services/storageService';
import { Building2, MapPin, Mail, Briefcase, Save, Check } from 'lucide-react';

interface Props {
  company: CompanyProfile;
  onUpdate: (profile: CompanyProfile) => void;
}

export const Settings: React.FC<Props> = ({ company, onUpdate }) => {
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(formData);
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/50 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-white mb-6">Agent Configuration</h2>
        <p className="text-slate-400 mb-8">Update your company details and the parameters the AI Agent uses when scanning for candidates.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-slate-700">
             <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-700 pb-2">Company Profile</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Headquarters</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-slate-700">
             <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-700 pb-2">Scanning Parameters</h3>
             
             <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Source Email Channel</label>
                  <p className="text-xs text-slate-500 mb-2">The email address the agent will monitor for incoming applications.</p>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Target Industry / Channel</label>
                  <p className="text-xs text-slate-500 mb-2">This helps the AI understand the context of the applications.</p>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <select
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    >
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                </div>
             </div>
          </div>

          <div className="flex justify-end">
             <button
                type="submit"
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  saved 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                }`}
             >
                {saved ? <Check size={20} /> : <Save size={20} />}
                {saved ? 'Changes Saved' : 'Save Configuration'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};