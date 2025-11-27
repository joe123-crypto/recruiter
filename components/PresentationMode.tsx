import React, { useEffect, useState } from 'react';
import { CandidateAnalysis, CompanyProfile } from '../types';
import { generatePresentationScript } from '../services/geminiService';
import { X, ChevronRight, ChevronLeft, Loader2, Award } from 'lucide-react';

interface Props {
  candidates: CandidateAnalysis[];
  company: CompanyProfile;
  onClose: () => void;
}

interface Slide {
  title: string;
  content: string;
}

export const PresentationMode: React.FC<Props> = ({ candidates, company, onClose }) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter top candidates for the presentation
  const topCandidates = candidates.filter(c => c.score > 70).sort((a, b) => b.score - a.score);

  useEffect(() => {
    const fetchSlides = async () => {
      const generatedSlides = await generatePresentationScript(topCandidates);
      setSlides([
        {
          title: `Recruitment Report: ${company.name}`,
          content: `AI-Driven Analysis of ${candidates.length} Applicants.\n\nDate: ${new Date().toLocaleDateString()}`
        },
        ...generatedSlides
      ]);
      setLoading(false);
    };
    fetchSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextSlide = () => {
    if (currentSlide < slides.length + topCandidates.length) {
      setCurrentSlide(c => c + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(c => c - 1);
    }
  };

  // Helper to render candidate slide or general slide
  const renderSlideContent = () => {
    // If we are past the generated intro slides, show individual candidate cards
    if (currentSlide > slides.length - 1) {
        const candidateIndex = currentSlide - slides.length;
        // Safety check
        if (candidateIndex >= topCandidates.length) return <div className="text-white">End of Presentation</div>;
        
        const c = topCandidates[candidateIndex];

        return (
            <div className="flex flex-col h-full justify-center max-w-4xl mx-auto animate-fadeIn">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                         <Award className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h2 className="text-5xl font-bold text-white mb-2">{c.name}</h2>
                        <p className="text-2xl text-blue-300">{c.role} • Score: {c.score}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                        <h3 className="text-xl font-semibold text-green-400 mb-4">Why them?</h3>
                        <p className="text-slate-200 text-lg leading-relaxed">{c.recommendationReason}</p>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h3 className="text-lg font-semibold text-purple-400 mb-3">Key Strengths</h3>
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {c.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                             <h3 className="text-lg font-semibold text-orange-400 mb-3">Considerations</h3>
                             <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {c.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // General Slide
    const slide = slides[currentSlide];
    return (
      <div className="flex flex-col h-full justify-center items-center text-center max-w-4xl mx-auto animate-fadeIn px-8">
        <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-12">
          {slide.title}
        </h2>
        <div className="text-xl md:text-2xl text-slate-300 whitespace-pre-line leading-relaxed">
          {slide.content}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 animate-pulse">Generating Report...</p>
        </div>
      </div>
    );
  }

  const totalSlides = slides.length + topCandidates.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
         <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
             <div className="w-3 h-3 rounded-full bg-green-500"></div>
         </div>
         <button 
           onClick={onClose}
           className="p-2 hover:bg-slate-800 rounded-full transition-colors"
         >
           <X className="w-6 h-6 text-slate-400" />
         </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {renderSlideContent()}
      </div>

      {/* Controls */}
      <div className="h-24 border-t border-slate-800 bg-slate-900 flex items-center justify-between px-8">
         <div className="text-slate-500 font-mono">
            SLIDE {currentSlide + 1} / {totalSlides}
         </div>
         
         <div className="flex items-center gap-4">
             <button 
               onClick={prevSlide}
               disabled={currentSlide === 0}
               className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
             >
                 <ChevronLeft className="w-6 h-6" />
             </button>
             <button 
               onClick={nextSlide}
               disabled={currentSlide >= totalSlides - 1}
               className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/50"
             >
                 <ChevronRight className="w-6 h-6" />
             </button>
         </div>
      </div>
    </div>
  );
};
