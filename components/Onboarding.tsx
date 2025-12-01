import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '../types';
import { Mail, Key, ExternalLink, CheckCircle, Clipboard, ArrowRight, ShieldCheck, AlertCircle, Edit2, Sparkles } from 'lucide-react';
import { saveProfile } from '../services/storageService';

interface Props {
  company: CompanyProfile;
  onComplete: (profile: CompanyProfile) => void;
}

export const Onboarding: React.FC<Props> = ({ company, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [scanningEmail, setScanningEmail] = useState(company.email);
  const [password, setPassword] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [detected, setDetected] = useState(false);
  const [error, setError] = useState('');

  // Smart Clipboard Listener
  useEffect(() => {
    const checkClipboard = async () => {
      if (!isListening) return;

      try {
        const text = await navigator.clipboard.readText();
        const cleanText = text.replace(/\s/g, '');

        if (cleanText.length === 16 && /^[a-z]+$/.test(cleanText)) {
          setPassword(cleanText);
          setDetected(true);
          setIsListening(false);
          setError('');
        }
      } catch (err) {
        console.log("Clipboard access denied or empty");
      }
    };

    window.addEventListener('focus', checkClipboard);
    const interval = isListening ? setInterval(checkClipboard, 1000) : undefined;

    return () => {
      window.removeEventListener('focus', checkClipboard);
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  const handleOpenGoogle = () => {
    window.open('https://myaccount.google.com/apppasswords', '_blank');
    setIsListening(true);
    setError('');
  };

  const handleManualPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.replace(/\s/g, '');

      if (cleanText.length !== 16) {
        setError('Clipboard content does not look like an App Password (must be 16 letters).');
        return;
      }

      setPassword(cleanText);
      setDetected(true);
      setError('');
    } catch (err) {
      console.error("Failed to read clipboard");
      setError('Could not access clipboard. Please paste manually.');
    }
  };

  const handleSubmit = () => {
    if (!password) return;

    const updatedProfile = {
      ...company,
      imapUser: scanningEmail,
      imapPassword: password,
      imapHost: 'imap.gmail.com'
    };

    saveProfile(updatedProfile);
    onComplete(updatedProfile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-glow delay-1000"></div>
      </div>

      <div className="glass-panel w-full max-w-3xl p-8 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col md:flex-row overflow-hidden relative z-10 animate-fadeIn">

        {/* Left Side: Context */}
        <div className="md:w-1/2 pr-8 border-r border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
              <Mail className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Connect Your Email</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              To scan for job applications, the agent needs read-access to your inbox.
              For security, Google requires a dedicated <strong>App Password</strong> instead of your real password.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-blue-400 w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-300">100% Secure</h4>
                  <p className="text-xs text-blue-400/80 mt-1">
                    This password only works for this app. You can revoke it anytime in your Google Account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
              Step {step} of 2: <span className="text-slate-300">{step === 1 ? 'Confirm Email' : 'Secure Connection'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Action */}
        <div className="md:w-1/2 pl-8 flex flex-col justify-center space-y-6">

          {step === 1 ? (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                Which email should we scan?
              </label>

              <div className="relative mb-4 group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  value={scanningEmail}
                  onChange={(e) => setScanningEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <p className="text-xs text-slate-500 mb-6 ml-1">
                This should be the Gmail account where you receive job applications.
              </p>

              <button
                onClick={() => setStep(2)}
                disabled={!scanningEmail.includes('@')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="animate-fadeIn">
              {/* Step 2a: Generate */}
              <div className={`transition-all duration-300 ${detected ? 'opacity-50 blur-[1px] pointer-events-none' : 'opacity-100'}`}>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Generate Password</label>
                  <button onClick={() => setStep(1)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                    <Edit2 size={10} /> {scanningEmail}
                  </button>
                </div>

                <button
                  onClick={handleOpenGoogle}
                  className="w-full group relative flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-medium group-hover:text-blue-400 transition-colors">Create App Password</span>
                      <span className="block text-xs text-slate-400">Opens Google Security</span>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </button>
                {isListening && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-400 animate-pulse ml-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_5px_rgba(96,165,250,0.8)]"></div>
                    Waiting for you to copy the password...
                  </div>
                )}
              </div>

              {/* Step 2b: Paste/Detect */}
              <div className="mt-8">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ml-1">Paste & Connect</label>

                <div className="relative group">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Paste 16-character password"
                    className={`w-full bg-slate-900/50 border-2 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition-all font-mono tracking-widest ${detected
                      ? 'border-green-500/50 focus:border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                      : error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                      }`}
                  />
                  <Key className={`absolute left-3 top-3.5 w-5 h-5 transition-colors ${detected ? 'text-green-400' : 'text-slate-500'}`} />

                  {detected && (
                    <div className="absolute right-3 top-3.5 text-green-400 animate-scaleIn">
                      <CheckCircle size={20} />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5 ml-1 animate-fadeIn">
                    <AlertCircle size={12} /> {error}
                  </div>
                )}

                {!detected && (
                  <button
                    onClick={handleManualPaste}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 ml-1 transition-colors"
                  >
                    <Clipboard size={12} /> Paste from clipboard
                  </button>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!password || password.length < 16}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Connect Agent <ArrowRight size={18} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
