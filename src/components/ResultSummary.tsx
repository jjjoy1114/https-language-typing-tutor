import React from 'react';
import { 
  Award, 
  RotateCcw, 
  Home, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Zap,
  TrendingUp,
  Share2
} from 'lucide-react';
import { HistoryRecord } from '../types';

interface ResultSummaryProps {
  userName: string;
  record: HistoryRecord;
  onRetry: () => void;
  onBackToDashboard: () => void;
}

export default function ResultSummary({
  userName,
  record,
  onRetry,
  onBackToDashboard
}: ResultSummaryProps) {
  
  // Custom rank evaluator for language learners
  const getRankStats = (cpm: number, wpm: number) => {
    if (cpm >= 450 || wpm >= 90) {
      return {
        grade: '신급 (Language Master)',
        desc: '원어민을 초월하는 속도입니다! 타자 연습의 최고 정상에 도달하셨네요.',
        color: 'text-amber-700 bg-amber-50 border-amber-200'
      };
    } else if (cpm >= 250 || wpm >= 50) {
      return {
        grade: '고급 (Expert Composer)',
        desc: '매우 훌륭한 타이핑 실력입니다! 직무 능력을 발휘하기에 충분해요.',
        color: 'text-blue-700 bg-blue-50 border-blue-200'
      };
    } else if (cpm >= 120 || wpm >= 25) {
      return {
        grade: '중급 (Pragmatic Learner)',
        desc: '실생활에서 무리 없이 한컴 타자를 작성할 수 있는 안정적인 수준입니다.',
        color: 'text-purple-700 bg-purple-50 border-purple-200'
      };
    } else {
      return {
        grade: '초급 (Rookie Typist)',
        desc: '자모음 배열을 천천히 손가락에 익혀가는 단계입니다. 포기하지 마세요!',
        color: 'text-slate-600 bg-slate-100 border-slate-300'
      };
    }
  };

  const rank = getRankStats(record.cpm, record.wpm);

  // Format second duration nicely
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}분 ${s}초` : `${m}분`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-8 py-4 sm:py-8 animate-fade-in" id="result-summary-card">
      
      {/* Visual Badge Header */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center shadow-xs relative overflow-hidden">
        
        {/* Glow Background Deco */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-3 sm:p-4 bg-blue-50 text-blue-600 rounded-full mb-3 sm:mb-4 ring-6 sm:ring-8 ring-blue-100">
          <Award className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 타자 연습 결과 리뷰 (Result Review)
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          연습을 무사히 마쳤습니다!
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-sm mx-auto">
          축하합니다, <strong>{userName}</strong>님! 연습 결과 리뷰와 분석 지표를 확인하세요.
        </p>

        {/* Dynamic Class Grade */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center">
          <span className={`px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-extrabold border uppercase tracking-wider ${rank.color}`}>
            {rank.grade}
          </span>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-2 max-w-md leading-relaxed px-2">
            {rank.desc}
          </p>
        </div>
      </div>

      {/* Grid of Results Numbers */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        
        {/* WPM */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center space-y-1 hover:border-slate-300 transition shadow-xs">
          <span className="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-none">
            <Zap className="w-3.5 h-3.5 text-orange-500" /> 속도 (WPM)
          </span>
          <h3 className="text-2xl sm:text-4xl font-black font-mono text-slate-900 select-all">
            {record.wpm}
          </h3>
          <p className="text-[10px] text-slate-400">Words Per Minute</p>
        </div>

        {/* CPM */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center space-y-1 hover:border-slate-300 transition shadow-xs">
          <span className="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-none">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> 타수 (CPM)
          </span>
          <h3 className="text-2xl sm:text-4xl font-black font-mono text-blue-600 select-all">
            {record.cpm}
          </h3>
          <p className="text-[10px] text-slate-400">타/분</p>
        </div>

        {/* Accuracy */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center space-y-1 hover:border-slate-300 transition shadow-xs">
          <span className="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-none">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 정확도
          </span>
          <h3 className="text-2xl sm:text-4xl font-black font-mono text-emerald-600 select-all">
            {record.accuracy}%
          </h3>
          <p className="text-[10px] text-slate-400">정타 비율</p>
        </div>

        {/* Time spent */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center space-y-1 hover:border-slate-300 transition shadow-xs">
          <span className="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-none">
            <Clock className="w-3.5 h-3.5 text-indigo-500" /> 소요 시간
          </span>
          <h3 className="text-2xl sm:text-4xl font-black font-mono text-slate-800 select-all">
            {formatTime(record.timeSpent)}
          </h3>
          <p className="text-[10px] text-slate-400">총 훈련 분량</p>
        </div>
      </div>

      {/* Target exercise meta info */}
      <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500">
        <div>
          <span className="font-bold text-slate-700 block mb-0.5">연습 자료</span>
          <span className="font-semibold text-slate-800">{record.textTitle}</span> ({record.mode === 'word' ? '단어 연습' : record.mode === 'sentence' ? '문장 연습' : '긴 글 연습'})
        </div>
        <div className="text-left sm:text-right">
          <span className="font-bold text-slate-700 block mb-0.5">완료 시간</span>
          <span>{new Date(record.date).toLocaleString('ko-KR')}</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-4 h-4" /> 다시 연습하기 (재도전)
        </button>

        <button
          onClick={onBackToDashboard}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Home className="w-4 h-4" /> 다른 글 연습하러 가기
        </button>
      </div>
    </div>
  );
}
