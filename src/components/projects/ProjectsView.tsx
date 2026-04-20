/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles, Loader2, Building2, ChevronRight, Target, Cpu, Lightbulb, History, Trash2, Edit2, CheckCircle2, FlaskConical, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/db';
import { aiService } from '../../services/aiService';
import { EXHIBITORS } from '../../constants/exhibitors';

export function ProjectsView() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').reverse().toArray());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProject, setActiveProject] = useState<any>(null);
  
  // Two-step process states
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftBlueprint, setDraftBlueprint] = useState<any>(null);

  const [loadingStep, setLoadingStep] = useState('');

  const startRefinement = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setLoadingStep('Analyzing project scope...');
    try {
      const result = await aiService.refineProjectDescription(input);
      setDraftBlueprint(result);
      setIsDrafting(true);
    } catch (error) {
      console.error(error);
      alert('Refinement failed. Try again.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const finalizeStrategy = async () => {
    setLoading(true);
    setLoadingStep('Consulting global knowledge base...');
    try {
      const mappedExhibitors = EXHIBITORS.map(e => ({
        name: e.name,
        category: (e.category || []).join(',') || 'General'
      }));
      
      const recommendations = await aiService.matchExhibitors(draftBlueprint, mappedExhibitors);
      
      const newProject = {
        rawInput: input,
        refinedStructure: draftBlueprint,
        recommendations,
        createdAt: Date.now()
      };
      
      const id = await db.projects.add(newProject);
      setActiveProject({ ...newProject, id });
      resetProcess();
    } catch (error) {
      console.error(error);
      alert('Matchmaking failed.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const resetProcess = () => {
    setInput('');
    setIsDrafting(false);
    setDraftBlueprint(null);
  };

  const deleteProject = async (id?: number) => {
    if (!id || !confirm('Permanently delete this strategy?')) return;
    await db.projects.delete(id);
    if (activeProject?.id === id) setActiveProject(null);
  };

  const handleUpdateDraft = (key: string, value: string) => {
    setDraftBlueprint({ ...draftBlueprint, [key]: value });
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-1 border-b border-border-theme pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-text-main">Strategy Lab</h2>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">AI Strategic Planning & Matchmaking</p>
      </header>

      {!activeProject && !isDrafting && (
        <div className="space-y-6">
          <div className="bg-surface border border-border-theme rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Define Project Scope
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your project, production challenge, or innovation goal..."
              className="w-full bg-accent/30 border border-border-theme rounded-xl px-4 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px] resize-none leading-relaxed"
            />
            <button 
              onClick={startRefinement}
              disabled={loading || !input.trim()}
              className="w-full bg-primary disabled:bg-border-theme py-4 rounded-xl text-surface font-bold text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FlaskConical className="w-5 h-5" />}
              {loading ? (loadingStep || 'Consulting AI...') : 'Refine & Structure'}
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4" /> Strategy Archive
            </h3>
            <div className="grid gap-3">
              {projects?.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => setActiveProject(p)}
                  className="bg-surface border border-border-theme rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all text-left group"
                >
                  <div>
                    <h4 className="text-sm font-bold text-text-main">{p.refinedStructure.title}</h4>
                    <p className="text-[10px] text-text-muted font-bold truncate max-w-[200px]">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
              {projects?.length === 0 && (
                <div className="text-center py-8 text-text-muted/40 font-bold uppercase text-[9px] border-2 border-dashed border-border-theme rounded-xl">
                  No strategies archived
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDrafting && draftBlueprint && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
           <div className="bg-surface border border-border-theme rounded-3xl p-8 space-y-6 shadow-xl">
              <header className="flex justify-between items-center border-b border-border-theme pb-4">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-text-main">Architectural Review</h3>
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Verify and adjust the AI-Refined Blueprint before matching</p>
                 </div>
                 <button onClick={resetProcess} className="p-2 text-text-muted hover:bg-accent rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
              </header>

              <div className="grid gap-6">
                 {[
                   { label: 'Project Title', key: 'title' },
                   { label: 'Core Objective', key: 'objective' },
                   { label: 'Technology Stack', key: 'technology' },
                   { label: 'Innovation Potential', key: 'innovation' },
                   { label: 'Proposed Process', key: 'process' },
                   { label: 'Key Requirements', key: 'requirements' }
                 ].map((field) => (
                   <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-bold text-primary uppercase tracking-widest">{field.label}</label>
                      <textarea 
                        value={draftBlueprint[field.key]} 
                        onChange={(e) => handleUpdateDraft(field.key, e.target.value)}
                        className="w-full bg-accent/20 border border-border-theme/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 min-h-[80px] resize-none"
                      />
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-border-theme">
                 <button 
                   onClick={finalizeStrategy}
                   disabled={loading}
                   className="w-full bg-primary py-4 rounded-xl text-surface font-bold text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/30 flex items-center justify-center gap-3 transition-all active:scale-95"
                 >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                   {loading ? (loadingStep || 'Matching...') : 'Execute Strategic Match'}
                 </button>
              </div>
           </div>
        </motion.div>
      )}

      {activeProject && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <button 
            onClick={() => setActiveProject(null)}
            className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 px-3 py-1 bg-surface rounded-full border border-primary/20 transition-all font-sans"
          >
            ← Back to Archive
          </button>

          <section className="bg-surface border border-border-theme rounded-3xl overflow-hidden shadow-2xl">
             <div className="bg-primary p-8 text-surface space-y-2 relative overflow-hidden">
                <div className="relative z-10">
                   <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Strategic Blueprint</div>
                   <h3 className="text-2xl font-black tracking-tight leading-tight">{activeProject.refinedStructure.title}</h3>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Target className="w-24 h-24" />
                </div>
             </div>
             
             <div className="p-8 space-y-10">
                <div className="grid gap-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                         <Target className="w-4 h-4" />
                         <span className="text-[11px] font-bold uppercase tracking-widest">Executive Objective</span>
                      </div>
                      <p className="text-sm text-text-main font-semibold leading-relaxed bg-accent/30 p-5 rounded-2xl border-l-4 border-primary shadow-sm">{activeProject.refinedStructure.objective}</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3 bg-accent/20 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 text-text-main underline decoration-primary decoration-2 underline-offset-4">
                           <Cpu className="w-4 h-4" />
                           <span className="text-[11px] font-bold uppercase tracking-widest">Technology</span>
                        </div>
                        <p className="text-[12px] text-text-muted font-bold leading-relaxed">{activeProject.refinedStructure.technology}</p>
                      </div>
                      <div className="space-y-3 bg-accent/20 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 text-text-main underline decoration-primary decoration-2 underline-offset-4">
                           <Lightbulb className="w-4 h-4" />
                           <span className="text-[11px] font-bold uppercase tracking-widest">Innovation</span>
                        </div>
                        <p className="text-[12px] text-text-muted font-bold leading-relaxed">{activeProject.refinedStructure.innovation}</p>
                      </div>
                   </div>

                   <div className="h-px bg-border-theme" />

                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-primary">
                            <Building2 className="w-5 h-5" />
                            <span className="text-[13px] font-black uppercase tracking-[0.1em]">Target Exhibitor Matchmaking</span>
                         </div>
                         <div className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">{(activeProject.recommendations || []).length} Matches Found</div>
                      </div>
                      
                      <div className="grid gap-6">
                         {(activeProject.recommendations || []).map((rec: any, idx: number) => (
                           <div key={idx} className="bg-surface p-6 rounded-2xl border border-border-theme hover:shadow-lg transition-all space-y-3 ring-1 ring-black/5">
                              <div className="flex items-start gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-surface text-sm shrink-0 shadow-lg shadow-primary/20">{idx + 1}</div>
                                 <div className="space-y-1 flex-1">
                                    <h5 className="text-[16px] font-black text-text-main uppercase">{rec.exhibitorName}</h5>
                                    <div className="h-0.5 w-12 bg-primary/30 rounded-full" />
                                 </div>
                              </div>
                              <p className="text-[13px] text-text-muted font-medium leading-relaxed italic border-l-2 border-accent pl-4">
                                 {rec.detailedSummary}
                              </p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-border-theme flex justify-between items-center">
                   <button 
                     onClick={() => deleteProject(activeProject.id)}
                     className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 p-2 rounded-lg transition-all"
                   >
                     <Trash2 className="w-4 h-4" /> Erase Strategy
                   </button>
                   <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest opacity-40">
                      Session Date: {new Date(activeProject.createdAt).toLocaleString()}
                   </div>
                </div>
             </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
