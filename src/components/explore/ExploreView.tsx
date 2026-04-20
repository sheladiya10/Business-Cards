/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Search, MapPin, Info, ArrowRight, Loader2, Sparkles, Building2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EXHIBITORS, type Exhibitor } from '../../constants/exhibitors';
import { aiService, type CompanyDetails } from '../../services/aiService';

export function ExploreView() {
  const [search, setSearch] = useState('');
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [details, setDetails] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [searchingAi, setSearchingAi] = useState(false);

  const filteredExhibitors = useMemo(() => {
    if (!search) return EXHIBITORS;
    const lowerSearch = search.toLowerCase();
    const matches = EXHIBITORS.filter(e => 
      e.name.toLowerCase().includes(lowerSearch) || 
      e.hall.toLowerCase().includes(lowerSearch)
    );
    return matches;
  }, [search]);

  // If the user explicitly searched for a name that isn't in the filtered list,
  // we check if we should offer a "Virtual Discovery"
  const showVirtualOption = useMemo(() => {
    if (!search || search.length < 3) return false;
    // Don't show if we have exact or very close matches
    const hasExactMatch = EXHIBITORS.some(e => e.name.toLowerCase() === search.toLowerCase());
    return !hasExactMatch && filteredExhibitors.length < 5;
  }, [search, filteredExhibitors]);

  const handleAiSearch = async () => {
    if (!search) return;
    setSearchingAi(true);
    try {
      const suggestions = await aiService.searchCategoryExhibitors(search, EXHIBITORS.map(e => e.name));
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setSearchingAi(false);
    }
  };

  const handleSelectExhibitor = async (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor);
    setLoading(true);
    setDetails(null);
    try {
      const info = await aiService.getCompanyInfo(exhibitor.name);
      setDetails(info);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search CAE, Automation, Dies, Companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-accent border border-border-theme rounded-lg py-3 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/60"
          />
          <button 
            onClick={handleAiSearch}
            disabled={searchingAi || !search}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-surface rounded-md transition-colors disabled:opacity-50"
          >
            {searchingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>

        {aiSuggestions.length > 0 && search && (
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-[0.15em]">
              <Sparkles className="w-3 h-3" />
              AI Recommendations
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => setSearch(s)}
                  className="bg-surface px-3 py-1 rounded-full text-[11px] font-semibold text-primary border border-primary/20 hover:border-primary/40 shadow-sm transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['All', 'HALL 2', 'HALL 3', 'HALL 6', 'Japan Pavilion'].map(hall => (
            <button
              key={hall}
              onClick={() => setSearch(hall === 'All' ? '' : hall)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                (search === hall || (hall === 'All' && !search)) 
                  ? 'bg-accent text-primary' 
                  : 'bg-transparent text-text-muted hover:bg-accent/50'
              }`}
            >
              {hall}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] ml-1">Quick Access</h4>
          <div className="flex flex-wrap gap-2">
            {['CAE', 'Design Automation', 'Machining', 'Coating', 'Venting Solutions', 'HRS'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSearch(cat)}
                className="bg-accent/80 hover:bg-accent px-3 py-1 rounded-md text-[11px] font-semibold text-text-muted transition-colors border border-border-theme/50"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface border-t border-border-theme">
        {showVirtualOption && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleSelectExhibitor({ name: search, hall: 'Discovery / AI Research' })}
            className="w-full flex items-center justify-between px-5 py-6 bg-primary/5 border-b border-primary/20 group hover:bg-primary/10 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5 shadow-sm" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-text-main leading-tight">Research "{search}"</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-widest mt-1">
                  Global AI Knowledge Base
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
              Consult AI <ChevronRight className="w-3 h-3" />
            </div>
          </motion.button>
        )}

        {filteredExhibitors.slice(0, 50).map((exhibitor, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.01 }}
            onClick={() => handleSelectExhibitor(exhibitor)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-border-theme group hover:bg-accent transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-text-main leading-tight">{exhibitor.name}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {exhibitor.hall}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-border-theme group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </motion.button>
        ))}
      </section>

      <AnimatePresence>
        {selectedExhibitor && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExhibitor(null)}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-sm"
            />
            <motion.div
              layoutId={`card-${selectedExhibitor.name}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-border-theme"
            >
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                  <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-primary rounded-full text-[12px] font-semibold mb-4">
                    AI Insights Loaded
                  </div>
                  <h2 className="text-2xl font-bold text-text-main leading-tight mb-2">{selectedExhibitor.name}</h2>
                  <div className="flex items-center gap-1.5 text-text-muted text-sm capitalize">
                    <MapPin className="w-4 h-4" />
                    {selectedExhibitor.hall.toLowerCase()}
                  </div>
                </div>

                <div className="space-y-6">
                  {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest animate-pulse">Syncing with GenAI...</p>
                    </div>
                  ) : details ? (
                    <>
                      <p className="text-[15px] text-text-muted leading-relaxed">
                        {details.whatTheyDo}
                      </p>

                      <div className="innovation-box bg-accent border-l-4 border-primary p-5 rounded-xl">
                        <h4 className="text-[14px] font-bold text-primary uppercase tracking-wider mb-2">Latest Innovations 2026</h4>
                        <p className="text-[13px] text-text-main leading-relaxed">
                          {details.latestInnovations}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em] mb-3">Key Technologies</h4>
                        <div className="flex flex-wrap gap-2">
                          {(details.products || []).concat((details.technology || '').split(',').map(s => s.trim())).filter(Boolean).slice(0, 8).map((p, i) => (
                            <span key={i} className="bg-accent border border-border-theme px-3 py-1 rounded-md text-[11px] font-medium text-text-main">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-text-muted">
                      <p>Connection lost. Please try again.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-accent/50 border-t border-border-theme">
                <button 
                   onClick={() => setSelectedExhibitor(null)}
                   className="w-full bg-primary py-3.5 rounded-lg text-surface font-bold text-sm uppercase tracking-widest hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
                >
                  Return to Hall
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
