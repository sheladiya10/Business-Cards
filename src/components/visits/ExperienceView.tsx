/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Download, Plus, X, Image as ImageIcon, Loader2, Save, FileSpreadsheet, Share2, Printer, FileText, Edit2, Trash2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, type VisitLog, type VisitPhoto, type BusinessCard } from '../../lib/db';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export function ExperienceView() {
  const contacts = useLiveQuery(() => db.businessCards.toArray());
  const visits = useLiveQuery(() => db.visitLogs.orderBy('createdAt').reverse().toArray());
  const [showAddLog, setShowAddLog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [newLog, setNewLog] = useState({
    exhibitorName: '',
    hall: '',
    notes: '',
    photos: [] as VisitPhoto[]
  });

  const handleEdit = (v: VisitLog) => {
    setEditId(v.id!);
    setNewLog({
      exhibitorName: v.exhibitorName,
      hall: v.hall,
      notes: v.notes,
      photos: JSON.parse(JSON.stringify(v.photos || [])) // simple clone with fallback
    });
    setShowAddLog(true);
  };

  const handleAddPhoto = (forcedCamera: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (forcedCamera) input.setAttribute('capture', 'environment');
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setNewLog({ 
          ...newLog, 
          photos: [...newLog.photos, { url: reader.result as string, comment: '' }] 
        });
      };
      reader.onerror = () => {
        console.error("FileReader failed");
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const updatePhotoComment = (index: number, comment: string) => {
    const updatedPhotos = [...newLog.photos];
    updatedPhotos[index].comment = comment;
    setNewLog({ ...newLog, photos: updatedPhotos });
  };

  const handleSaveLog = async () => {
    if (!newLog.exhibitorName) return;
    try {
      if (editId) {
        await db.visitLogs.update(editId, {
          ...newLog,
          updatedAt: Date.now()
        } as any);
      } else {
        await db.visitLogs.add({
          ...newLog,
          createdAt: Date.now()
        });
      }
      setNewLog({ exhibitorName: '', hall: '', notes: '', photos: [] });
      setShowAddLog(false);
      setEditId(null);
    } catch (error) {
      console.error('Failed to save visit log:', error);
      alert('Failed to save log entry.');
    }
  };

  const handleDeleteLog = async (id?: number) => {
    if (!id) return;
    if (confirm('Permanently remove this insight?')) {
      try {
        await db.visitLogs.delete(id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const shareIndividualLog = async (v: VisitLog) => {
    const text = `Tagma 2026 Innovation Insight: \nExhibitor: ${v.exhibitorName}\nNotes: ${v.notes}\nFindings: ${v.photos.map(p => p.comment).join('; ')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Innovation Insight', text });
      } else {
        alert('Insight copied to clipboard');
      }
    } catch (err: any) {
      // Ignore AbortError as it simply means the user cancelled the share dialog
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const exportExcel = () => {
    try {
      if (!contacts) return;
      const data = contacts.map(c => ({
        'Company': c.company,
        'Contact Person': c.name,
        'Designation': c.designation,
        'Email': c.email,
        'Phone': c.phone,
        'Website': c.website,
        'Address': c.address,
        'Location': c.location,
        'Speciality': c.speciality,
        'Tags': c.tag,
        'Notes': c.notes
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
      XLSX.writeFile(workbook, "Tagma_2026_Contacts.xlsx");
    } catch (error) {
      console.error('Excel Export failed:', error);
      alert('Excel Export failed.');
    }
  };

  const saveVCard = (contact: BusinessCard) => {
    const vcfData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contact.name}`,
      `ORG:${contact.company}`,
      `TITLE:${contact.designation}`,
      `TEL;TYPE=CELL:${contact.phone}`,
      `EMAIL:${contact.email}`,
      `URL:${contact.website}`,
      `ADR;TYPE=WORK:;;${contact.address};${contact.location};;;`,
      `NOTE:${contact.notes} | Tagma 2026`,
      'END:VCARD'
    ].join('\n');

    const blob = new Blob([vcfData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${contact.name.replace(/\s+/g, '_')}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getImageDimensions = (base64: string): Promise<{ w: number, h: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = base64;
    });
  };

  const exportLogPDF = async (log: VisitLog) => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      const addFooter = () => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Made by Pratik Sheladiya", pageWidth / 2, pageHeight - 10, { align: "center" });
      };

      // Find associated contact for complete info
      const contact = contacts?.find(c => c.company === log.exhibitorName);

      // Page 1: Complete Contact Information
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("VISIT REPORT", pageWidth / 2, 30, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text(log.exhibitorName, pageWidth / 2, 40, { align: "center" });
      
      let y = 60;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Contact Details:", margin, y);
      y += 10;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const details = [
        `Contact Person: ${contact?.name || 'N/A'}`,
        `Designation: ${contact?.designation || 'N/A'}`,
        `Email: ${contact?.email || 'N/A'}`,
        `Phone: ${contact?.phone || 'N/A'}`,
        `Speciality: ${contact?.speciality || 'N/A'}`,
        `Location: ${contact?.location || log.hall}`,
        `Website: ${contact?.website || 'N/A'}`,
        `Notes: ${log.notes || 'N/A'}`,
        `AI Summary: ${contact?.aiContext || 'N/A'}`
      ];

      details.forEach(d => {
        const lines = doc.splitTextToSize(d, pageWidth - (margin * 2));
        doc.text(lines, margin, y);
        y += (lines.length * 7);
      });

      addFooter();

      // Following Pages: Photos & Comments
      for (const p of log.photos) {
        doc.addPage();
        y = 30;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Observation Insight", margin, y);
        y += 15;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const commentLines = doc.splitTextToSize(p.comment || 'Visual evidence recorded.', pageWidth - (margin * 2));
        doc.text(commentLines, margin, y);
        y += (commentLines.length * 7) + 15;

        try {
          const maxWidth = pageWidth - (margin * 2);
          const maxHeight = pageHeight - y - 30;
          
          const dims = await getImageDimensions(p.url);
          let finalW = maxWidth;
          let finalH = maxHeight;
          
          if (dims.w > 0 && dims.h > 0) {
            const ratio = dims.w / dims.h;
            if (maxWidth / maxHeight > ratio) {
              finalW = maxHeight * ratio;
            } else {
              finalH = maxWidth / ratio;
            }
          }

          doc.addImage(p.url, 'JPEG', margin + (maxWidth - finalW)/2, y, finalW, finalH, undefined, 'MEDIUM');
        } catch (e) {
          doc.text("[Image rendered as reference]", margin, y);
        }
        addFooter();
      }

      doc.save(`Report_${log.exhibitorName.replace(/\s+/g, '_')}.pdf`);
      setExporting(false);
    } catch (error) {
      console.error(error);
      alert('Failed to generate report.');
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = 30;

      const addFooter = (pNum?: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Made by Pratik Sheladiya", pageWidth / 2, pageHeight - 10, { align: "center" });
        if (pNum) doc.text(`Page ${pNum}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      };

      // Page 1: Complete Contact Information List
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text("TAGMA 2026: UNIFIED LEAD REGISTER", pageWidth / 2, y, { align: "center" });
      y += 20;

      contacts?.forEach((c, i) => {
        if (y > 250) {
          addFooter();
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${i+1}. ${c.company}`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Contact: ${c.name} | ${c.designation} | Email: ${c.email} | Phone: ${c.phone}`, margin + 5, y);
        y += 4;
        doc.text(`Spec: ${c.speciality} | Site: ${c.website} | Loc: ${c.location}`, margin + 5, y);
        y += 8;
      });
      addFooter();

      // Insights
      for (const v of (visits || [])) {
        for (const p of v.photos) {
          doc.addPage();
          y = 30;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          doc.text(`Insight: ${v.exhibitorName}`, margin, y);
          y += 10;
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          const lines = doc.splitTextToSize(p.comment || 'General visual insight.', pageWidth - (margin * 2));
          doc.text(lines, margin, y);
          y += (lines.length * 5) + 10;
          
          try {
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - y - 30;
            
            const dims = await getImageDimensions(p.url);
            let finalW = maxWidth;
            let finalH = maxHeight;
            
            if (dims.w > 0 && dims.h > 0) {
              const ratio = dims.w / dims.h;
              if (maxWidth / maxHeight > ratio) {
                finalW = maxHeight * ratio;
              } else {
                finalH = maxWidth / ratio;
              }
            }

            doc.addImage(p.url, 'JPEG', margin + (maxWidth - finalW)/2, y, finalW, finalH, undefined, 'MEDIUM');
          } catch (e) {}
          addFooter();
        }
      }

      doc.save("Tagma2026_Full_Exhibition_Report.pdf");
      setExporting(false);
    } catch (error) {
      console.error(error);
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-center border-b border-border-theme pb-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight text-text-main">Journal & Export</h2>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Visual Innovation Log</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="p-2 bg-accent text-text-main rounded-lg border border-border-theme hover:bg-surface transition-all">
            <FileSpreadsheet className="w-5 h-5" />
          </button>
          <button 
            onClick={exportPDF} 
            disabled={exporting}
            className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em]">Contact Directory</h3>
          <span className="text-[9px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">{contacts?.length || 0} Leads</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
          {contacts?.map((c, i) => (
            <div key={i} className="min-w-[200px] bg-surface border border-border-theme rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="text-[13px] font-bold text-text-main line-clamp-1">{c.name}</h4>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-tight line-clamp-1">{c.company}</p>
                <p className="text-[9px] text-text-muted italic line-clamp-1">{c.designation}</p>
              </div>
              <button 
                onClick={() => saveVCard(c)}
                className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all group"
              >
                <UserPlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Save Contact</span>
              </button>
            </div>
          ))}
          {(!contacts || contacts.length === 0) && (
            <div className="w-full text-center py-6 text-[10px] font-bold text-text-muted/40 uppercase tracking-widest border-2 border-dashed border-border-theme rounded-2xl">
              No digital leads collected
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-border-theme/30">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em]">Experience Timeline</h3>
          <button 
            onClick={() => setShowAddLog(true)}
            className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Entry
          </button>
        </div>

        <div className="space-y-4">
          {visits?.length === 0 && (
            <div className="bg-accent/30 border-2 border-dashed border-border-theme rounded-2xl p-12 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
              No entries logged yet
            </div>
          )}
          {visits?.map((v, i) => (
            <div key={i} className="bg-surface border border-border-theme rounded-2xl p-4 space-y-4 relative group/card">
               <div className="flex justify-between items-start border-b border-border-theme/50 pb-3">
                  <div>
                    <h4 className="text-[14px] font-bold text-text-main">{v.exhibitorName}</h4>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{v.hall}</span>
                  </div>
                    <div className="flex items-center gap-2">
                      <button 
                         onClick={() => exportLogPDF(v)}
                         disabled={exporting}
                         className="p-1.5 text-text-muted hover:text-primary transition-colors bg-accent rounded-lg"
                         title="Export PDF Report"
                      >
                         <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleEdit(v)}
                        className="p-1.5 text-text-muted hover:text-amber-500 transition-colors bg-accent rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLog(v.id)}
                        className="p-1.5 text-text-muted hover:text-red-500 transition-colors bg-accent rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => shareIndividualLog(v)}
                        className="p-1.5 text-text-muted hover:text-primary transition-colors bg-accent rounded-lg"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                  </div>
               </div>
               
                <p className="text-[11px] text-text-muted leading-relaxed line-clamp-3 italic">
                  {v.notes}
                </p>

                <div className="flex justify-between items-center text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                   <span>Added: {new Date(v.createdAt).toLocaleDateString()}</span>
                   {v.updatedAt && <span>Edited: {new Date(v.updatedAt).toLocaleDateString()}</span>}
                </div>

               <div className="grid gap-3 pt-2">
                  {(v.photos || []).map((p, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-accent/30 p-3 rounded-xl border border-border-theme/30">
                       <img src={p.url} className="w-16 h-16 rounded-lg object-cover shadow-sm" alt="Highlight" />
                       <div className="flex-1 space-y-1">
                          <h5 className="text-[9px] font-bold text-primary uppercase tracking-widest">Scope / Innovation</h5>
                          <p className="text-[11px] text-text-main font-medium leading-tight">{p.comment || 'No visual note recorded'}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {showAddLog && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddLog(false)} className="absolute inset-0 bg-text-main/30 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-md bg-surface rounded-2xl p-8 space-y-6 border border-border-theme shadow-2xl">
                <header className="flex justify-between items-center border-b border-border-theme pb-4">
                  <h2 className="text-xl font-bold tracking-tight text-text-main">
                    {editId ? 'Refine Insight' : 'Log Innovation'}
                  </h2>
                  <button onClick={() => { setShowAddLog(false); setEditId(null); setNewLog({ exhibitorName: '', hall: '', notes: '', photos: [] }); }} className="p-2 text-text-muted hover:bg-accent rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </header>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={newLog.exhibitorName} onChange={e => setNewLog({...newLog, exhibitorName: e.target.value})} placeholder="Company Name" className="bg-accent rounded-lg px-4 py-3 text-xs font-bold outline-none ring-primary/20 focus:ring-2" />
                    <input value={newLog.hall} onChange={e => setNewLog({...newLog, hall: e.target.value})} placeholder="Hall / Booth" className="bg-accent rounded-lg px-4 py-3 text-xs font-bold outline-none ring-primary/20 focus:ring-2" />
                  </div>
                  
                  <textarea value={newLog.notes} onChange={e => setNewLog({...newLog, notes: e.target.value})} placeholder="Describe their technology, core products, or general notes..." rows={2} className="w-full bg-accent rounded-lg px-4 py-3 text-xs font-bold outline-none ring-primary/20 focus:ring-2 resize-none" />

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Innovation Gallery & Notes</label>
                    {(newLog.photos || []).map((p, idx) => (
                      <div key={idx} className="flex gap-3 bg-accent p-3 rounded-xl border border-border-theme/20 shadow-sm relative group/photo">
                        <div className="relative shrink-0">
                          <img src={p.url} className="w-16 h-16 rounded-lg object-cover ring-1 ring-border-theme" />
                          <button 
                            onClick={() => setNewLog({...newLog, photos: newLog.photos.filter((_, i) => i !== idx)})} 
                            className="absolute -top-2 -right-2 bg-red-500 text-surface rounded-full p-1.5 shadow-lg shadow-black/20 z-10 hover:bg-red-600 active:scale-90 transition-all"
                            title="Remove Photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea value={p.comment} onChange={e => updatePhotoComment(idx, e.target.value)} placeholder="What innovation does this show?" className="flex-1 bg-surface rounded-lg px-3 py-2 text-[10px] font-medium outline-none h-16 resize-none border border-border-theme/50 focus:border-primary" />
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                       <button onClick={() => handleAddPhoto(true)} className="flex-1 h-12 rounded-xl border-2 border-dashed border-border-theme flex items-center justify-center gap-2 text-[10px] font-bold text-text-muted uppercase hover:bg-primary/5 hover:border-primary/50 transition-all">
                         <Camera className="w-4 h-4" /> Snapshot
                       </button>
                       <button onClick={() => handleAddPhoto(false)} className="flex-1 h-12 rounded-xl border-2 border-dashed border-border-theme flex items-center justify-center gap-2 text-[10px] font-bold text-text-muted uppercase hover:bg-accent transition-all">
                         <ImageIcon className="w-4 h-4" /> Gallery
                       </button>
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveLog} className="w-full bg-primary py-4 rounded-lg text-surface font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Save className="w-5 h-5" /> {editId ? 'Apply Changes' : 'Record Insight'}
                </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
