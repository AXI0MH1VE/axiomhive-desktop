/**
 * SQLite Database Layer
 * Manages local storage for inference jobs, state transitions, and audit logs
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { StateTransition } from './ssm';

export interface InferenceJob {
  id?: number;
  prompt: string;
  result: string | null;
  confidence: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  seed: number;
  created_at: number;
  completed_at: number | null;
}

export interface AuditLog {
  id?: number;
  event_type: string;
  event_data: string;
  event_hash: string;
  prev_log_hash: string | null;
  created_at: number;
}

export class AxiomDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(app.getPath('userData'), 'axiomhive.db');
    this.db = new Database(dbPath || defaultPath);
    this.initialize();
  }

  private initialize(): void {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inference_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        result TEXT,
        confidence INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        seed INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS state_transitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        prev_state TEXT NOT NULL,
        next_state TEXT NOT NULL,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        hash TEXT NOT NULL,
        signature TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (job_id) REFERENCES inference_jobs(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_data TEXT,
        event_hash TEXT NOT NULL,
        prev_log_hash TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_status ON inference_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_transitions_job ON state_transitions(job_id);
      CREATE INDEX IF NOT EXISTS idx_logs_created ON audit_logs(created_at DESC);
    `);
  }

  // ============================================
  // Inference Jobs
  // ============================================

  public createInferenceJob(job: Omit<InferenceJob, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO inference_jobs (prompt, result, confidence, status, seed, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      job.prompt,
      job.result,
      job.confidence,
      job.status,
      job.seed,
      job.created_at,
      job.completed_at
    );
    
    return result.lastInsertRowid as number;
  }

  public getInferenceJob(id: number): InferenceJob | undefined {
    const stmt = this.db.prepare('SELECT * FROM inference_jobs WHERE id = ?');
    return stmt.get(id) as InferenceJob | undefined;
  }

  public updateInferenceJob(id: number, updates: Partial<InferenceJob>): void {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = this.db.prepare(`UPDATE inference_jobs SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
  }

  public getAllInferenceJobs(limit: number = 100): InferenceJob[] {
    const stmt = this.db.prepare(`
      SELECT * FROM inference_jobs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as InferenceJob[];
  }

  // ============================================
  // State Transitions
  // ============================================

  public saveStateTransition(jobId: number, transition: StateTransition): number {
    const stmt = this.db.prepare(`
      INSERT INTO state_transitions 
      (job_id, prev_state, next_state, input, output, timestamp, hash, signature, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      jobId,
      JSON.stringify(transition.prevState),
      JSON.stringify(transition.nextState),
      JSON.stringify(transition.input),
      JSON.stringify(transition.output),
      transition.timestamp,
      transition.hash,
      transition.signature,
      1 // Verified by default since we created it
    );
    
    return result.lastInsertRowid as number;
  }

  public getJobTransitions(jobId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM state_transitions 
      WHERE job_id = ? 
      ORDER BY timestamp ASC
    `);
    return stmt.all(jobId);
  }

  // ============================================
  // Audit Logs
  // ============================================

  public createAuditLog(log: Omit<AuditLog, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (event_type, event_data, event_hash, prev_log_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      log.event_type,
      log.event_data,
      log.event_hash,
      log.prev_log_hash,
      log.created_at
    );
    
    return result.lastInsertRowid as number;
  }

  public getAuditLogs(limit: number = 100): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as AuditLog[];
  }

  public getLastAuditLogHash(): string | null {
    const stmt = this.db.prepare(`
      SELECT event_hash FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    const result = stmt.get() as { event_hash: string } | undefined;
    return result?.event_hash || null;
  }

  // ============================================
  // Utility
  // ============================================

  public close(): void {
    this.db.close();
  }

  public getStats(): { totalJobs: number; completedJobs: number; totalTransitions: number } {
    const totalJobs = this.db.prepare('SELECT COUNT(*) as count FROM inference_jobs').get() as { count: number };
    const completedJobs = this.db.prepare("SELECT COUNT(*) as count FROM inference_jobs WHERE status = 'completed'").get() as { count: number };
    const totalTransitions = this.db.prepare('SELECT COUNT(*) as count FROM state_transitions').get() as { count: number };
    
    return {
      totalJobs: totalJobs.count,
      completedJobs: completedJobs.count,
      totalTransitions: totalTransitions.count
    };
  }
}
