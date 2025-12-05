import React, { useState } from 'react';
import { CompanyProfile, CandidateAnalysis, DashboardTab } from '../types';
import { Sparkles, LayoutDashboard, Settings as SettingsIcon, LogOut, Search, Bell, Menu, X, History } from 'lucide-react';
import { Scanner } from './Scanner';
import { Settings } from './Settings';
import { RecentScans } from './RecentScans';

interface Props {
  company: CompanyProfile;
  userId?: string;
  onStartPresentation: (candidates: CandidateAnalysis[]) => void;
  onLogout: () => void;
  onUpdateCompany: (profile: CompanyProfile) => void;
}

export const Dashboard: React.FC<Props> = ({ company, userId, onStartPresentation, onLogout, onUpdateCompany }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.SCANNER);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loadedScan, setLoadedScan] = useState<any>(null);

  const handleLoadScan = (scan: any) => {
    setLoadedScan(scan);
    setActiveTab(DashboardTab.SCANNER);
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: DashboardTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
        if (tab !== DashboardTab.SCANNER) setLoadedScan(null); // Reset loaded scan when leaving scanner
      }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === tab
        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-900/20'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
    >
      <Icon size={20} className={`transition-transform duration-200 ${activeTab === tab ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="font-medium">{label}</span>
      {activeTab === tab && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`
        fixed md:relative z-50 w-72 h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col transition-transform duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none tracking-tight">RecruitAI</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Agent Console</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden ml-auto text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Current Workspace</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                {company.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{company.name}</p>
                <p className="text-xs text-slate-500 truncate">{company.industry}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <NavItem tab={DashboardTab.SCANNER} icon={LayoutDashboard} label="Dashboard" />
            <NavItem tab={DashboardTab.HISTORY} icon={History} label="Recent Scans" />
            <NavItem tab={DashboardTab.SETTINGS} icon={SettingsIcon} label="Settings" />
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[20%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-20%] right-[20%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[100px]"></div>
        </div>

        {/* Top Header (Mobile Only) */}
        <div className="md:hidden h-16 border-b border-slate-800/50 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md z-30">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400">
            <Menu size={24} />
          </button>
          <span className="font-bold text-white">RecruitAI</span>
          <div className="w-6"></div> {/* Spacer */}
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {activeTab === DashboardTab.SCANNER ? (
              <Scanner
                company={company}
                userId={userId}
                onStartPresentation={onStartPresentation}
                initialState={loadedScan}
              />
            ) : activeTab === DashboardTab.HISTORY ? (
              <RecentScans onLoadScan={handleLoadScan} />
            ) : (
              <Settings company={company} onUpdate={onUpdateCompany} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};