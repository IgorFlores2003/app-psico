import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';

interface QuestionnaireCardProps {
  questionnaire: {
    title: string;
    description: string;
    status: string;
    dueDate: string;
  };
}

const QuestionnaireCard: React.FC<QuestionnaireCardProps> = ({ questionnaire }) => {
  return (
    <button className="w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group active:scale-95 transition-all duration-200 text-left">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
          <h3 className="font-bold text-slate-800">{questionnaire.title}</h3>
        </div>
        <p className="text-slate-500 text-sm mb-3 font-medium line-clamp-1">{questionnaire.description}</p>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase">
            <Clock size={12} />
            {questionnaire.dueDate}
          </div>
          <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-tighter">
            {questionnaire.status}
          </span>
        </div>
      </div>
      
      <div className="ml-4 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
        <ChevronRight size={20} />
      </div>
    </button>
  );
};

export default QuestionnaireCard;
