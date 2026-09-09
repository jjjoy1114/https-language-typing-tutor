import React, { useState, useEffect } from 'react';
import { Keyboard, LogOut, Globe, User as UserIcon, Cloud, CheckCircle2, LogIn } from 'lucide-react';
import { HistoryRecord, TextPreset, TypingMode } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import TypingSession from './components/TypingSession';
import ResultSummary from './components/ResultSummary';
import { 
  auth, 
  onAuthStateChanged, 
  loginWithGoogle, 
  logoutUser, 
  syncUserProfile, 
  saveRecordToCloud, 
  fetchUserRecordsFromCloud, 
  savePresetToCloud, 
  fetchUserPresetsFromCloud, 
  deletePresetFromCloud,
  User
} from './lib/firebase';

export default function App() {
  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  
  // Navigation
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'dashboard' | 'session' | 'result'>('welcome');
  
  // History lists and custom texts backing
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [customPresets, setCustomPresets] = useState<TextPreset[]>([]);

  // Active workout parameters
  const [activePreset, setActivePreset] = useState<TextPreset | null>(null);
  const [activeMode, setActiveMode] = useState<TypingMode>('sentence');
  const [latestRecord, setLatestRecord] = useState<HistoryRecord | null>(null);

  // Initialize and load saved setups on boot
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('lingotype-username');
      const savedHistory = localStorage.getItem('lingotype-history');
      const savedCustom = localStorage.getItem('lingotype-custom-presets');

      if (savedName) {
        setUserName(savedName);
        setCurrentScreen('dashboard');
      }

      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      if (savedCustom) {
        setCustomPresets(JSON.parse(savedCustom));
      }
    } catch (e) {
      console.error('Error recovering state from LocalStorage:', e);
    }
  }, []);

  // Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        const displayName = user.displayName || user.email?.split('@')[0] || '학생';
        setUserName(displayName);
        localStorage.setItem('lingotype-username', displayName);
        setCurrentScreen('dashboard');

        // Sync user profile to Firestore
        try {
          await syncUserProfile(user);

          // Fetch cloud records & sync with local
          const cloudRecords = await fetchUserRecordsFromCloud(user.uid);
          if (cloudRecords && cloudRecords.length > 0) {
            setHistory(cloudRecords);
            localStorage.setItem('lingotype-history', JSON.stringify(cloudRecords));
          } else {
            // If user has local records, back them up to Firestore
            const localSaved = localStorage.getItem('lingotype-history');
            if (localSaved) {
              const parsed: HistoryRecord[] = JSON.parse(localSaved);
              for (const r of parsed.slice(0, 20)) {
                await saveRecordToCloud(user.uid, r).catch(console.error);
              }
            }
          }

          // Fetch cloud custom presets
          const cloudPresets = await fetchUserPresetsFromCloud(user.uid);
          if (cloudPresets && cloudPresets.length > 0) {
            setCustomPresets(cloudPresets);
            localStorage.setItem('lingotype-custom-presets', JSON.stringify(cloudPresets));
          }

          setIsCloudSynced(true);
        } catch (err) {
          console.error('Error syncing cloud data:', err);
        }
      } else {
        setCurrentUser(null);
        setIsCloudSynced(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Set brand username (Guest mode)
  const handleNameSubmit = (name: string) => {
    setUserName(name);
    localStorage.setItem('lingotype-username', name);
    setCurrentScreen('dashboard');
  };

  // Sign out (Google Auth or Guest Profile)
  const handleSignOut = async () => {
    const confirmMessage = currentUser
      ? `${userName} 계정에서 로그아웃하시겠습니까?`
      : '이름을 변경하시겠습니까? (이전 타자 연습 기록은 안전하게 유지됩니다)';

    if (confirm(confirmMessage)) {
      if (currentUser) {
        await logoutUser();
      }
      localStorage.removeItem('lingotype-username');
      setUserName('');
      setCurrentScreen('welcome');
      setIsCloudSynced(false);
    }
  };

  // Add Custom Preset TXT
  const handleAddCustomPreset = async (preset: TextPreset) => {
    const updated = [preset, ...customPresets];
    setCustomPresets(updated);
    localStorage.setItem('lingotype-custom-presets', JSON.stringify(updated));

    if (currentUser) {
      try {
        await savePresetToCloud(currentUser.uid, preset);
      } catch (err) {
        console.error('Cloud preset save failed:', err);
      }
    }
  };

  // Remove Custom Preset
  const handleDeleteCustomPreset = async (id: string) => {
    const filtered = customPresets.filter((p) => p.id !== id);
    setCustomPresets(filtered);
    localStorage.setItem('lingotype-custom-presets', JSON.stringify(filtered));

    if (currentUser) {
      try {
        await deletePresetFromCloud(currentUser.uid, id);
      } catch (err) {
        console.error('Cloud preset delete failed:', err);
      }
    }
  };

  // Start active training session
  const handleStartSession = (preset: TextPreset, mode: TypingMode) => {
    setActivePreset(preset);
    setActiveMode(mode);
    setCurrentScreen('session');
  };

  // Complete session and accumulate scoreboard
  const handleFinishSession = async (record: HistoryRecord) => {
    const updatedHistory = [record, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('lingotype-history', JSON.stringify(updatedHistory));
    setLatestRecord(record);
    setCurrentScreen('result');

    // Save to Cloud if logged in
    if (currentUser) {
      try {
        await saveRecordToCloud(currentUser.uid, record);
      } catch (err) {
        console.error('Failed to sync record to cloud:', err);
      }
    }
  };

  // Clear overall achievements log
  const handleClearHistory = () => {
    if (confirm('정말로 모든 타자 기록 내역을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없으며 로컬 기록 데이터가 초기화됩니다.')) {
      setHistory([]);
      localStorage.removeItem('lingotype-history');
    }
  };

  // Retry currently finished preset
  const handleRetry = () => {
    if (activePreset) {
      setCurrentScreen('session');
    }
  };

  // Return back to list
  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-900">
      
      {/* Interactive Top Header Rail */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
          
          <div 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer selection:bg-transparent"
          >
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/10">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">오's 타자 연습</span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-blue-500/10 border border-blue-500/30 text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                  PWA
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold tracking-wide">Language Typing Tutor</span>
            </div>
          </div>

          {/* User profile section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5 animate-fade-in" id="header-user-panel">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={userName}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {userName.charAt(0)}
                  </div>
                )}
                
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs text-slate-800 font-bold flex items-center gap-1 justify-end">
                    {userName}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>구글 클라우드 연동</span>
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition duration-150 cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : userName ? (
              <div className="flex items-center gap-2.5 animate-fade-in">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs text-slate-700 font-semibold flex items-center gap-1 justify-end">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" /> {userName}님 (게스트)
                  </span>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition duration-150 cursor-pointer"
                  title="Google 계정으로 로그인하여 기록 동기화"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                  <span className="hidden md:inline">Google 로그인</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition duration-150 cursor-pointer"
                  title="이름 변경"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col justify-start">
        {currentScreen === 'welcome' && (
          <WelcomeScreen 
            onNameSubmit={handleNameSubmit} 
            onGoogleSignIn={handleGoogleSignIn}
            isLoading={authLoading}
          />
        )}

        {currentScreen === 'dashboard' && (
          <Dashboard
            userName={userName}
            history={history}
            onClearHistory={handleClearHistory}
            customPresets={customPresets}
            onAddCustomPreset={handleAddCustomPreset}
            onDeleteCustomPreset={handleDeleteCustomPreset}
            onStartSession={handleStartSession}
            currentUser={currentUser}
            onLoginWithGoogle={handleGoogleSignIn}
          />
        )}

        {currentScreen === 'session' && activePreset && (
          <TypingSession
            userName={userName}
            preset={activePreset}
            mode={activeMode}
            onFinishSession={handleFinishSession}
            onBackToDashboard={handleBackToDashboard}
          />
        )}

        {currentScreen === 'result' && latestRecord && (
          <ResultSummary
            userName={userName}
            record={latestRecord}
            onRetry={handleRetry}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
      </main>

      {/* Elegant minimalist footer */}
      <footer className="border-t border-slate-200 bg-white py-5 sm:py-6 text-center text-slate-500 text-xs font-semibold tracking-wide">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 오's 타자 연습. Google Firebase Cloud & Offline PWA 지원.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1 text-slate-600">
              <Globe className="w-3.5 h-3.5" /> 한국어 및 영어 지원
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <Cloud className="w-3.5 h-3.5" /> 클라우드 영구 저장
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
