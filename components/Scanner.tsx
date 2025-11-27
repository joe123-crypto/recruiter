import React, { useState, useRef } from 'react';
import { CompanyProfile, AgentStatus, CandidateAnalysis, EmailData, JobCriteria } from '../types';
import { generateMockEmails, analyzeCandidateEmail, extractJobCriteriaFromDoc } from '../services/geminiService';
import { CandidateCard } from './CandidateCard';
import { Play, Square, RefreshCw, BarChart3, Mail, Loader2, FileText, CheckCircle, X, Search, Calendar, Briefcase, GraduationCap, UploadCloud, Trash2, Lock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface Props {
  company: CompanyProfile;
  onStartPresentation: (candidates: CandidateAnalysis[]) => void;
}

export const Scanner: React.FC<Props> = ({ company, onStartPresentation }) => {
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAnalysis | null>(null);
  
  // Setup Modal State
  const [showSetup, setShowSetup] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [jobCriteria, setJobCriteria] = useState<JobCriteria>({
    jobTitle: '',
    experienceLevel: 'Mid-Level (3-5 years)',
    keySkills: '',
    deadline: ''
  });

  const handleOpenSetup = () => {
    // If we have completed a run, reset data before new run
    if (status === AgentStatus.COMPLETE) {
        setCandidates([]);
        setEmails([]);
        setSelectedCandidate(null);
    }
    setShowSetup(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);

    try {
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = base64String.split(',')[1];
            
            const extracted = await extractJobCriteriaFromDoc(base64Data, file.type);
            
            if (extracted) {
                setJobCriteria(prev => ({
                    ...prev,
                    jobTitle: extracted.jobTitle || prev.jobTitle,
                    keySkills: extracted.keySkills || prev.keySkills,
                    deadline: extracted.deadline || prev.deadline,
                    // Basic mapping fallback if AI returns weird string
                    experienceLevel: extracted.experienceLevel || prev.experienceLevel
                }));
                setUploadedFile(file);
            }
            setIsParsingDoc(false);
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error("Error reading file", err);
        setIsParsingDoc(false);
    }
  };

  const handleRemoveFile = () => {
      setUploadedFile(null);
      setJobCriteria({
        jobTitle: '',
        experienceLevel: 'Mid-Level (3-5 years)',
        keySkills: '',
        deadline: ''
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeScan = async () => {
    setShowSetup(false);
    setStatus(AgentStatus.GENERATING_EMAILS);
    setCandidates([]);
    setSelectedCandidate(null);
    
    // 1. Generate Mocks based on criteria
    try {
      const mockEmails = await generateMockEmails(5, company.industry, jobCriteria);
      setEmails(mockEmails);
      
      setStatus(AgentStatus.ANALYZING);
      
      // 2. Analyze each based on criteria
      const results: CandidateAnalysis[] = [];
      for (const email of mockEmails) {
        if (status === AgentStatus.IDLE) break; // Allow stopping
        
        const result = await analyzeCandidateEmail(email, jobCriteria);
        
        if (result) {
          results.push(result);
          setCandidates(prev => [...prev, result]);
        }
        
        // Artificial delay for "effect"
        await new Promise(r => setTimeout(r, 1500));
      }
      
      setStatus(AgentStatus.COMPLETE);
    } catch (error) {
      console.error(error);
      setStatus(AgentStatus.IDLE);
    }
  };

  const handleStopAgent = () => {
    setStatus(AgentStatus.IDLE);
  };

  const isWorking = status !== AgentStatus.IDLE && status !== AgentStatus.COMPLETE;

  // Chart Data
  const chartData = candidates.map(c => ({
    name: c.name.split(' ')[0], // First name only for chart
    score: c.score
  }));

  return (
    <div className="flex flex-col h-full bg-slate-900/50 relative">
        {/* Job Setup Modal */}
        {showSetup && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-xl font-bold text-white">New Recruitment Scan</h3>
                            <p className="text-slate-400 text-sm">Configure agent parameters</p>
                        </div>
                        <button onClick={() => setShowSetup(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        
                        {/* File Upload Section */}
                        {!uploadedFile ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-800/50 rounded-xl p-6 text-center cursor-pointer transition-all group"
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="application/pdf,image/*"
                                    onChange={handleFileUpload}
                                />
                                {isParsingDoc ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                        <p className="text-blue-400 font-medium">Extracting details from document...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600/20 transition-colors">
                                            <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                                        </div>
                                        <p className="text-slate-300 font-medium">Upload Job Description (PDF/Image)</p>
                                        <p className="text-slate-500 text-xs mt-1">Auto-fill criteria from file</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <FileText className="text-white w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm truncate max-w-[200px]">{uploadedFile.name}</p>
                                        <p className="text-blue-400 text-xs">Criteria Extracted</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleRemoveFile}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                    title="Remove file"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-900 text-slate-500">
                                    {uploadedFile ? 'Manual entry deactivated' : 'Or enter details manually'}
                                </span>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className={`space-y-4 transition-all duration-300 ${uploadedFile ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            {uploadedFile && (
                                <div className="absolute z-10 w-full flex justify-center mt-12">
                                     <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2 text-slate-300 shadow-xl">
                                         <Lock size={14} />
                                         <span className="text-xs font-medium">Using document data</span>
                                     </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Target Position</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                    <input 
                                        type="text" 
                                        disabled={!!uploadedFile}
                                        placeholder="e.g. Senior Frontend Engineer"
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:cursor-not-allowed"
                                        value={jobCriteria.jobTitle}
                                        onChange={(e) => setJobCriteria({...jobCriteria, jobTitle: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Experience Level</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <select 
                                            disabled={!!uploadedFile}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:cursor-not-allowed"
                                            value={jobCriteria.experienceLevel}
                                            onChange={(e) => setJobCriteria({...jobCriteria, experienceLevel: e.target.value})}
                                        >
                                            <option>Entry Level (0-2 yrs)</option>
                                            <option>Mid-Level (3-5 yrs)</option>
                                            <option>Senior (5-8 yrs)</option>
                                            <option>Lead / Principal (8+ yrs)</option>
                                            <option>Executive</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Deadline</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input 
                                            type="date" 
                                            disabled={!!uploadedFile}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:cursor-not-allowed"
                                            value={jobCriteria.deadline}
                                            onChange={(e) => setJobCriteria({...jobCriteria, deadline: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Must-Have Skills / Keywords</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                    <textarea 
                                        disabled={!!uploadedFile}
                                        placeholder="e.g. React, TypeScript, Node.js, AWS, UI/UX Design..."
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 disabled:cursor-not-allowed"
                                        value={jobCriteria.keySkills}
                                        onChange={(e) => setJobCriteria({...jobCriteria, keySkills: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                         <button 
                            onClick={() => setShowSetup(false)}
                            className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={executeScan}
                            disabled={!jobCriteria.jobTitle || isParsingDoc}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                         >
                            Initialize Agent
                         </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-lg font-medium text-white">Recruitment Agent Console</h2>
            
            <div className="flex items-center gap-3">
                {status === AgentStatus.COMPLETE && candidates.length > 0 && (
                     <button 
                        onClick={() => onStartPresentation(candidates)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                     >
                        <BarChart3 size={16} /> Present Report
                     </button>
                )}

                {isWorking ? (
                    <button 
                        onClick={handleStopAgent}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Square size={16} fill="currentColor" /> Stop Agent
                    </button>
                ) : (
                    <button 
                        onClick={handleOpenSetup}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {status === AgentStatus.COMPLETE ? <RefreshCw size={16} /> : <Play size={16} />}
                        {status === AgentStatus.COMPLETE ? 'New Scan' : 'Start Scan'}
                    </button>
                )}
            </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
                {/* Empty State */}
                {status === AgentStatus.IDLE && candidates.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-fadeIn">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Mail className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Ready to Scan</h3>
                        <p className="max-w-md text-center mb-6">
                            The agent will connect to {company.email || 'your email gateway'} to identify potential candidates for the {company.industry} team.
                        </p>
                        <button 
                            onClick={handleOpenSetup}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all"
                        >
                            <Play size={18} /> Configure & Start
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {status === AgentStatus.GENERATING_EMAILS && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
                        <h3 className="text-xl font-medium text-white">Ingesting Emails...</h3>
                        <p className="text-slate-400">Scanning inbox for "{jobCriteria.jobTitle}" applications</p>
                    </div>
                )}

                {/* Results Grid */}
                {(candidates.length > 0 || status === AgentStatus.ANALYZING) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
                        
                        {/* List */}
                        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 h-full max-h-[calc(100vh-140px)]">
                            {candidates.map((c) => (
                                <CandidateCard 
                                    key={c.id} 
                                    candidate={c} 
                                    onClick={() => setSelectedCandidate(c)}
                                />
                            ))}
                            {status === AgentStatus.ANALYZING && (
                                <div className="glass-panel p-4 rounded-xl border border-slate-700 animate-pulse flex items-center justify-center h-32 shrink-0">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-blue-400" />
                                        <span className="text-sm text-slate-400">Analyzing next email...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detail & Chart */}
                        <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                            {/* Stats */}
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 h-64 shrink-0">
                                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Score Distribution</h3>
                                <div className="w-full h-full pb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                                            <YAxis stroke="#64748b" tick={{fontSize: 12}} domain={[0, 100]} />
                                            <Tooltip 
                                                contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} 
                                                itemStyle={{color: '#60a5fa'}}
                                                cursor={{fill: '#334155', opacity: 0.2}}
                                            />
                                            <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Selected Details */}
                            {selectedCandidate ? (
                                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{selectedCandidate.name}</h2>
                                            <p className="text-blue-400 text-lg">{selectedCandidate.role}</p>
                                            <p className="text-slate-500 text-sm">{selectedCandidate.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-4xl font-bold text-white">{selectedCandidate.score}</div>
                                            <div className="text-slate-400 text-sm">Match Score</div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase flex items-center gap-2">
                                                <FileText size={16} /> AI Summary
                                            </h4>
                                            <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                                {selectedCandidate.summary}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-green-400 mb-2 uppercase">Strengths</h4>
                                                <ul className="space-y-2">
                                                    {selectedCandidate.strengths.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                                            <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-orange-400 mb-2 uppercase">Weaknesses</h4>
                                                <ul className="space-y-2">
                                                    {selectedCandidate.weaknesses.map((w, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                                            {w}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-slate-700">
                                            <h4 className="text-sm font-semibold text-purple-400 mb-2 uppercase">Recommendation Logic</h4>
                                            <p className="text-slate-400 italic text-sm">
                                                "{selectedCandidate.recommendationReason}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-500 border border-slate-700/50 border-dashed rounded-xl bg-slate-800/30">
                                    Select a candidate to view full AI analysis
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};