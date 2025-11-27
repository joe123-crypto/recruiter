import React from 'react';
import { CandidateAnalysis } from '../types';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, User, Star } from 'lucide-react';

interface Props {
  candidate: CandidateAnalysis;
  onClick: () => void;
}

export const CandidateCard: React.FC<Props> = ({ candidate, onClick }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400 border-green-500/50 bg-green-500/10';
    if (score >= 70) return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    return 'text-red-400 border-red-500/50 bg-red-500/10';
  };

  return (
    <div 
      onClick={onClick}
      className="glass-panel rounded-xl p-5 hover:bg-slate-800/80 transition-all cursor-pointer border border-slate-700 group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-slate-600 transition-colors">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg leading-tight">{candidate.name}</h3>
            <p className="text-sm text-slate-400">{candidate.role}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-bold flex items-center gap-1 ${getScoreColor(candidate.score)}`}>
           <Star size={14} className="fill-current" />
           {candidate.score}
        </div>
      </div>

      <p className="text-slate-300 text-sm mb-4 line-clamp-2">
        {candidate.summary}
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-green-300">
           <TrendingUp size={14} />
           <span className="truncate">{candidate.strengths[0]}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
            {candidate.status === 'interview' ? (
                <span className="flex items-center gap-1 text-blue-400 font-medium"><CheckCircle size={12}/> Recommended for Interview</span>
            ) : (
                <span className="flex items-center gap-1 text-slate-500"><AlertCircle size={12}/> Needs Review</span>
            )}
        </div>
      </div>
    </div>
  );
};
