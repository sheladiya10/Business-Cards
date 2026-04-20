import Dexie, { type Table } from 'dexie';

export interface BusinessCard {
  id?: number;
  name: string;
  designation: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  address: string;
  location: string;
  speciality: string;
  tag: string;
  notes: string;
  aiContext: string;
  frontImage?: string; // base64
  backImage?: string; // base64
  createdAt: number;
}

export interface VisitPhoto {
  url: string;
  comment: string;
}

export interface VisitLog {
  id?: number;
  exhibitorName: string;
  hall: string;
  notes: string;
  photos: VisitPhoto[]; 
  createdAt: number;
  updatedAt?: number;
}

export interface Project {
  id?: number;
  rawInput: string;
  refinedStructure: {
    title: string;
    objective: string;
    technology: string;
    innovation: string;
    existingSystem: string;
    process: string;
    requirements: string;
  };
  recommendations: {
    exhibitorName: string;
    detailedSummary: string;
  }[];
  createdAt: number;
}

export class AppDatabase extends Dexie {
  businessCards!: Table<BusinessCard>;
  visitLogs!: Table<VisitLog>;
  projects!: Table<Project>;

  constructor() {
    super('TagmaExpoDB');
    this.version(3).stores({
      businessCards: '++id, name, company, email, tag',
      visitLogs: '++id, exhibitorName, hall, createdAt',
      projects: '++id, createdAt'
    });
  }
}

export const db = new AppDatabase();

export let dbError: string | null = null;

// Ensure DB is open
db.open().catch(err => {
  console.error('Failed to open database:', err);
  dbError = err.message || 'Unknown database error';
});
