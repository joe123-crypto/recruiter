import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, Trash2, Calendar, Users, Briefcase } from 'lucide-react';
import { CandidateAnalysis, JobCriteria } from '../types';

interface ScanHistoryItem {
    id: string;
    timestamp: number;
    jobCriteria: JobCriteria;
    candidates: CandidateAnalysis[];
    lastScannedUid?: number;
}

interface Props {
    onLoadScan: (scan: ScanHistoryItem) => void;
}

export const RecentScans: React.FC<Props> = ({ onLoadScan }) => {
    const [history, setHistory] = useState<ScanHistoryItem[]>([]);

    useEffect(() => {
        const savedHistory = localStorage.getItem('recruiter_scan_history');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                // Sort by newest first
                setHistory(parsed.sort((a: ScanHistoryItem, b: ScanHistoryItem) => b.timestamp - a.timestamp));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newHistory = history.filter(h => h.id !== id);
        setHistory(newHistory);
        localStorage.setItem('recruiter_scan_history', JSON.stringify(newHistory));
    };

    const formatDate = (ts: number) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
        }).format(new Date(ts));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Recent Scans</h2>
                <p className="text-slate-400">View and reload past recruitment sessions.</p>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="text-slate-500 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">No Scan History</h3>
                    <p className="text-slate-500">Completed scans will appear here automatically.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {history.map((scan) => (
                        <div
                            key={scan.id}
                            onClick={() => onLoadScan(scan)}
                            className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                            {scan.jobCriteria.jobTitle || 'Untitled Scan'}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {formatDate(scan.timestamp)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Users size={14} />
                                                {scan.candidates.length} Candidates
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={(e) => handleDelete(scan.id, e)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete Scan"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
