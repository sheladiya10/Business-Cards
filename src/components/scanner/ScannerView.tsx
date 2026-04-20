/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, Loader2, Save, X, Share2, Mail, Trash2, Building2, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService, type ExtractedCard } from '../../services/aiService';
import { db } from '../../lib/db';

export function ScannerView() {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedCard | null>(null);
  const [saved, setSaved] = useState(false);
  
  const frontCameraRef = useRef<HTMLInputElement>(null);
  const frontGalleryRef = useRef<HTMLInputElement>(null);
  const backCameraRef = useRef<HTMLInputElement>(null);
  const backGalleryRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    tag: '',
    notes: ''
  });

  const handleImageUpload = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (side === 'front') setFrontImage(reader.result as string);
      else setBackImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!frontImage) return;
    setLoading(true);
    try {
      const data = await aiService.extractBusinessCardInfo(frontImage, backImage || undefined);
      setExtractedData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData) return;
    try {
      // 1. Save to Business Cards
      await db.businessCards.add({
        ...extractedData,
        tag: form.tag,
        notes: form.notes,
        frontImage: frontImage || undefined,
        backImage: backImage || undefined,
        createdAt: Date.now()
      });

      // 2. Automatically register a Visit Log for this company
      await db.visitLogs.add({
        exhibitorName: extractedData.company || extractedData.name || 'Unknown Exhibitor',
        hall: extractedData.location || 'Exhibition Floor',
        notes: `Initial contact: ${form.notes || 'No notes provided.'}`,
        photos: [
          ...(frontImage ? [{ url: frontImage, comment: 'Business Card Front' }] : []),
          ...(backImage ? [{ url: backImage, comment: 'Business Card Back' }] : [])
        ],
        createdAt: Date.now()
      });

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        reset();
      }, 2000);
    } catch (error) {
      console.error(error);
      alert('Save failed. Please check permissions.');
    }
  };

  const reset = () => {
    setFrontImage(null);
    setBackImage(null);
    setExtractedData(null);
    setForm({ tag: '', notes: '' });
  };

  return (
    <div className="space-y-8">
      {!extractedData ? (
        <div className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-main">Digitalize Lead</h2>
            <p className="text-[12px] font-medium text-text-muted uppercase tracking-[0.15em]">AI-Powered Networking Tool</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest ml-1">Card Front</span>
              <div className={`aspect-[3/2] rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all ${frontImage ? 'border-primary' : 'border-border-theme'}`}>
                {frontImage ? (
                  <>
                    <img src={frontImage} className="w-full h-full object-cover" alt="Front" />
                    <button 
                      onClick={() => setFrontImage(null)}
                      className="absolute top-2 right-2 p-1 bg-surface/80 rounded-full text-text-muted hover:text-red-500 backdrop-blur-sm shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 p-3 w-full h-full justify-center">
                    <button 
                      onClick={() => frontCameraRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 border border-primary/20"
                    >
                      <Camera className="w-4 h-4" /> Snap Photo
                    </button>
                    <button 
                      onClick={() => frontGalleryRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-accent text-text-muted py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 border border-border-theme/50"
                    >
                      <Upload className="w-4 h-4" /> Pick File
                    </button>
                    <input ref={frontCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload('front')} />
                    <input ref={frontGalleryRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload('front')} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest ml-1">Card Back</span>
              <div className={`aspect-[3/2] rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all ${backImage ? 'border-primary' : 'border-border-theme'}`}>
                {backImage ? (
                  <>
                    <img src={backImage} className="w-full h-full object-cover" alt="Back" />
                    <button 
                      onClick={() => setBackImage(null)}
                      className="absolute top-2 right-2 p-1 bg-surface/80 rounded-full text-text-muted hover:text-red-500 backdrop-blur-sm shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 p-3 w-full h-full justify-center">
                    <button 
                      onClick={() => backCameraRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 border border-primary/20"
                    >
                      <Camera className="w-4 h-4" /> Back Cam
                    </button>
                    <button 
                      onClick={() => backGalleryRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-accent text-text-muted py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 border border-border-theme/50"
                    >
                      <Upload className="w-4 h-4" /> Back File
                    </button>
                    <input ref={backCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload('back')} />
                    <input ref={backGalleryRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload('back')} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={!frontImage || loading}
            className="w-full bg-primary disabled:bg-border-theme py-4 rounded-lg text-surface font-bold text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="w-5 h-5" />
                Extract Details
              </>
            )}
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface rounded-2xl border border-border-theme shadow-xl overflow-hidden"
        >
          <div className="p-8 space-y-6">
            <header className="flex justify-between items-start">
              <div className="bg-blue-50 px-3 py-1 rounded-full text-[11px] font-bold text-primary uppercase tracking-widest">
                Verification Required
              </div>
              <button onClick={reset} className="p-1 text-text-muted hover:text-text-main transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </header>

            <div className="space-y-5">
              <div className="space-y-1">
                <input 
                  value={extractedData.name}
                  onChange={(e) => setExtractedData({...extractedData, name: e.target.value})}
                  className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-text-muted/20 text-text-main"
                  placeholder="Full Name"
                />
                <input 
                  value={extractedData.designation}
                  onChange={(e) => setExtractedData({...extractedData, designation: e.target.value})}
                  className="w-full text-xs font-bold text-text-muted uppercase tracking-widest bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Designation"
                />
              </div>

              <div className="h-px bg-border-theme" />

              <div className="grid gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-muted border border-border-theme/50">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    value={extractedData.email}
                    onChange={(e) => setExtractedData({...extractedData, email: e.target.value})}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none p-0 focus:ring-0 text-text-main"
                    placeholder="Email Address"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-muted border border-border-theme/50">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <input 
                    value={extractedData.phone}
                    onChange={(e) => setExtractedData({...extractedData, phone: e.target.value})}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none p-0 focus:ring-0 text-text-main"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-muted border border-border-theme/50">
                    <Building2 className="w-4 h-4 rotate-0" />
                  </div>
                  <input 
                    value={extractedData.website}
                    onChange={(e) => setExtractedData({...extractedData, website: e.target.value})}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none p-0 focus:ring-0 text-text-main"
                    placeholder="Website"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-primary border border-primary/10">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input 
                    value={extractedData.company}
                    onChange={(e) => setExtractedData({...extractedData, company: e.target.value})}
                    className="flex-1 text-[14px] font-bold text-primary bg-transparent border-none p-0 focus:ring-0"
                    placeholder="Company Name"
                  />
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-muted border border-border-theme/50">
                    <Scan className="w-4 h-4" />
                  </div>
                  <input 
                    value={extractedData.speciality}
                    onChange={(e) => setExtractedData({...extractedData, speciality: e.target.value})}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none p-0 focus:ring-0 text-text-main"
                    placeholder="Speciality"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-muted border border-border-theme/50">
                    <Camera className="w-4 h-4" />
                  </div>
                  <input 
                    value={extractedData.location}
                    onChange={(e) => setExtractedData({...extractedData, location: e.target.value})}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none p-0 focus:ring-0 text-text-main"
                    placeholder="Location (City/Area)"
                  />
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-muted border border-border-theme/50 shrink-0">
                    <Save className="w-4 h-4" />
                  </div>
                  <textarea 
                    value={extractedData.address}
                    onChange={(e) => setExtractedData({...extractedData, address: e.target.value})}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none p-0 focus:ring-0 text-text-main resize-none"
                    placeholder="Full Address"
                    rows={2}
                  />
                </div>
              </div>

              <div className="bg-accent border-l-4 border-primary p-5 rounded-lg space-y-2">
                 <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">AI Context summary</h4>
                 <textarea 
                   value={extractedData.aiContext}
                   onChange={(e) => setExtractedData({...extractedData, aiContext: e.target.value})}
                   className="w-full text-[13px] text-text-main bg-transparent border-none p-0 focus:ring-0 resize-none leading-relaxed"
                   rows={3}
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] ml-1">Identity Tag</label>
                   <input 
                     value={form.tag}
                     onChange={(e) => setForm({...form, tag: e.target.value})}
                     placeholder="e.g. Exhibitor"
                     className="w-full bg-accent/50 border border-border-theme rounded-lg px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] ml-1">Demo Notes</label>
                   <input 
                     value={form.notes}
                     onChange={(e) => setForm({...form, notes: e.target.value})}
                     placeholder="Met on Day 1..."
                     className="w-full bg-accent/50 border border-border-theme rounded-lg px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                   />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={saved}
                className="w-full bg-text-main py-4 rounded-lg text-surface font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:bg-success"
              >
                {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Data Synced' : 'Commit to Database'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
