import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  UploadCloud, 
  Award, 
  History, 
  Trash2, 
  Play, 
  TrendingUp, 
  Check, 
  X,
  Cloud,
  CheckCircle2,
  Search,
  Sparkles,
  Clock,
  ChevronRight,
  AlignLeft,
  Calendar
} from 'lucide-react';
import { TextPreset, TypingMode, HistoryRecord } from '../types';
import { PRESET_TEXTS } from '../data/presets';
import { User } from '../lib/firebase';

interface DashboardProps {
  userName: string;
  history: HistoryRecord[];
  onClearHistory: () => void;
  customPresets: TextPreset[];
  onAddCustomPreset: (preset: TextPreset) => void;
  onDeleteCustomPreset: (id: string) => void;
  onStartSession: (preset: TextPreset, mode: TypingMode) => void;
  currentUser?: User | null;
  onLoginWithGoogle?: () => void;
}

export default function Dashboard({
  userName,
  history,
  onClearHistory,
  customPresets,
  onAddCustomPreset,
  onDeleteCustomPreset,
  onStartSession,
  currentUser,
  onLoginWithGoogle
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'ko' | 'en' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_TEXTS[0].id);
  const [selectedMode, setSelectedMode] = useState<TypingMode>('sentence');
  
  // Custom text paste / upload modal trigger
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteLang, setPasteLang] = useState<'ko' | 'en'>('ko');
  const [pasteError, setPasteError] = useState('');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine default presets and custom presets
  const allPresets = useMemo(() => [...PRESET_TEXTS, ...customPresets], [customPresets]);

  // Handle auto-detect mode on initial or preset selection if not explicitly set
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const selected = allPresets.find(p => p.id === presetId);
    if (selected) {
      const id = selected.id.toLowerCase();
      const title = selected.title.toLowerCase();
      const desc = selected.description.toLowerCase();
      
      if (id.includes('words') || title.includes('단어') || desc.includes('단어') || title.includes('vocabulary')) {
        setSelectedMode('word');
      } else if (id.includes('long') || id.includes('poem') || id.includes('anthem') || title.includes('긴 글') || desc.includes('수필') || desc.includes('시 ') || desc.includes('소설')) {
        setSelectedMode('paragraph');
      } else {
        setSelectedMode('sentence');
      }
    }
  };

  // Keyboard shortcut: Press Enter to start practice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isUploadOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        const currentPreset = allPresets.find(p => p.id === selectedPresetId) || allPresets[0];
        if (currentPreset) {
          onStartSession(currentPreset, selectedMode);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allPresets, selectedPresetId, selectedMode, onStartSession, isUploadOpen]);

  // Filter presets based on category and search query
  const filteredPresets = useMemo(() => {
    return allPresets.filter((p) => {
      // Category filter
      if (activeTab === 'ko' && p.language !== 'ko') return false;
      if (activeTab === 'en' && p.language !== 'en') return false;
      if (activeTab === 'custom' && p.language !== 'custom') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchContent;
      }
      return true;
    });
  }, [allPresets, activeTab, searchQuery]);

  const selectedPreset = allPresets.find(p => p.id === selectedPresetId) || allPresets[0] || PRESET_TEXTS[0];

  // Best record for current selected preset
  const presetBestRecord = useMemo(() => {
    const records = history.filter(r => r.textTitle === selectedPreset.title);
    if (records.length === 0) return null;
    return records.reduce((max, r) => (r.cpm > max.cpm ? r : max), records[0]);
  }, [history, selectedPreset]);

  // Overall Statistics from history
  const totalExercises = history.length;
  const bestWpm = history.reduce((max, r) => (r.wpm > max ? r.wpm : max), 0);
  const bestCpm = history.reduce((max, r) => (r.cpm > max ? r.cpm : max), 0);
  const avgAccuracy = totalExercises > 0 
    ? Math.round(history.reduce((sum, r) => sum + r.accuracy, 0) / totalExercises) 
    : 0;

  // Handle file uploads (.txt)
  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      alert('TXT 파일(.txt)만 지원합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || content.trim().length === 0) {
        alert('파일 내용이 비어있습니다.');
        return;
      }

      const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(content);
      const newPreset: TextPreset = {
        id: 'custom-' + Date.now(),
        title: file.name.replace('.txt', ''),
        language: 'custom',
        description: `${hasKorean ? '한국어' : '영어'} 업로드 파일 (${file.name})`,
        content: content.trim()
      };

      onAddCustomPreset(newPreset);
      setSelectedPresetId(newPreset.id);
      setIsUploadOpen(false);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteTitle.trim()) {
      setPasteError('제목을 입력해 주세요.');
      return;
    }
    if (!pasteContent.trim()) {
      setPasteError('내용을 입력해 주세요.');
      return;
    }

    const newPreset: TextPreset = {
      id: 'custom-' + Date.now(),
      title: pasteTitle.trim(),
      language: 'custom',
      description: `직접 등록한 ${pasteLang === 'ko' ? '한국어' : '영어'} 맞춤 자료`,
      content: pasteContent.trim()
    };

    onAddCustomPreset(newPreset);
    setSelectedPresetId(newPreset.id);
    setPasteTitle('');
    setPasteContent('');
    setPasteError('');
    setIsUploadOpen(false);
  };

  // Content Preview Snippet calculation
  const previewLines = useMemo(() => {
    if (!selectedPreset?.content) return [];
    return selectedPreset.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 3);
  }, [selectedPreset]);

  const charCount = selectedPreset?.content ? selectedPreset.content.replace(/\s/g, '').length : 0;
  const wordCount = selectedPreset?.content ? selectedPreset.content.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in" id="dashboard-container">
      
      {/* 1. Sleek, Executive Header Bar with Quick Action */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              반갑습니다, <span className="text-blue-600">{userName}</span>님!
            </span>
            {currentUser && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">Google 클라우드 동기화</span>
                <span className="sm:hidden">동기화</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            오늘 연습할 타자 모드와 본문을 선택하고 실력을 한 단계 높여보세요.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer"
            id="open-upload-btn"
          >
            <UploadCloud className="w-4 h-4" />
            <span>내 텍스트 추가 (.txt)</span>
          </button>
        </div>
      </div>

      {/* 2. Compact, High-Density Metrics Ribbon (Responsive: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4" id="stats-ribbon">
        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-2xs hover:border-blue-400/40 transition">
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">최고 타수 (CPM)</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">{bestCpm}</span>
              <span className="text-[10px] text-slate-400 font-medium">타/분</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-2xs hover:border-blue-400/40 transition">
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">최고 속도 (WPM)</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">{bestWpm}</span>
              <span className="text-[10px] text-slate-400 font-medium">WPM</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-2xs hover:border-blue-400/40 transition">
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">완료한 연습</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">{totalExercises}</span>
              <span className="text-[10px] text-slate-400 font-medium">회 (정확도 {avgAccuracy}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-2xs hover:border-blue-400/40 transition" id="cloud-sync-status-card">
          <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${currentUser ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>
            <Cloud className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">클라우드 상태</p>
            {currentUser ? (
              <div className="mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span>실시간 동기화</span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium truncate" title={currentUser.email || ''}>
                  {currentUser.email || '구글 계정 연동'}
                </p>
              </div>
            ) : (
              <div className="mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-700 block">로컬 저장</span>
                {onLoginWithGoogle && (
                  <button 
                    type="button"
                    onClick={onLoginWithGoogle}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                  >
                    Google 로그인 연동 →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Primary Mode Selector (Step 1: Top-Level Interactive Segment) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              1단계: 타자 연습 모드 선택
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {selectedMode === 'word' && '💡 개별 단어를 하나씩 입력하며 Spacebar로 완성합니다.'}
            {selectedMode === 'sentence' && '💡 문장을 순서대로 입력하고 문장 끝에서 Enter키를 누릅니다.'}
            {selectedMode === 'paragraph' && '💡 긴 글, 시, 수필 전체를 줄글로 연속 입력합니다.'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Word Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('word')}
            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              selectedMode === 'word'
                ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl font-bold text-xs ${
              selectedMode === 'word' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900">단어 연습</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">Space</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">낱말 순발력 & 기본 자모음 운지</p>
            </div>
          </button>

          {/* Sentence Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('sentence')}
            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              selectedMode === 'sentence'
                ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl font-bold text-xs ${
              selectedMode === 'sentence' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900">문장 연습</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">Enter ↵</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">실전 단문 타이핑 & 줄바꿈 감각</p>
            </div>
          </button>

          {/* Paragraph Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('paragraph')}
            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              selectedMode === 'paragraph'
                ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl font-bold text-xs ${
              selectedMode === 'paragraph' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
            }`}>
              <AlignLeft className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900">긴 글 연습</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">연속</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">명문장, 시, 수필 실전 지속 타자</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Main Practice Studio: 2-Column Responsive Layout (PC & Tablet: side-by-side, Mobile: stacked with visible preview) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start" id="practice-studio">
        
        {/* Left Column: Preset Text Selector & Search (7 cols on MD/LG) */}
        <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                2단계: 연습 자료 선택
              </span>
              <span className="text-xs font-bold text-slate-400">({filteredPresets.length}개)</span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ko')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'ko' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                한글 🇰🇷
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'en' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                영어 🇺🇸
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'custom' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                내 자료 📁
              </button>
            </div>
          </div>

          {/* Mobile Quick Preview & Launch Card (Always visible on mobile without scrolling) */}
          <div className="md:hidden bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-black text-slate-900 truncate">
                  선택: {selectedPreset?.title}
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                {selectedMode === 'word' ? '단어' : selectedMode === 'sentence' ? '문장' : '긴 글'}
              </span>
            </div>

            <div className="bg-white/95 border border-blue-100 p-2.5 rounded-xl text-xs font-mono text-slate-700 max-h-20 overflow-y-auto space-y-1">
              <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">본문 미리보기 (리뷰)</div>
              {previewLines.slice(0, 2).map((l, i) => (
                <p key={i} className="truncate"><span className="text-slate-400 font-sans mr-1">{i+1}.</span>{l}</p>
              ))}
            </div>

            <button
              onClick={() => onStartSession(selectedPreset, selectedMode)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
            >
              <Play className="w-4 h-4 fill-current" /> 바로 타자 연습 시작하기
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="자료 제목이나 키워드 검색 (예: 아리랑, 음식, 속담, 명언...)"
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Presets List in responsive, high-touch cards */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredPresets.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto stroke-1 opacity-40" />
                <p className="text-xs sm:text-sm font-medium">검색 조건에 맞는 연습 자료가 없습니다.</p>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> 직접 텍스트 추가하기
                </button>
              </div>
            ) : (
              filteredPresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-slate-50/50 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    id={`preset-${preset.id}`}
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          preset.language === 'ko' 
                            ? 'bg-orange-50 text-orange-700 border border-orange-200/60' 
                            : preset.language === 'en' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}>
                          {preset.language === 'ko' ? '한국어' : preset.language === 'en' ? 'English' : '사용자'}
                        </span>
                        
                        <h4 className={`font-bold text-xs sm:text-sm transition truncate ${
                          isSelected ? 'text-blue-800 font-black' : 'text-slate-800 group-hover:text-slate-950'
                        }`}>
                          {preset.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {preset.language === 'custom' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`'${preset.title}' 자료를 정말 삭제하시겠습니까?`)) {
                              onDeleteCustomPreset(preset.id);
                              if (selectedPresetId === preset.id) {
                                setSelectedPresetId(PRESET_TEXTS[0].id);
                              }
                            }
                          }}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="자료 삭제"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Practice Launcher & Real-Time Content Preview (5 cols on MD/LG, Sticky on tablet/desktop) */}
        <div className="md:col-span-5 space-y-4 md:sticky md:top-20">
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                  선택한 연습 미리보기
                </span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                selectedMode === 'word' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : selectedMode === 'sentence' 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {selectedMode === 'word' ? '단어 모드' : selectedMode === 'sentence' ? '문장 모드' : '긴 글 모드'}
              </span>
            </div>

            {/* Target Preset Title & Meta */}
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {selectedPreset?.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedPreset?.description}
              </p>
            </div>

            {/* Content Preview Box (Live Text Excerpt) */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>본문 미리보기</span>
                <span>약 {charCount}자 / {wordCount}단어</span>
              </div>
              <div className="text-xs sm:text-sm font-mono text-slate-700 space-y-1.5 max-h-32 overflow-y-auto leading-relaxed">
                {previewLines.map((line, idx) => (
                  <p key={idx} className="truncate">
                    <span className="text-slate-400 text-[11px] select-none mr-2 font-sans font-bold">{idx + 1}.</span>
                    {line}
                  </p>
                ))}
                {selectedPreset?.content.split('\n').length > 3 && (
                  <p className="text-[11px] text-slate-400 select-none italic pt-0.5">... 외 다수 문장 수록</p>
                )}
              </div>
            </div>

            {/* Best Record Badge on this Preset if practiced */}
            {presetBestRecord ? (
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-blue-800 font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" /> 이 연습 내 최고 기록:
                </span>
                <span className="font-mono font-extrabold text-blue-700">
                  {presetBestRecord.cpm} CPM ({presetBestRecord.accuracy}%)
                </span>
              </div>
            ) : (
              <div className="text-center py-1 text-[11px] text-slate-400">
                아직 이 연습을 완료한 기록이 없습니다. 첫 기록에 도전해 보세요!
              </div>
            )}

            {/* Primary START Button */}
            <button
              onClick={() => onStartSession(selectedPreset, selectedMode)}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-blue-600/20 transition-all duration-150 cursor-pointer group hover:scale-[1.01]"
              id="start-typing-session"
            >
              <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
              <span>타자 연습 시작하기</span>
              <span className="text-xs bg-blue-700/60 px-2 py-0.5 rounded-md font-mono font-medium ml-1">Enter ↵</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Practice History Section (Tablet & Mobile Responsive Table/Cards) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4" id="history-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              나의 타자 연습 기록
            </span>
            <span className="text-xs font-bold text-slate-400">({history.length}회 완료)</span>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-slate-400 hover:text-red-600 font-bold transition px-2.5 py-1 rounded-lg hover:bg-red-50 border border-slate-200 cursor-pointer w-fit"
            >
              기록 내역 초기화
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <TrendingUp className="w-10 h-10 mx-auto stroke-1 opacity-40" />
            <p className="text-xs sm:text-sm font-medium">아직 완료한 연습 기록이 없습니다.</p>
            <p className="text-xs text-slate-400">위의 '타자 연습 시작하기' 버튼을 눌러 첫 연습을 완료해 보세요!</p>
          </div>
        ) : (
          <div>
            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs sm:text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">날짜</th>
                    <th className="py-3 px-4">연습 자료</th>
                    <th className="py-3 px-4">모드</th>
                    <th className="py-3 px-4 font-mono">타수 (CPM)</th>
                    <th className="py-3 px-4 font-mono">속도 (WPM)</th>
                    <th className="py-3 px-4 font-mono">정확도</th>
                    <th className="py-3 px-4 text-right">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(record.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {record.textTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.mode === 'word' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : record.mode === 'sentence'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {record.mode === 'word' ? '단어' : record.mode === 'sentence' ? '문장' : '긴 글'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        {record.cpm} <span className="text-[10px] text-slate-400 font-normal">타/분</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {record.wpm} <span className="text-[10px] text-slate-400 font-normal">WPM</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {record.accuracy}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
                          <Check className="w-3.5 h-3.5" /> 완료
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Avoids awkward horizontal scrolling) */}
            <div className="md:hidden space-y-2.5">
              {history.map((record) => (
                <div key={record.id} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[200px]">
                      {record.textTitle}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      record.mode === 'word' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : record.mode === 'sentence'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {record.mode === 'word' ? '단어' : record.mode === 'sentence' ? '문장' : '긴 글'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/50">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">타수 (CPM)</span>
                      <span className="text-sm font-black font-mono text-slate-900">{record.cpm}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">속도 (WPM)</span>
                      <span className="text-sm font-black font-mono text-blue-600">{record.wpm}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">정확도</span>
                      <span className="text-sm font-black font-mono text-emerald-600">{record.accuracy}%</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-right pt-0.5">
                    {new Date(record.date).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Upload / Paste Custom Text Popup Modal (Mobile & Tablet Friendly) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-slate-50/80">
              <span className="flex items-center gap-2 font-extrabold text-slate-800 tracking-tight text-sm sm:text-base">
                <UploadCloud className="w-5 h-5 text-blue-600" /> 나만의 텍스트 추가하기
              </span>
              <button 
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
              
              {/* Drag and Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) handleFileUpload(files[0]);
                  }}
                  accept=".txt"
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 mx-auto text-blue-500 stroke-1 block mb-1.5" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">.txt 텍스트 파일 불러오기</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  마우스로 .txt 파일을 끌어다 놓거나 이곳을 터치하여 파일을 선택하세요.
                </p>
              </div>

              {/* Or separator */}
              <div className="relative flex items-center justify-center">
                <hr className="w-full border-slate-200" />
                <span className="absolute px-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">또는 직접 입력하기</span>
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">연습 자료 제목</label>
                  <input
                    type="text"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    placeholder="예: 오늘의 명언, 뉴스 기사, 좋아하는 노래 가사"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">연습할 텍스트 내용</label>
                  <textarea
                    rows={4}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder="타자 연습할 문장들을 입력하세요. 줄바꿈으로 각 문장이 구분됩니다."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPasteLang('ko')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pasteLang === 'ko' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-100 border border-slate-200 text-slate-600'
                      }`}
                    >
                      한국어 자료
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasteLang('en')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pasteLang === 'en' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 border border-slate-200 text-slate-600'
                      }`}
                    >
                      English Material
                    </button>
                  </div>

                  {pasteError && (
                    <span className="text-xs text-red-500 font-bold">{pasteError}</span>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition cursor-pointer"
                  >
                    등록 완료
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
