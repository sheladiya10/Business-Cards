/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { Mail, Share2, Trash2, Building2, MapPin, Search, Printer, Loader2 } from 'lucide-react';
import { db } from '../../lib/db';
import { useState } from 'react';
import { jsPDF } from 'jspdf';

export function CRMView() {
  const contacts = useLiveQuery(() => db.businessCards.orderBy('createdAt').reverse().toArray());
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.speciality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [exporting, setExporting] = useState(false);

  const exportContactReport = async (contact: any) => {
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

      // Page 1: Complete Contact Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("CONTACT DOSSIER", pageWidth / 2, 30, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text(contact.company, pageWidth / 2, 40, { align: "center" });
      
      let y = 60;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Complete Business Information:", margin, y);
      y += 10;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const details = [
        `Name: ${contact.name}`,
        `Designation: ${contact.designation}`,
        `Email: ${contact.email}`,
        `Phone: ${contact.phone}`,
        `Speciality: ${contact.speciality}`,
        `Website: ${contact.website}`,
        `Location: ${contact.location}`,
        `Address: ${contact.address}`,
        `Tags: ${contact.tag}`,
        `Notes: ${contact.notes}`
      ];

      details.forEach(d => {
        const lines = doc.splitTextToSize(d, pageWidth - (margin * 2));
        doc.text(lines, margin, y);
        y += (lines.length * 6) + 2;
      });

      addFooter();

      // Subsequent Pages: Find logs for this company
      const logs = await db.visitLogs.where('exhibitorName').equals(contact.company).toArray();
      
      for (const log of logs) {
        for (const p of log.photos) {
          doc.addPage();
          y = 30;
          doc.setFont("helvetica", "bold");
          doc.text(`Insight Archive: ${contact.company}`, margin, y);
          y += 15;
          doc.setFont("helvetica", "normal");
          const commentLines = doc.splitTextToSize(p.comment || 'Visual highlight captured.', pageWidth - (margin * 2));
          doc.text(commentLines, margin, y);
          y += (commentLines.length * 7) + 15;
          
          try {
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - y - 30;
            doc.addImage(p.url, 'JPEG', margin, y, maxWidth, maxHeight, undefined, 'FAST');
          } catch (e) {}
          addFooter();
        }
      }

      doc.save(`${contact.company.replace(/\s+/g, '_')}_Full_Archive.pdf`);
      setExporting(false);
    } catch (error) {
       console.error(error);
       setExporting(false);
    }
  };

  const handleDeleteContact = async (id?: number) => {
    try {
      if (confirm('Delete this contact?')) {
        await db.businessCards.delete(id!);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete contact.');
    }
  };

  const shareContact = async (contact: any) => {
     const text = `Tagma 2026 Connection: \nName: ${contact.name}\nCompany: ${contact.company}\nSpec: ${contact.speciality}\nNotes: ${contact.notes}`;
     try {
       if (navigator.share) {
         await navigator.share({ title: 'Tagma 2026 Connection', text });
       } else {
         alert('Copied to clipboard\n'+text);
       }
     } catch (err: any) {
       if (err.name !== 'AbortError') {
         console.error('Share operation failed:', err);
       }
     }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-text-main">Lead Directory</h2>
        <div className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          {contacts?.length || 0} Unified Contacts
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, company or speciality..."
          className="w-full bg-surface border border-border-theme rounded-xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid gap-4">
        {filteredContacts?.length === 0 && (
          <div className="p-12 text-center text-text-muted/50 font-bold uppercase tracking-widest text-[10px]">
            No contacts found
          </div>
        )}
        {filteredContacts?.map((c, i) => (
          <div key={i} className="bg-surface border border-border-theme rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h4 className="text-[16px] font-bold text-text-main">{c.name}</h4>
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest">{c.company}</p>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[9px] bg-accent px-2 py-0.5 rounded font-bold text-text-muted uppercase">{c.designation}</span>
                   <span className="text-[9px] bg-blue-50 px-2 py-0.5 rounded font-bold text-primary uppercase border border-primary/10">{c.speciality}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => exportContactReport(c)} 
                  disabled={exporting}
                  className="p-2 bg-surface text-text-muted hover:text-primary transition-colors rounded-lg border border-border-theme shadow-sm"
                  title="Export Detailed Report"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                </button>
                <button onClick={() => shareContact(c)} className="p-2 bg-surface text-text-muted hover:text-primary transition-colors rounded-lg border border-border-theme shadow-sm">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteContact(c.id)} className="p-2 bg-surface text-text-muted hover:text-red-500 transition-colors rounded-lg border border-border-theme shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 text-[11px] font-semibold text-text-muted pt-2 border-t border-border-theme/30">
               <span className="truncate flex items-center gap-1.5"><Mail className="w-3 h-3 text-primary/50" /> {c.email}</span>
               <span className="text-right truncate flex items-center justify-end gap-1.5 font-bold text-text-main">
                 <Building2 className="w-3 h-3 text-primary/50" /> {c.location}
               </span>
            </div>

            {c.notes && (
              <div className="bg-accent/50 p-3 rounded-xl border-l-2 border-primary/20">
                <p className="text-[11px] text-text-muted italic leading-relaxed">
                   "{c.notes}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
