import React, { useState, useRef, useEffect } from 'react';
import { CompanyProfile, AgentStatus, CandidateAnalysis, EmailData, JobCriteria } from '../types';
import { scanForCandidates, extractJobCriteriaFromDoc } from '../services/geminiService';
import { CandidateCard } from './CandidateCard';
import { ChatInterface } from './ChatInterface';
import { Play, Square, RefreshCw, BarChart3, Mail, Loader2, FileText, CheckCircle, X, UploadCloud, Trash2, PlayCircle, MessageSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface Props {
    company: CompanyProfile;
    onStartPresentation: (candidates: CandidateAnalysis[]) => void;
    initialState?: any; // Allow passing state from history
}

export const Scanner: React.FC<Props> = ({ company, onStartPresentation, initialState }) => {
    const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
    const [emails, setEmails] = useState<EmailData[]>([]);
    const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateAnalysis | null>(null);

    // Streaming & Resume State
    const [scanStatusMessage, setScanStatusMessage] = useState<string>('');
    const [lastScannedUid, setLastScannedUid] = useState<number | undefined>(undefined);
    const [scanProgress, setScanProgress] = useState<{ current: number, total: number } | null>(null);

    // Chat State
    const [showChat, setShowChat] = useState(false);

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

    const [emailFilters, setEmailFilters] = useState({
        subject: '',
        sender: ''
    });

    const [sendSummaryEmail, setSendSummaryEmail] = useState(false);

    // Load initial state if provided (from Recent Scans)
    useEffect(() => {
        if (initialState) {
            setCandidates(initialState.candidates || []);
            setJobCriteria(initialState.jobCriteria || {});
            setLastScannedUid(initialState.lastScannedUid);
            setStatus(AgentStatus.COMPLETE);
            setScanStatusMessage('Loaded from history.');
            // Clear current session to avoid conflict? Or maybe set it to this?
            // For now, we just load it.
        } else {
            // Try to restore from current session
            const savedSession = localStorage.getItem('recruiter_current_session');
            if (savedSession) {
                try {
                    const session = JSON.parse(savedSession);
                    setCandidates(session.candidates || []);
                    setJobCriteria(session.jobCriteria || {});
                    setLastScannedUid(session.lastScannedUid);
                    setEmailFilters(session.emailFilters || { subject: '', sender: '' });

                    // Restore status logic
                    if (session.status === AgentStatus.SCANNING) {
                        setStatus(AgentStatus.IDLE); // Don't auto-resume scanning, let user decide
                        setScanStatusMessage('Previous scan interrupted. Ready to resume.');
                    } else {
                        setStatus(session.status || AgentStatus.IDLE);
                    }
                } catch (e) {
                    console.error("Failed to restore session", e);
                }
            }
        }
    }, [initialState]);

    // Persist State
    useEffect(() => {
        // Don't save if we are just loading
        if (status === AgentStatus.IDLE && candidates.length === 0) return;

        const sessionState = {
            candidates,
            jobCriteria,
            lastScannedUid,
            emailFilters,
            status
        };
        localStorage.setItem('recruiter_current_session', JSON.stringify(sessionState));
    }, [candidates, jobCriteria, lastScannedUid, emailFilters, status]);

    // Save to History on Completion
    useEffect(() => {
        if (status === AgentStatus.COMPLETE && candidates.length > 0) {
            const historyItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                jobCriteria,
                candidates,
                lastScannedUid
            };

            const existingHistory = localStorage.getItem('recruiter_scan_history');
            let history = existingHistory ? JSON.parse(existingHistory) : [];

            // Check if we already saved this exact scan (simple check by candidate count/title to avoid dupes on re-render)
            // A better way is to have a scanId. For now, we'll just append.
            // Actually, let's avoid dupes by checking if the last item has same timestamp (unlikely) or same candidates/title
            // Let's just append for now, user can delete.

            // Wait, this effect runs on every render if status is complete. We need a ref to track if saved.
        }
    }, [status]);
    // ^ The above effect is problematic. Let's move history saving to the executeScan completion block.

    const handleOpenSetup = () => {
        // If we have completed a run, reset data before new run
        if (status === AgentStatus.COMPLETE) {
            setCandidates([]);
            setEmails([]);
            setSelectedCandidate(null);
            setLastScannedUid(undefined);
            setScanProgress(null);
            setShowChat(false);
            // Clear session storage
            localStorage.removeItem('recruiter_current_session');
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

    const executeScan = async (isResume: boolean = false) => {
        setShowSetup(false);
        setStatus(AgentStatus.SCANNING); // Use SCANNING for the streaming phase

        if (!isResume) {
            setCandidates([]);
            setSelectedCandidate(null);
            setLastScannedUid(undefined);
            setShowChat(false);
        }

        try {
            const emailCredentials = (company.imapUser || company.email) && company.imapPassword ? {
                user: company.imapUser || company.email,
                pass: company.imapPassword,
                host: company.imapHost || 'imap.gmail.com'
            } : undefined;

            // Pass emailFilters to the service
            await scanForCandidates(
                company.industry,
                jobCriteria,
                emailCredentials,
                sendSummaryEmail,
                emailFilters,
                isResume ? lastScannedUid : undefined,
                (newCandidate) => {
                    setCandidates(prev => [...prev, newCandidate]);
                },
                (statusMsg) => {
                    setScanStatusMessage(statusMsg);
                },
                (current, total) => {
                    setScanProgress({ current, total });
                },
                (uid) => {
                    setLastScannedUid(uid);
                }
            );

            setStatus(AgentStatus.COMPLETE);
            setScanStatusMessage('Scan complete.');
            setShowChat(true); // Auto-open chat when complete

            // Save to History
            const historyItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                jobCriteria,
                candidates: candidates, // Note: candidates state might not be updated yet in this closure? 
                // Actually, candidates state in this closure is stale. We need to use the functional update or a ref.
                // But wait, scanForCandidates awaits until done. 
                // However, the `candidates` variable here is from the render scope when executeScan was called.
                // We need to use a ref to track candidates for saving.
            };

            // Let's use a workaround: We'll save to history in a useEffect that watches status=COMPLETE, 
            // but we need to ensure it only runs once per scan.
            // Or better, we can just read the current session from localStorage which is up to date!

            setTimeout(() => {
                const session = localStorage.getItem('recruiter_current_session');
                if (session) {
                    const parsed = JSON.parse(session);
                    const item = {
                        id: Date.now().toString(),
                        timestamp: Date.now(),
                        jobCriteria: parsed.jobCriteria,
                        candidates: parsed.candidates,
                        lastScannedUid: parsed.lastScannedUid
                    };

                    const existingHistory = localStorage.getItem('recruiter_scan_history');
                    const history = existingHistory ? JSON.parse(existingHistory) : [];
                    history.push(item);
                    localStorage.setItem('recruiter_scan_history', JSON.stringify(history));
                }
            }, 1000); // Small delay to ensure localStorage is updated

        } catch (error) {
            console.error(error);
            setStatus(AgentStatus.IDLE); // Or ERROR state if we had one
            setScanStatusMessage('Scan failed or stopped.');
        }
    };

    const handleStopAgent = () => {
        setStatus(AgentStatus.IDLE);
        setScanStatusMessage('Stopped by user.');
    };

    const isWorking = status !== AgentStatus.IDLE && status !== AgentStatus.COMPLETE;

    // Chart Data
    const chartData = candidates.map(c => ({
        name: c.name.split(' ')[0], // First name only for chart
        score: c.score
    }));

    return (
        <div className="flex flex-col h-full bg-slate-900/50 relative">
            {/* Chat Interface */}
            {showChat && (
                <ChatInterface
                    candidates={candidates}
                    jobCriteria={jobCriteria}
                    onClose={() => setShowChat(false)}
                />
            )}

            {/* Floating Chat Button (when closed but available) */}
            {!showChat && status === AgentStatus.COMPLETE && candidates.length > 0 && (
                <button
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center z-40 transition-transform hover:scale-110 animate-bounce-in"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {/* Job Setup Modal */}
            {showSetup && (
                <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">New Recruitment Scan</h3>
                                <p className="text-slate-400 text-sm">Upload a job description to start</p>
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
                                <div className="space-y-6">
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

                                    {/* Extracted Criteria Display */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                        <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Extracted Criteria</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs text-slate-500 block">Target Position</span>
                                                <span className="text-white font-medium">{jobCriteria.jobTitle || 'Not found'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-xs text-slate-500 block">Experience</span>
                                                    <span className="text-slate-300">{jobCriteria.experienceLevel}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-slate-500 block">Deadline</span>
                                                    <span className="text-slate-300">{jobCriteria.deadline || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-500 block">Key Skills</span>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {jobCriteria.keySkills.split(',').map((skill, i) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/20">
                                                            {skill.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Email Filters Section */}
                        <div className="px-6 pb-6 space-y-4">
                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Email Search Filters</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Subject Contains</label>
                                    <input
                                        type="text"
                                        value={emailFilters.subject}
                                        onChange={(e) => setEmailFilters(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="e.g. Application, Resume"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Sender / From</label>
                                    <input
                                        type="text"
                                        value={emailFilters.sender}
                                        onChange={(e) => setEmailFilters(prev => ({ ...prev, sender: e.target.value }))}
                                        placeholder="e.g. linkedin.com"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="summaryEmail"
                                    checked={sendSummaryEmail}
                                    onChange={(e) => setSendSummaryEmail(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                />
                                <label htmlFor="summaryEmail" className="text-sm text-slate-300 cursor-pointer select-none">
                                    Send summary email to manager
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSetup(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => executeScan(false)}
                                    disabled={!uploadedFile || isParsingDoc}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Initialize Agent
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-lg font-medium text-white">Recruitment Agent Console</h2>

                <div className="flex items-center gap-3">
                    {/* Status Message Display */}
                    {isWorking && (
                        <div className="flex items-center gap-3 mr-4 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                            <Loader2 size={14} className="animate-spin text-blue-400" />
                            <span className="text-xs font-medium text-slate-300">{scanStatusMessage || 'Processing...'}</span>
                        </div>
                    )}

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
                        <div className="flex gap-2">
                            {/* Resume Button */}
                            {lastScannedUid !== undefined && candidates.length > 0 && (
                                <button
                                    onClick={() => executeScan(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 hover:bg-emerald-600/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <PlayCircle size={16} /> Resume Scan
                                </button>
                            )}

                            <button
                                onClick={handleOpenSetup}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                            >
                                {status === AgentStatus.COMPLETE ? <RefreshCw size={16} /> : <Play size={16} />}
                                {status === AgentStatus.COMPLETE ? 'New Scan' : 'Start Scan'}
                            </button>
                        </div>
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
                                The agent will connect to {company.imapUser || company.email || 'your email gateway'} to identify potential candidates for the {company.industry} team.
                            </p>
                            <button
                                onClick={handleOpenSetup}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all"
                            >
                                <Play size={18} /> Configure & Start
                            </button>
                        </div>
                    )}

                    {/* Loading State - Initial connection */}
                    {status === AgentStatus.GENERATING_EMAILS && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
                            <h3 className="text-xl font-medium text-white">Connecting...</h3>
                            <p className="text-slate-400">Establishing secure connection to email gateway</p>
                        </div>
                    )}

                    {/* Results Grid */}
                    {(candidates.length > 0 || status === AgentStatus.SCANNING) && (
                        <>
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
                                    {status === AgentStatus.SCANNING && (
                                        <div className="glass-panel p-4 rounded-xl border border-slate-700 animate-pulse flex items-center justify-center h-32 shrink-0">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="animate-spin text-blue-400" />
                                                <span className="text-sm text-slate-400">
                                                    {scanProgress ? `Scanning ${scanProgress.current}/${scanProgress.total}` : 'Scanning...'}
                                                </span>
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
                                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                                                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 100]} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                        itemStyle={{ color: '#60a5fa' }}
                                                        cursor={{ fill: '#334155', opacity: 0.2 }}
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

                            {/* Findings Table */}
                            <div className="mt-6 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shrink-0">
                                <div className="p-4 border-b border-slate-700">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Findings Summary</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-400">
                                        <thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-300">
                                            <tr>
                                                <th className="px-6 py-3">Candidate</th>
                                                <th className="px-6 py-3">Role</th>
                                                <th className="px-6 py-3">Score</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {candidates.map((candidate) => (
                                                <tr key={candidate.id} className="hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => setSelectedCandidate(candidate)}>
                                                    <td className="px-6 py-4 font-medium text-white">{candidate.name}</td>
                                                    <td className="px-6 py-4">{candidate.role}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${candidate.score >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                            candidate.score >= 60 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                                'bg-red-500/10 text-red-400 border border-red-500/20'
                                                            }`}>
                                                            {candidate.score}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 capitalize">{candidate.status}</td>
                                                    <td className="px-6 py-4">{candidate.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};