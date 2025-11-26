/**
 * Embedded Express Server
 * Runs locally within the Electron app to provide API endpoints
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { AxiomDatabase } from './database';
import { LocalInferenceEngine } from './inference';
import { StateSpaceModel, createDefaultSSMConfig } from './ssm';

export class AxiomServer {
  private app: express.Application;
  private db: AxiomDatabase;
  private inferenceEngine: LocalInferenceEngine;
  private ssm: StateSpaceModel;
  private port: number;

  constructor(db: AxiomDatabase, port: number = 3737) {
    this.app = express();
    this.db = db;
    this.port = port;
    
    // Initialize SSM and inference engine
    this.ssm = new StateSpaceModel(createDefaultSSMConfig());
    this.inferenceEngine = new LocalInferenceEngine(this.ssm);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Get system stats
    this.app.get('/api/stats', (req, res) => {
      try {
        const stats = this.db.getStats();
        const systemState = this.inferenceEngine.getSystemState();
        
        res.json({
          ...stats,
          systemState: systemState.state,
          publicKey: systemState.publicKey
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Submit inference request
    this.app.post('/api/inference', async (req, res) => {
      try {
        const { prompt } = req.body;
        
        if (!prompt || typeof prompt !== 'string') {
          return res.status(400).json({ error: 'Prompt is required' });
        }

        // Generate deterministic seed from prompt + timestamp
        const seed = this.generateSeed(prompt);
        
        // Create job record
        const jobId = this.db.createInferenceJob({
          prompt,
          result: null,
          confidence: null,
          status: 'processing',
          seed,
          created_at: Date.now(),
          completed_at: null
        });

        // Log audit event
        this.logAuditEvent('inference_started', { jobId, prompt: prompt.substring(0, 50) });

        // Perform inference
        const inferenceResult = await this.inferenceEngine.infer({ prompt, seed });
        
        // Get state transition
        const inputVector = [this.hashToNumber(prompt)];
        const transition = this.ssm.transition(inputVector);
        
        // Save state transition
        this.db.saveStateTransition(jobId, transition);
        
        // Update job with result
        this.db.updateInferenceJob(jobId, {
          result: inferenceResult.result,
          confidence: Math.floor(inferenceResult.confidence * 100),
          status: 'completed',
          completed_at: Date.now()
        });

        // Log completion
        this.logAuditEvent('inference_completed', { jobId, confidence: inferenceResult.confidence });

        res.json({
          jobId,
          result: inferenceResult.result,
          confidence: inferenceResult.confidence,
          seed,
          deterministic: true
        });
      } catch (error: any) {
        console.error('Inference error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get inference job by ID
    this.app.get('/api/inference/:id', (req, res) => {
      try {
        const jobId = parseInt(req.params.id);
        const job = this.db.getInferenceJob(jobId);
        
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        const transitions = this.db.getJobTransitions(jobId);
        
        res.json({
          job,
          transitions
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get all inference jobs
    this.app.get('/api/inference', (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 100;
        const jobs = this.db.getAllInferenceJobs(limit);
        
        res.json({ jobs });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get audit logs
    this.app.get('/api/audit', (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 100;
        const logs = this.db.getAuditLogs(limit);
        
        res.json({ logs });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Verify state transition
    this.app.post('/api/verify', (req, res) => {
      try {
        const { transition } = req.body;
        
        if (!transition) {
          return res.status(400).json({ error: 'Transition data required' });
        }

        const isValid = this.ssm.verifyTransition(transition);
        
        res.json({
          valid: isValid,
          verified: isValid,
          timestamp: Date.now()
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message, valid: false });
      }
    });

    // Reset system state
    this.app.post('/api/reset', (req, res) => {
      try {
        this.inferenceEngine.reset();
        this.logAuditEvent('system_reset', {});
        
        res.json({ success: true, message: 'System state reset' });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private generateSeed(input: string): number {
    const hash = crypto.createHash('sha256').update(input + Date.now()).digest();
    return hash.readUInt32BE(0);
  }

  private hashToNumber(input: string): number {
    const hash = crypto.createHash('sha256').update(input).digest();
    return hash.readUInt32BE(0) / 4294967296;
  }

  private logAuditEvent(eventType: string, eventData: any): void {
    const prevHash = this.db.getLastAuditLogHash();
    const dataString = JSON.stringify(eventData);
    const eventHash = crypto.createHash('sha256')
      .update(eventType + dataString + (prevHash || ''))
      .digest('hex');
    
    this.db.createAuditLog({
      event_type: eventType,
      event_data: dataString,
      event_hash: eventHash,
      prev_log_hash: prevHash,
      created_at: Date.now()
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`Axiom Hive server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }
}
