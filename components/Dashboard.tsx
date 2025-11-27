import React, { useState } from 'react';
import { CompanyProfile, CandidateAnalysis, DashboardTab } from '../types';
import { Sparkles, LayoutDashboard, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Scanner } from './Scanner';
import { Settings } from './Settings';

interface Props {
  company: CompanyProfile;
  onStartPresentation: (candidates: CandidateAnalysis[]) => void;
  onLogout: () => void;
  onUpdateCompany: (profile: CompanyProfile) => void;
}

export const Dashboard: React.FC<Props> = ({ company, onStartPresentation, onLogout, onUpdateCompany }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.SCANNER);

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar Panel */}
      <div className="w-20 md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
               <Sparkles className="text-white w-5 h-5" />
           </div>
           <div className="hidden md:block">
               <h2 className="text-lg font-bold text-white leading-none">RecruitAI</h2>
               <p className="text-xs text-slate-500 mt-1 truncate max-w-[120px]">{company.name}</p>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
           <button 
             onClick={() => setActiveTab(DashboardTab.SCANNER)}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
               activeTab === DashboardTab.SCANNER 
               ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
               : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
             }`}
           >
              <LayoutDashboard size={20} />
              <span className="hidden md:block font-medium">Agent Console</span>
           </button>

           <button 
             onClick={() => setActiveTab(DashboardTab.SETTINGS)}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
               activeTab === DashboardTab.SETTINGS 
               ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
               : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
             }`}
           >
              <SettingsIcon size={20} />
              <span className="hidden md:block font-medium">Settings</span>
           </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
            <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
            >
                <LogOut size={20} />
                <span className="hidden md:block font-medium">Sign Out</span>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
        {activeTab === DashboardTab.SCANNER ? (
            <Scanner company={company} onStartPresentation={onStartPresentation} />
        ) : (
            <Settings company={company} onUpdate={onUpdateCompany} />
        )}
      </div>
    </div>
  );
};