import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, MapPin, Briefcase, ArrowRight, CheckCircle2, Mail, Lock, User } from 'lucide-react';
import { updateUserProfile } from '../services/userService';
import { auth } from '../src/lib/firebase';

interface Props {
  company: CompanyProfile;
  onComplete: (profile: CompanyProfile) => void;
}

export const Onboarding: React.FC<Props> = ({ company, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyProfile>({
    ...company,
    role: company.role || '',
    imapUser: company.imapUser || company.email || '',
    imapPassword: ''
  });

  const [useLoginEmail, setUseLoginEmail] = useState(true);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const updatedProfile = {
            ...formData,
            onboardingComplete: true,
            // If using login email, ensure imapUser matches email
            imapUser: useLoginEmail ? formData.email : formData.imapUser
          };

          await updateUserProfile(auth.currentUser.uid, updatedProfile);
          onComplete(updatedProfile);
        }
      } catch (error) {
        console.error("Failed to save profile", error);
        alert("Failed to save profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[20%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Steps */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10"></div>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'text-blue-400' : 'text-slate-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step >= s
                ? 'bg-slate-900 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-slate-900 border-slate-700 text-slate-600'
                }`}>
                {step > s ? <CheckCircle2 size={20} /> : s}
              </div>
              <span className="text-xs font-medium uppercase tracking-wider bg-[#020617] px-2">
                {s === 1 ? 'Profile' : s === 2 ? 'Email Setup' : 'Connect'}
              </span>
            </div>
          ))}
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-2xl shadow-2xl animate-fadeIn">
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Tell us about you & your company</h2>
                <p className="text-slate-400">We'll customize the agent for your specific needs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Company Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Acme Inc"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Location</label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="New York, NY"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Your Role</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. HR Manager, Recruiter"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Scanning Configuration</h2>
                <p className="text-slate-400">Which email account should the agent scan for resumes?</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div
                  onClick={() => setUseLoginEmail(true)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${useLoginEmail
                    ? 'bg-blue-600/10 border-blue-500'
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${useLoginEmail ? 'border-blue-500' : 'border-slate-600'}`}>
                    {useLoginEmail && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Use Login Email</h4>
                    <p className="text-slate-400 text-sm">{formData.email}</p>
                  </div>
                </div>

                <div
                  onClick={() => setUseLoginEmail(false)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${!useLoginEmail
                    ? 'bg-blue-600/10 border-blue-500'
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${!useLoginEmail ? 'border-blue-500' : 'border-slate-600'}`}>
                    {!useLoginEmail && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Use Different Email</h4>
                    <p className="text-slate-400 text-sm">Scan a dedicated recruitment inbox</p>
                  </div>
                </div>
              </div>

              {!useLoginEmail && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Scanning Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="email"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="jobs@company.com"
                      value={formData.imapUser}
                      onChange={(e) => setFormData({ ...formData, imapUser: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Connect Email</h2>
                <p className="text-slate-400">
                  Enter an App Password for <strong>{useLoginEmail ? formData.email : formData.imapUser}</strong> to allow the agent to scan emails.
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 font-bold text-xs">i</span>
                  </div>
                  <div className="text-sm text-blue-200/80">
                    <p className="font-semibold text-blue-200 mb-1">How to get an App Password:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Go to Google Account Settings &gt; Security</li>
                      <li>Enable 2-Step Verification if not already on</li>
                      <li>Search for "App Passwords"</li>
                      <li>Create one named "RecruitAI" and paste it below</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">App Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={formData.imapPassword}
                    onChange={(e) => setFormData({ ...formData, imapPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isLoading || (step === 3 && !formData.imapPassword)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (step === 3 ? 'Complete Setup' : 'Continue')}
              {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
