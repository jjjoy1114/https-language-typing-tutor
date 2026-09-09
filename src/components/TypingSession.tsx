import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Award, 
  CheckCircle, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Keyboard,
  CornerDownLeft,
  FileText,
  BookOpen,
  X,
  Sparkles
} from 'lucide-react';
import { TextPreset, TypingMode, HistoryRecord } from '../types';
import { parseText, calculateStats } from '../utils/textParser';
import { isPartialMatch, decomposeHangul } from '../utils/hangul';

const JAMO_TO_KEY: Record<string, { key: string; name: string; isShift?: boolean }> = {
  // Consonants (자음)
  'ㄱ': { key: 'r', name: '기역' },
  'ㄲ': { key: 'R', name: '쌍기역', isShift: true },
  'ㄴ': { key: 's', name: '니은' },
  'ㄷ': { key: 'e', name: '디귿' },
  'ㄸ': { key: 'E', name: '쌍디귿', isShift: true },
  'ㄹ': { key: 'f', name: '리을' },
  'ㅁ': { key: 'a', name: '미음' },
  'ㅂ': { key: 'q', name: '비읍' },
  'ㅃ': { key: 'Q', name: '쌍비읍', isShift: true },
  'ㅅ': { key: 't', name: '시옷' },
  'ㅆ': { key: 'T', name: '쌍시옷', isShift: true },
  'ㅇ': { key: 'd', name: '이응' },
  'ㅈ': { key: 'w', name: '지읒' },
  'ㅉ': { key: 'W', name: '쌍지읒', isShift: true },
  'ㅊ': { key: 'c', name: '치읓' },
  'ㅋ': { key: 'z', name: '키읔' },
  'ㅌ': { key: 'x', name: '티읕' },
  'ㅍ': { key: 'v', name: '피읖' },
  'ㅎ': { key: 'g', name: '히읗' },

  // Vowels (모음)
  'ㅏ': { key: 'k', name: '아' },
  'ㅐ': { key: 'o', name: '애' },
  'ㅑ': { key: 'i', name: '야' },
  'ㅒ': { key: 'O', name: '얘', isShift: true },
  'ㅓ': { key: 'j', name: '어' },
  'ㅔ': { key: 'p', name: '에' },
  'ㅕ': { key: 'u', name: '여' },
  'ㅖ': { key: 'P', name: '예', isShift: true },
  'ㅗ': { key: 'h', name: '오' },
  'ㅛ': { key: 'y', name: '요' },
  'ㅜ': { key: 'n', name: '우' },
  'ㅠ': { key: 'b', name: '유' },
  'ㅡ': { key: 'm', name: '으' },
  'ㅣ': { key: 'l', name: '이' },
};

const KEYBOARD_ROWS = [
  // Row 1
  [
    { eng: 'q', kor: 'ㅂ', korShift: 'ㅃ' },
    { eng: 'w', kor: 'ㅈ', korShift: 'ㅉ' },
    { eng: 'e', kor: 'ㄷ', korShift: 'ㄸ' },
    { eng: 'r', kor: 'ㄱ', korShift: 'ㄲ' },
    { eng: 't', kor: 'ㅅ', korShift: 'ㅆ' },
    { eng: 'y', kor: 'ㅛ', korShift: '' },
    { eng: 'u', kor: 'ㅕ', korShift: '' },
    { eng: 'i', kor: 'ㅑ', korShift: '' },
    { eng: 'o', kor: 'ㅐ', korShift: 'ㅒ' },
    { eng: 'p', kor: 'ㅔ', korShift: 'ㅖ' },
  ],
  // Row 2
  [
    { eng: 'a', kor: 'ㅁ', korShift: '' },
    { eng: 's', kor: 'ㄴ', korShift: '' },
    { eng: 'd', kor: 'ㅇ', korShift: '' },
    { eng: 'f', kor: 'ㄹ', korShift: '' },
    { eng: 'g', kor: 'ㅎ', korShift: '' },
    { eng: 'h', kor: 'ㅗ', korShift: '' },
    { eng: 'j', kor: 'ㅓ', korShift: '' },
    { eng: 'k', kor: 'ㅏ', korShift: '' },
    { eng: 'l', kor: 'ㅣ', korShift: '' },
  ],
  // Row 3
  [
    { eng: 'z', kor: 'ㅋ', korShift: '' },
    { eng: 'x', kor: 'ㅌ', korShift: '' },
    { eng: 'c', kor: 'ㅊ', korShift: '' },
    { eng: 'v', kor: 'ㅍ', korShift: '' },
    { eng: 'b', kor: 'ㅠ', korShift: '' },
    { eng: 'n', kor: 'ㅜ', korShift: '' },
    { eng: 'm', kor: 'ㅡ', korShift: '' },
  ]
];

interface ActiveKeyHint {
  char: string;
  isKorean: boolean;
  jamos: string[];
  activeIndex: number;
  activeJamo: string;
  physicalKey: string;
  isShift: boolean;
}

interface TypingSessionProps {
  userName: string;
  preset: TextPreset;
  mode: TypingMode;
  onFinishSession: (record: HistoryRecord) => void;
  onBackToDashboard: () => void;
}

export default function TypingSession({
  userName,
  preset,
  mode,
  onFinishSession,
  onBackToDashboard
}: TypingSessionProps) {
  // Parse the preset text into items depending on mode
  const rawItems = useMemo(() => parseText(preset.content, mode), [preset.content, mode]);
  
  // Active states
  const [currentIndex, setCurrentIndex] = useState(0); // Index of active word or sentence
  const [typedValue, setTypedValue] = useState(''); // Current input text
  const [totalCorrectChars, setTotalCorrectChars] = useState(0); // Cumulative correct characters
  const [correctSinceCheck, setCorrectSinceCheck] = useState(0); // Handles retroactive keystrokes
  const [keystrokes, setKeystrokes] = useState(0); // Cumulative keys pressed

  // Check if current text is Korean (using preset language or detecting Korean characters)
  const isKoreanSession = useMemo(() => {
    return preset.language === 'ko' || (preset.language === 'custom' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(preset.content));
  }, [preset]);

  // Sound, visibility and keyboard guide states
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(true);
  const [showFullTextModal, setShowFullTextModal] = useState(false); // 전체 본문 미리보기(리뷰) 모달 상태

  // Timing states
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isFocused, setIsFocused] = useState(true); // Tracks active input focus state

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active target item (word or sentence or line)
  const targetItem = rawItems[currentIndex] || '';

  // Calculate live statistics
  const stats = useMemo(() => {
    // Correct characters currently typed + cumulative correct characters from previous items
    const currentCorrect = typedValue.split('').reduce((count: number, char: string, idx: number) => {
      if (idx < targetItem.length && targetItem[idx] === char) {
        // Approximate stroke weighting: Hangul Jamo count gives real Korean CPM!
        const strokeWeight = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(char) ? decomposeHangul(char).length : 1;
        return count + strokeWeight;
      }
      return count;
    }, 0);

    return calculateStats(totalCorrectChars + currentCorrect, keystrokes, elapsedTime, isKoreanSession);
  }, [typedValue, targetItem, totalCorrectChars, keystrokes, elapsedTime, isKoreanSession]);

  // Autofocus input on load and dynamic clicks
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => stopTimer();
  }, [currentIndex]);

  // Handle focus retention
  const handleContainerClick = () => {
    if (inputRef.current && !isFinished) {
      inputRef.current.focus();
    }
  };

  const startTimer = () => {
    if (!isStarted && !isFinished) {
      setIsStarted(true);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Play dynamic mechanical click sound using Web Audio API!
   * No external sound load required - 100% offline-friendly.
   */
  const playClickSound = (isSpecialKey = false) => {
    if (!isSoundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Customize mechanical switch pitch
      if (isSpecialKey) {
        // Deeper spacebar stabilizer sound
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        // High-pitched mechanical click sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch (e) {
      console.warn('Audio synthesis was blocked or unsupported:', e);
    }
  };

  // Keep track of keystrokes and detect advancing keys (Space, Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;
    
    // Start timing on first keypress
    if (!isStarted) {
      startTimer();
    }

    const ignoredKeys = [
      'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Insert', 'Delete', 
      'Home', 'End', 'PageUp', 'PageDown', 'F1', 'F2', 'F3', 'F4', 'F5', 
      'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'AudioVolumeUp', 
      'AudioVolumeDown', 'AudioVolumeMute', 'MediaTrackNext', 'MediaTrackPrevious', 
      'MediaPlayPause'
    ];

    if (e.key === 'Space' || e.key === ' ') {
      playClickSound(true);
      setKeystrokes((prev) => prev + 1);
      // In Word Practice: Space bar completes the current word
      if (mode === 'word') {
        e.preventDefault();
        advanceItem();
      }
    } else if (e.key === 'Enter') {
      playClickSound(true);
      setKeystrokes((prev) => prev + 1);
      // Enter key completes the active phrase/word line in all modes
      e.preventDefault();
      advanceItem();
    } else if (e.key === 'Backspace') {
      playClickSound(false);
      setKeystrokes((prev) => prev + 1);
    } else if (!ignoredKeys.includes(e.key)) {
      // Standard character typed (including 'Process' from IME)
      playClickSound(false);
      setKeystrokes((prev) => prev + 1);
    }
  };

  // Direct typing comparison
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    setTypedValue(e.target.value);
  };

  // Move to the next typing item
  const advanceItem = () => {
    // Add strokes/characters typed correctly in this item to global total
    let correctCountInItem = 0;
    typedValue.split('').forEach((char: string, idx: number) => {
      if (idx < targetItem.length && targetItem[idx] === char) {
        // Multiply by Hangul Jamo decomposed count or 1 for general
        const strokeWeight = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(char) ? decomposeHangul(char).length : 1;
        correctCountInItem += strokeWeight;
      }
    });

    setTotalCorrectChars((prev) => prev + correctCountInItem);

    // Clear buffer
    setTypedValue('');

    // Check if we reached the end of the text
    const nextIdx = currentIndex + 1;
    if (nextIdx >= rawItems.length) {
      handleSessionComplete();
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  // Complete session and log results
  const handleSessionComplete = () => {
    stopTimer();
    setIsFinished(true);

    // Final statistics compilation
    // Include final remaining typed items in the cumulative correct count
    let finalCorrectInItem = 0;
    typedValue.split('').forEach((char: string, idx: number) => {
      if (idx < targetItem.length && targetItem[idx] === char) {
        const strokeWeight = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(char) ? decomposeHangul(char).length : 1;
        finalCorrectInItem += strokeWeight;
      }
    });

    const finalCorrect = totalCorrectChars + finalCorrectInItem;
    const finalStats = calculateStats(finalCorrect, keystrokes, elapsedTime);

    const record: HistoryRecord = {
      id: 'score-' + Date.now(),
      name: userName,
      date: new Date().toISOString(),
      textTitle: preset.title,
      mode: mode,
      wpm: finalStats.wpm,
      cpm: finalStats.cpm,
      accuracy: finalStats.accuracy,
      timeSpent: elapsedTime,
      completed: true
    };

    onFinishSession(record);
  };

  // Force restart test
  const handleRestart = () => {
    stopTimer();
    setCurrentIndex(0);
    setTypedValue('');
    setTotalCorrectChars(0);
    setKeystrokes(0);
    setElapsedTime(0);
    setIsStarted(false);
    setIsFinished(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Get active key hint for visual keyboard highlighting
  const activeKeyHint = useMemo<ActiveKeyHint | null>(() => {
    if (isFinished || !targetItem) return null;

    let activeIndexInItem = typedValue.length;
    let isComposing = false;

    // Check if the character they just typed is a partial match but not equal
    if (typedValue.length > 0) {
      const lastTypedIdx = typedValue.length - 1;
      const targetChar = targetItem[lastTypedIdx];
      const typedChar = typedValue[lastTypedIdx];
      if (targetChar !== typedChar && isPartialMatch(targetChar, typedChar)) {
        activeIndexInItem = lastTypedIdx;
        isComposing = true;
      }
    }

    if (activeIndexInItem >= targetItem.length) {
      // All characters typed, waiting for Space/Enter
      return {
        char: mode === 'word' ? 'Space' : 'Enter',
        isKorean: false,
        jamos: [],
        activeIndex: 0,
        activeJamo: mode === 'word' ? 'Space' : 'Enter',
        physicalKey: mode === 'word' ? 'space' : 'enter',
        isShift: false
      };
    }

    const targetChar = targetItem[activeIndexInItem];
    
    if (targetChar === ' ') {
      return {
        char: 'Space',
        isKorean: false,
        jamos: [' '],
        activeIndex: 0,
        activeJamo: 'Space',
        physicalKey: 'space',
        isShift: false
      };
    }

    const isKor = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(targetChar);

    if (isKor) {
      const jamos = decomposeHangul(targetChar);
      let activeJamoIdx = 0;

      if (isComposing) {
        const typedChar = typedValue[activeIndexInItem];
        const typedJamos = decomposeHangul(typedChar);
        // The next Jamo they need is at the index of how many Jamos they've already completed
        activeJamoIdx = typedJamos.length;
        if (activeJamoIdx >= jamos.length) {
          activeJamoIdx = jamos.length - 1; // Fallback safety
        }
      }

      const activeJamo = jamos[activeJamoIdx] || '';
      const keyInfo = JAMO_TO_KEY[activeJamo] || { key: activeJamo.toLowerCase(), name: activeJamo };

      return {
        char: targetChar,
        isKorean: true,
        jamos,
        activeIndex: activeJamoIdx,
        activeJamo,
        physicalKey: keyInfo.key,
        isShift: !!keyInfo.isShift
      };
    } else {
      // English or symbols
      const isUpper = targetChar === targetChar.toUpperCase() && targetChar !== targetChar.toLowerCase();
      return {
        char: targetChar,
        isKorean: false,
        jamos: [targetChar],
        activeIndex: 0,
        activeJamo: targetChar,
        physicalKey: targetChar.toLowerCase(),
        isShift: isUpper
      };
    }
  }, [typedValue, targetItem, isFinished, mode]);

  /**
   * Render single target character with constant width and zero layout shift
   */
  const renderCharacter = (char: string, index: number) => {
    const isTyped = index < typedValue.length;
    const typedChar = typedValue[index];
    const isActiveIndex = index === typedValue.length;

    // Strict geometry stability: constant border, constant padding across all states
    let statusClass = 'text-slate-400 border-b-2 border-transparent';

    if (isTyped) {
      if (char === typedChar) {
        statusClass = 'text-emerald-600 font-bold border-b-2 border-transparent bg-emerald-50/70';
      } else {
        const isComp = isPartialMatch(char, typedChar);
        if (isComp) {
          statusClass = 'text-amber-600 font-bold border-b-2 border-amber-400 bg-amber-50/80';
        } else {
          statusClass = 'text-rose-600 font-bold border-b-2 border-rose-500 bg-rose-50/80';
        }
      }
    } else if (isActiveIndex) {
      statusClass = 'text-blue-600 font-extrabold border-b-2 border-blue-600 bg-blue-50/90';
    }

    const displayChar = char === ' ' 
      ? (isActiveIndex ? '␣' : '\u00A0') 
      : char;

    return (
      <span 
        key={index} 
        className={`inline-block text-center select-none font-mono transition-colors duration-75 rounded-xs ${statusClass} ${
          mode === 'word' 
            ? 'text-2xl sm:text-4xl md:text-5xl px-0.5 min-w-[0.7em]' 
            : 'text-base sm:text-lg md:text-xl min-w-[0.62em] leading-normal'
        }`} 
        id={`char-${currentIndex}-${index}`}
      >
        {displayChar}
      </span>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-10 animate-fade-in">
      
      {/* Session Header (Responsive on PC, Tablet, and Mobile) */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button 
            onClick={onBackToDashboard}
            className="p-2 sm:p-2.5 border border-slate-200 hover:border-slate-300 bg-white rounded-xl text-slate-500 hover:text-slate-900 transition duration-150 cursor-pointer shadow-xs shrink-0"
            title="대시보드로 나가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate max-w-[170px] sm:max-w-md">
                {preset.title}
              </h3>
              <span className="text-[10px] uppercase font-extrabold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md shrink-0">
                {mode === 'word' ? '단어 연습' : mode === 'sentence' ? '문장 연습' : '긴 글 연습'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              진행: <span className="font-mono font-bold text-blue-600">{currentIndex + 1}</span> / {rawItems.length} {mode === 'word' ? '단어' : mode === 'sentence' ? '문장' : '문맥'}
            </p>
          </div>
        </div>

        {/* Floating Session Options */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Full Text Preview (리뷰보기) Button */}
          <button
            onClick={() => setShowFullTextModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer shadow-2xs text-xs font-bold"
            title="연습 본문 전체 미리보기 및 리뷰"
            id="btn-fulltext-preview"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">본문 미리보기</span>
          </button>

          {/* Quick Result Review (결과 리뷰) Button */}
          {isStarted && (
            <button
              onClick={handleSessionComplete}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shadow-2xs text-xs font-bold"
              title="지금까지 작성한 기록으로 결과 리뷰 보기"
              id="btn-finish-review"
            >
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">결과 리뷰</span>
            </button>
          )}

          {/* Keyboard visual guide toggle */}
          <button
            onClick={() => setShowKeyboardGuide(!showKeyboardGuide)}
            className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer ${
              showKeyboardGuide 
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-xs' 
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title={showKeyboardGuide ? "자판 가이드 끄기 (화면 넓게 보기)" : "자판 가이드 켜기 (손가락 위치 안내)"}
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Sounds toggle */}
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer ${
              isSoundOn 
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-xs' 
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title={isSoundOn ? "키보드 소리 켜짐" : "소리 꺼짐"}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Distraction free toggle */}
          <button
            onClick={() => setIsDistractionFree(!isDistractionFree)}
            className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer ${
              isDistractionFree 
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-xs'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title={isDistractionFree ? "집중 모드 켜짐" : "집중 모드 꺼짐"}
          >
            {isDistractionFree ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition duration-150 cursor-pointer shadow-xs"
            title="다시 시작"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Telemetry Display (Fades out when in Distraction Free) */}
      {!isDistractionFree && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 -mt-1" id="live-telemetry">
          <div className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-center shadow-xs">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">속도 (WPM)</span>
            <span className="text-xl font-extrabold font-mono text-blue-600 block mt-0.5 leading-none">{stats.wpm}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-center shadow-xs">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">타수 (CPM)</span>
            <span className="text-xl font-extrabold font-mono text-emerald-600 block mt-0.5 leading-none">{stats.cpm}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-center shadow-xs">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">정확도 (Acc)</span>
            <span className="text-xl font-extrabold font-mono text-amber-600 block mt-0.5 leading-none">{stats.accuracy}%</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-center shadow-xs">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">진행 시간</span>
            <span className="text-xl font-extrabold font-mono text-slate-800 block mt-0.5 leading-none">
              {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Main Touch/Click workspace wrapper focusing the typing engine */}
      <div 
        onClick={handleContainerClick}
        className="relative bg-white border border-slate-200 rounded-2xl p-3 md:py-3.5 md:px-5 hover:border-slate-300 transition duration-250 cursor-text overflow-hidden shadow-xs -mt-1"
        id="typing-playfield"
      >
        
        {/* Absolute Background Guide Message on non-started session */}
        {!isStarted && (
          <div className="absolute top-2 right-4 flex items-center gap-1.5 text-[10px] text-slate-600 font-bold bg-slate-50 px-2.5 py-0.5 rounded-full animate-pulse border border-slate-200 shadow-xs">
            <Keyboard className="w-3.5 h-3.5 text-blue-500" /> 글쇠를 입력하여 타자 연습을 시작하세요!
          </div>
        )}

        {/* 3-LINE RENDERING DESIGN FOR GENERAL MODES */}
        <div className="space-y-3">
          
          {/* Previous sentence / line (faded) - only for Multi-sentence structures */}
          {mode !== 'word' && currentIndex > 0 && (
            <div className="text-slate-300 line-clamp-1 font-mono text-xs md:text-sm select-none">
              {rawItems[currentIndex - 1]}
            </div>
          )}

          {/* ACTIVE TARGET TYPING CONTAINER */}
          <div className="space-y-3">
            {/* 1. 예시 글 (Fixed Example Text on Top) */}
            <div className="bg-slate-50/60 py-2.5 px-4 rounded-xl border border-slate-200/80">
              <p className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5 select-none flex items-center justify-between">
                <span>연습 예시 글 (Target Text)</span>
                {mode !== 'word' && (
                  <span className="text-[8px] lowercase font-semibold text-slate-450 normal-case bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <CornerDownLeft className="w-2.5 h-2.5" /> 한 행 입력을 마친 뒤 Enter 키를 누르고 다음 줄로 이동하세요.
                  </span>
                )}
              </p>
              {/* Target Text Display with Stable Word-Wrapped Layout */}
              <div className={`leading-relaxed font-mono text-slate-800 select-none w-full max-w-full ${
                mode === 'word' 
                  ? 'flex justify-center items-center py-2 flex-wrap gap-0.5' 
                  : 'flex flex-wrap items-baseline gap-x-2 gap-y-2 text-base sm:text-lg md:text-xl'
              }`}>
                {mode === 'word' ? (
                  targetItem.split('').map((char: string, index: number) => renderCharacter(char, index))
                ) : (
                  (() => {
                    let globalCharIdx = 0;
                    const words = targetItem.split(' ');
                    return words.map((word, wordIdx) => {
                      const wordChars = word.split('');
                      const charElements = wordChars.map((char) => {
                        const el = renderCharacter(char, globalCharIdx);
                        globalCharIdx++;
                        return el;
                      });

                      let spaceElement = null;
                      if (wordIdx < words.length - 1) {
                        spaceElement = renderCharacter(' ', globalCharIdx);
                        globalCharIdx++;
                      }

                      return (
                        <span key={wordIdx} className="inline-flex items-baseline whitespace-nowrap">
                          {charElements}
                          {spaceElement}
                        </span>
                      );
                    });
                  })()
                )}
                
                {/* Enter icon at end of sentence */}
                {mode !== 'word' && (
                  <span 
                    className={`inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors shrink-0 select-none ${
                      typedValue.length >= targetItem.length
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs animate-pulse'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                    title="줄바꿈 (Enter)"
                  >
                    <CornerDownLeft className="w-2.5 h-2.5 stroke-[2.5]" /> Enter ↵
                  </span>
                )}
              </div>

              {/* Upcoming words indicator for word mode */}
              {mode === 'word' && (
                <div className="border-t border-slate-200/70 mt-2 pt-1.5 flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] font-semibold select-none">
                  <span className="text-slate-400 uppercase tracking-widest text-[8px] font-extrabold">다음 단어 대기열 (Next Queue)</span>
                  <div className="flex items-center gap-1 overflow-hidden max-w-full">
                    {rawItems.slice(currentIndex + 1, currentIndex + 5).map((word, idx) => (
                      <span 
                        key={idx} 
                        className={`px-2 py-0.5 rounded border text-[11px] font-semibold font-mono transition duration-150 ${
                          idx === 0 
                            ? 'bg-blue-50 text-blue-600 border-blue-200/70 font-bold' 
                            : 'bg-slate-100/40 text-slate-400 border-slate-200/50'
                        }`}
                      >
                        {word}
                      </span>
                    ))}
                    {rawItems.length > currentIndex + 5 && (
                      <span className="text-slate-350 tracking-wider">...</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. 내가 입력하는 글 (Visible real-time input field) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase select-none">나의 입력 창 (Type Here)</p>
                {/* On last sentence or complete */}
                {currentIndex === rawItems.length - 1 && typedValue.length >= targetItem.length && (
                  <span className="text-[10px] font-bold text-emerald-600 animate-pulse flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" /> 모든 입력 완료! Enter 키로 결과를 확인하세요.
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  ref={inputRef}
                  value={typedValue}
                  onKeyDown={handleKeyDown}
                  onChange={handleInputChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isFinished}
                  placeholder={mode === 'word' ? "단어를 입력한 뒤 Space 키를 누르세요." : "위 문장을 똑같이 입력한 뒤 Enter 키를 누르세요."}
                  className="w-full pl-3.5 pr-20 py-2.5 bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm md:text-base font-mono text-slate-800 placeholder:text-slate-400 outline-hidden shadow-2xs transition-colors duration-150"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                
                {/* Inline Enter / Space Keyboard Guide Key inside the input box */}
                <div className="absolute right-2.5 flex items-center gap-1.5 select-none pointer-events-none">
                  {mode === 'word' ? (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                      typedValue.length >= targetItem.length
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      Space
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors ${
                      typedValue.length >= targetItem.length
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs font-sans'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      <CornerDownLeft className="w-3 h-3 stroke-[2.5]" /> Enter ↵
                    </span>
                  )}
                </div>
              </div>

              {/* Completion Action Banner on Last Item */}
              {currentIndex === rawItems.length - 1 && typedValue.length >= targetItem.length && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>모든 연습을 완주하셨습니다! 결과를 확인해 보세요.</span>
                  </div>
                  <button
                    onClick={handleSessionComplete}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition"
                    id="btn-complete-and-review"
                  >
                    <span>결과 리뷰 보기</span>
                    <span className="text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded font-mono">Enter ↵</span>
                  </button>
                </div>
              )}
            </div>

            {/* Translation description / hint area if matched standard layout */}
            <div className="text-xs text-indigo-600 font-semibold tracking-wide flex items-center gap-1 pt-0">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
              {/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(targetItem) ? '한국어 글쇠 연습 (Korean Input Mode)' : '영어 글쇠 연습 (English Input Mode)'}
            </div>
          </div>

          {/* Upcoming sentence / line (faded) - only for Multi-sentence structures */}
          {mode !== 'word' && currentIndex < rawItems.length - 1 && (
            <div className="text-slate-350 line-clamp-1 font-mono text-sm md:text-base select-none">
              {rawItems[currentIndex + 1]}
            </div>
          )}
        </div>

        {/* Keyboard Visual Guide for Key positions (Collapsible on mobile/tablet) */}
        {showKeyboardGuide && (
          <div className="border-t border-slate-100 mt-4 sm:mt-5 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-blue-500" />
                {mode === 'word' ? '단어 자판 가이드 (Spacebar / Enter 입력 후 다음)' : '문장 자판 가이드 (문장 끝까지 입력 후 Enter)'}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>한영 자판 변환: Alt / Command + Space</span>
              </div>
            </div>

          {/* Interactive Keyboard Layout */}
          {activeKeyHint && (
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3 md:p-4.5 space-y-3 select-none shadow-xs transition duration-200 animate-fade-in">
              {/* Active character guide details above keyboard */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-2 gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">현재 입력 중</span>
                  <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-xl border border-blue-100 shadow-2xs">
                    {activeKeyHint.char === 'Space' ? 'Space' : activeKeyHint.char}
                  </span>
                  
                  {activeKeyHint.isKorean && (
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50/60 px-2 py-0.5 rounded-lg border border-indigo-100/40">
                      한글 2벌식 모드
                    </span>
                  )}
                </div>
                
                {activeKeyHint.isKorean && activeKeyHint.jamos.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-extrabold uppercase tracking-widest text-[9px] mr-1">입력 순서:</span>
                    {activeKeyHint.jamos.map((jm, i) => {
                      const isActive = i === activeKeyHint.activeIndex;
                      const isCompleted = i < activeKeyHint.activeIndex;
                      return (
                        <div key={i} className="flex items-center gap-1">
                          <span 
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition duration-150 flex items-center gap-1 ${
                              isActive 
                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 animate-pulse' 
                                : isCompleted 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 line-through opacity-70' 
                                  : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                          >
                            <span>{jm}</span>
                            <span className="text-[9px] font-mono opacity-80">({JAMO_TO_KEY[jm]?.key.toUpperCase() || jm})</span>
                          </span>
                          {i < activeKeyHint.jamos.length - 1 && (
                            <span className="text-slate-300">➔</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!activeKeyHint.isKorean && activeKeyHint.char !== 'Space' && activeKeyHint.char !== 'Enter' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-extrabold uppercase tracking-widest text-[9px] mr-1">눌러야 할 키:</span>
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm font-mono">
                      {activeKeyHint.isShift ? 'Shift + ' : ''}{activeKeyHint.physicalKey.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Rows with mobile horizontal scroll safeguard */}
              <div className="overflow-x-auto scrollbar-hidden max-w-full pb-1">
                <div className="space-y-1 sm:space-y-1.5 font-sans min-w-[320px] max-w-xl mx-auto">
                {/* Row 1 */}
                <div className="flex justify-center gap-1 sm:gap-1.5">
                  {KEYBOARD_ROWS[0].map((key) => {
                    const active = activeKeyHint.physicalKey.toLowerCase() === key.eng;
                    return (
                      <div 
                        key={key.eng}
                        className={`relative flex flex-col items-center justify-center w-7 h-8 sm:w-10 sm:h-10 rounded-lg border font-bold transition-all ${
                          active 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md scale-105 ring-4 ring-indigo-200 z-10' 
                            : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-1 text-[8px] uppercase font-mono ${active ? 'text-indigo-200/90' : 'text-slate-400'}`}>
                          {key.eng}
                        </span>
                        <span className="text-xs sm:text-sm mt-1">
                          {activeKeyHint.isKorean ? (activeKeyHint.isShift && key.korShift ? key.korShift : key.kor) : key.eng.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Row 2 */}
                <div className="flex justify-center gap-1 sm:gap-1.5 pl-3 sm:pl-5">
                  {KEYBOARD_ROWS[1].map((key) => {
                    const active = activeKeyHint.physicalKey.toLowerCase() === key.eng;
                    return (
                      <div 
                        key={key.eng}
                        className={`relative flex flex-col items-center justify-center w-7 h-8 sm:w-10 sm:h-10 rounded-lg border font-bold transition-all ${
                          active 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md scale-105 ring-4 ring-indigo-200 z-10' 
                            : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-1 text-[8px] uppercase font-mono ${active ? 'text-indigo-200/90' : 'text-slate-400'}`}>
                          {key.eng}
                        </span>
                        <span className="text-xs sm:text-sm mt-1">
                          {activeKeyHint.isKorean ? key.kor : key.eng.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Row 3 */}
                <div className="flex justify-center gap-1 sm:gap-1.5">
                  {/* Left Shift */}
                  <div className={`flex items-center justify-center px-1.5 sm:px-3 h-8 sm:h-10 rounded-lg border text-[9px] sm:text-xs font-bold transition-all ${
                    activeKeyHint.isShift 
                      ? 'bg-amber-500 border-amber-400 text-white shadow-sm ring-2 ring-amber-200 animate-pulse font-sans' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    Shift ⇧
                  </div>

                  {KEYBOARD_ROWS[2].map((key) => {
                    const active = activeKeyHint.physicalKey.toLowerCase() === key.eng;
                    return (
                      <div 
                        key={key.eng}
                        className={`relative flex flex-col items-center justify-center w-7 h-8 sm:w-10 sm:h-10 rounded-lg border font-bold transition-all ${
                          active 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md scale-105 ring-4 ring-indigo-200 z-10' 
                            : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-1 text-[8px] uppercase font-mono ${active ? 'text-indigo-200/90' : 'text-slate-400'}`}>
                          {key.eng}
                        </span>
                        <span className="text-xs sm:text-sm mt-1">
                          {activeKeyHint.isKorean ? key.kor : key.eng.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}

                  {/* Right Shift */}
                  <div className={`flex items-center justify-center px-1.5 sm:px-3 h-8 sm:h-10 rounded-lg border text-[9px] sm:text-xs font-bold transition-all ${
                    activeKeyHint.isShift 
                      ? 'bg-amber-500 border-amber-400 text-white shadow-sm ring-2 ring-amber-200 animate-pulse font-sans' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    Shift ⇧
                  </div>
                </div>

                {/* Row 4 (Space, Enter) */}
                <div className="flex justify-center gap-1 sm:gap-1.5">
                  {/* Space bar */}
                  <div className={`flex items-center justify-center w-28 sm:w-44 h-8 sm:h-10 rounded-lg border text-[10px] sm:text-xs font-bold transition-all ${
                    activeKeyHint.physicalKey.toLowerCase() === 'space'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md scale-[1.02] ring-4 ring-indigo-200 z-10' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    Spacebar ␣
                  </div>

                  {/* Enter key */}
                  <div className={`flex items-center justify-center w-16 sm:w-24 h-8 sm:h-10 rounded-lg border text-[10px] sm:text-xs font-bold transition-all ${
                    activeKeyHint.physicalKey.toLowerCase() === 'enter'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md scale-[1.02] ring-4 ring-emerald-200 z-10 animate-pulse' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    Enter ↵
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>

      {/* Focus Rescue Modal: triggered when typing window loses focus */}
      {!isFocused && isStarted && !isFinished && (
        <div 
          onClick={handleContainerClick}
          className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs animate-fade-in"
        >
          <span className="text-xs text-amber-800 text-left leading-relaxed">
            ⚠️ <strong>포커스가 유실되었습니다!</strong> 입력 창을 다시 활성화하려면 위 <strong>&ldquo;타자연습 박스&rdquo;</strong> 또는 오른쪽 복구 버튼을 클릭하세요.
          </span>
          <button 
            onClick={handleContainerClick}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer shadow-xs transition"
          >
            포커스 복구하기
          </button>
        </div>
      )}

      {/* Full Text Review Modal (본문 전체 미리보기 및 리뷰) */}
      {showFullTextModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {preset.title}
                </h3>
              </div>
              <button
                onClick={() => setShowFullTextModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
              <span>총 {rawItems.length} {mode === 'word' ? '단어' : '문장'} 구성</span>
              <span className="font-bold text-blue-600">현재 연습 진행: {currentIndex + 1} / {rawItems.length}</span>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {preset.description || '이 연습의 전체 문장 목록입니다. 현재 연습 위치가 파란색으로 강조됩니다.'}
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs sm:text-sm text-slate-800 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-200/60 leading-relaxed max-h-72">
              {rawItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-xl border transition ${
                    idx === currentIndex 
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs' 
                      : idx < currentIndex 
                        ? 'bg-white border-slate-200/50 text-slate-400 line-through opacity-70' 
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-sans font-bold text-slate-400 mr-2">{idx + 1}.</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowFullTextModal(false);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-xs"
              >
                닫고 타자 연습 계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
