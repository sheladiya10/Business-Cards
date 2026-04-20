/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, Scan, BookOpen, Target, AlertTriangle, ExternalLink } from 'lucide-react';
import { ExploreView } from './components/explore/ExploreView';
import { ScannerView } from './components/scanner/ScannerView';
import { ExperienceView } from './components/visits/ExperienceView';
import { ProjectsView } from './components/projects/ProjectsView';
import { dbError } from './lib/db';

export type ViewType = 'explore' | 'scan' | 'experience' | 'strategy';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('explore');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Check if we are in an iframe and storage might be blocked
    const checkStorage = async () => {
      try {
        localStorage.setItem('__storage_test__', 'test');
        localStorage.removeItem('__storage_test__');
        
        // If dbError is already set, it means Dexie failed
        if (dbError) setIsBlocked(true);
      } catch (e) {
        setIsBlocked(true);
      }
    };
    checkStorage();

    const handleRejection = (event: PromiseRejectionEvent) => {
      // Catch specific errors that are objects but reported as [object Object]
      if (event.reason && typeof event.reason === 'object' && !event.reason.message) {
        console.error('Captured Object Rejection:', JSON.stringify(event.reason));
      }
    };
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  const renderView = () => {
    if (isBlocked && (currentView === 'scan' || currentView === 'experience' || currentView === 'strategy')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-text-main uppercase">Storage Restricted</h3>
            <p className="text-[11px] text-text-muted font-bold leading-relaxed">
              Your browser's privacy settings are preventing this app from saving data inside the iframe.
            </p>
          </div>
          <button 
            onClick={() => window.open(window.location.href, '_blank')}
            className="w-full bg-primary py-4 rounded-xl text-surface font-extrabold text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <ExternalLink className="w-5 h-5" /> Open Full Application
          </button>
          <p className="text-[9px] text-text-muted italic">Opening in a new tab bypasses iframe security restrictions.</p>
        </div>
      );
    }

    switch (currentView) {
      case 'explore': return <ExploreView />;
      case 'scan': return <ScannerView />;
      case 'experience': return <ExperienceView />;
      case 'strategy': return <ProjectsView />;
      default: return <ExploreView />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border-theme px-4 py-4">
        {isBlocked && (
          <div className="max-w-md mx-auto mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-amber-700 leading-tight">
                Browser is blocking local storage. This usually happens in private mode or when "Prevent Cross-Site Tracking" is enabled.
              </p>
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
              >
                <ExternalLink className="w-3 h-3" /> Open in New Tab
              </button>
            </div>
          </div>
        )}
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight text-primary">TAGMA 2026 AI</h1>
            <p className="text-[8px] font-bold text-text-muted mt-[-2px]">Made With ❤️ by Pratik Sheladiya</p>
          </div>
          <div className="flex items-center gap-1.5">
             <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Live</div>
             <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-28 max-w-md mx-auto px-4 min-h-screen">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-theme shadow-lg shadow-black/5">
        <div className="max-w-md mx-auto flex items-center justify-around py-3 px-1">
          <button 
            onClick={() => setCurrentView('explore')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'explore' ? 'text-primary scale-110' : 'text-text-muted'}`}
          >
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Explore</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('scan')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'scan' ? 'text-primary scale-110' : 'text-text-muted'}`}
          >
            <div className="relative">
              <Scan className="w-6 h-6" />
              {currentView !== 'scan' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Scan</span>
          </button>

          <button 
            onClick={() => setCurrentView('strategy')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'strategy' ? 'text-primary scale-110' : 'text-text-muted'}`}
          >
            <Target className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Strategy</span>
          </button>

          <button 
            onClick={() => setCurrentView('experience')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'experience' ? 'text-primary scale-110' : 'text-text-muted'}`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Journal</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
