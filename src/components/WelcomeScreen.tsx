import React, { useState } from 'react';
import { Keyboard, ArrowRight, Globe, Cloud, CheckCircle2 } from 'lucide-react';

interface WelcomeScreenProps {
  onNameSubmit: (name: string) => void;
  onGoogleSignIn: () => Promise<void>;
  isLoading?: boolean;
}

export default function WelcomeScreen({ onNameSubmit, onGoogleSignIn, isLoading = false }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름 또는 닉네임을 꼭 입력해 주세요!');
      return;
    }
    if (name.trim().length > 15) {
      setError('이름은 15자 이내로 입력해 주세요.');
      return;
    }
    onNameSubmit(name.trim());
  };

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      setError('');
      await onGoogleSignIn();
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      setError('구글 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 animate-fade-in" id="welcome-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden space-y-7">
        
        {/* Glow Deco */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 bg-blue-600/10 text-blue-600 rounded-2xl border border-blue-500/10">
            <Keyboard className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              오's 타자 연습
            </h1>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" /> 언어 타자 튜터
            </p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
            크롬 프로필 구글 계정으로 로그인하면 언제 어디서든 학생별 타자 기록이 안전하게 저장됩니다.
          </p>
        </div>

        {/* Primary Action: Google Sign In */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isSigningIn || isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-bold rounded-2xl shadow-sm transition duration-150 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            id="google-login-btn"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">
              {isSigningIn || isLoading ? '로그인 중...' : 'Google 계정으로 로그인'}
            </span>
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Cloud className="w-3.5 h-3.5 text-blue-600" />
            <span>크롬 프로필로 원클릭 로그인 & 기록 클라우드 동기화</span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative">
            또는 이름만 입력하여 시작
          </span>
        </div>

        {/* Guest Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 tracking-wide uppercase block">
              학생 이름 또는 닉네임 (게스트 모드)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="예: 김철수, Anna, John..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:outline-hidden text-sm text-center text-slate-900 font-semibold placeholder:text-slate-400 rounded-2xl transition duration-150"
            />
            {error && (
              <p className="text-xs text-red-600 font-semibold text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>게스트로 시작하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Features Checklist */}
        <div className="border-t border-slate-100 pt-5 space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest block text-center">
            학급 수업 특화 기능
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600" id="welcome-features">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>크롬 프로필 연동</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>클라우드 기록 보관</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>오프라인 환경 지원</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>선생님 TXT 파일 등록</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
