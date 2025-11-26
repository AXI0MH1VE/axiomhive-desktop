/**
 * State-Space Model (SSM) Implementation
 * Provides deterministic state evolution with cryptographic verification
 * 
 * State equation: x(t+1) = A*x(t) + B*u(t) + w(t)
 * Output equation: y(t) = C*x(t) + D*u(t) + v(t)
 * 
 * Where:
 * - x(t) is the state vector at time t
 * - u(t) is the input vector at time t
 * - y(t) is the output vector at time t
 * - w(t) is process noise (deterministic in our case)
 * - v(t) is measurement noise (deterministic in our case)
 */

import crypto from 'crypto';

export interface SSMConfig {
  stateSize: number;
  inputSize: number;
  outputSize: number;
  A: number[][];  // State transition matrix
  B: number[][];  // Input matrix
  C: number[][];  // Output matrix
  D: number[][];  // Feedthrough matrix
}

export interface StateTransition {
  prevState: number[];
  nextState: number[];
  input: number[];
  output: number[];
  timestamp: number;
  hash: string;
  signature: string;
}

export class StateSpaceModel {
  private config: SSMConfig;
  private currentState: number[];
  private keyPair: { publicKey: string; privateKey: string };
  
  constructor(config: SSMConfig) {
    this.config = config;
    this.currentState = new Array(config.stateSize).fill(0);
    this.keyPair = this.generateKeyPair();
  }

  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    
    const result: number[][] = [];
    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        result[i][j] = 0;
        for (let k = 0; k < colsA; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }

  private vectorToMatrix(v: number[]): number[][] {
    return v.map(x => [x]);
  }

  private matrixToVector(m: number[][]): number[] {
    return m.map(row => row[0]);
  }

  private addVectors(a: number[], b: number[]): number[] {
    return a.map((val, i) => val + b[i]);
  }

  private hashState(data: any): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private signData(data: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(this.keyPair.privateKey, 'base64');
  }

  /**
   * Perform deterministic state transition
   * x(t+1) = A*x(t) + B*u(t)
   */
  public transition(input: number[]): StateTransition {
    if (input.length !== this.config.inputSize) {
      throw new Error(`Input size mismatch: expected ${this.config.inputSize}, got ${input.length}`);
    }

    const prevState = [...this.currentState];
    
    // x(t+1) = A*x(t) + B*u(t)
    const stateMatrix = this.vectorToMatrix(this.currentState);
    const inputMatrix = this.vectorToMatrix(input);
    
    const Ax = this.matrixMultiply(this.config.A, stateMatrix);
    const Bu = this.matrixMultiply(this.config.B, inputMatrix);
    
    const nextStateMatrix = Ax.map((row, i) => [row[0] + Bu[i][0]]);
    const nextState = this.matrixToVector(nextStateMatrix);
    
    // y(t) = C*x(t) + D*u(t)
    const Cx = this.matrixMultiply(this.config.C, stateMatrix);
    const Du = this.matrixMultiply(this.config.D, inputMatrix);
    
    const outputMatrix = Cx.map((row, i) => [row[0] + Du[i][0]]);
    const output = this.matrixToVector(outputMatrix);
    
    // Update current state
    this.currentState = nextState;
    
    // Create cryptographic proof
    const timestamp = Date.now();
    const transitionData = {
      prevState,
      nextState,
      input,
      output,
      timestamp
    };
    
    const hash = this.hashState(transitionData);
    const signature = this.signData(hash);
    
    return {
      ...transitionData,
      hash,
      signature
    };
  }

  /**
   * Verify a state transition signature
   */
  public verifyTransition(transition: StateTransition): boolean {
    try {
      const { hash, signature, ...data } = transition;
      const computedHash = this.hashState(data);
      
      if (computedHash !== hash) {
        return false;
      }
      
      const verify = crypto.createVerify('SHA256');
      verify.update(hash);
      verify.end();
      
      return verify.verify(this.keyPair.publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }

  /**
   * Get current state
   */
  public getState(): number[] {
    return [...this.currentState];
  }

  /**
   * Reset state to zero
   */
  public reset(): void {
    this.currentState = new Array(this.config.stateSize).fill(0);
  }

  /**
   * Get public key for verification
   */
  public getPublicKey(): string {
    return this.keyPair.publicKey;
  }
}

/**
 * Create a default SSM configuration for AI inference
 */
export function createDefaultSSMConfig(): SSMConfig {
  // Simple 2-state system for demonstration
  // State: [inference_quality, confidence_level]
  return {
    stateSize: 2,
    inputSize: 1,
    outputSize: 1,
    // State transition matrix (identity with decay)
    A: [
      [0.95, 0.05],
      [0.05, 0.95]
    ],
    // Input matrix
    B: [
      [1.0],
      [0.5]
    ],
    // Output matrix
    C: [[1.0, 0.5]],
    // Feedthrough matrix
    D: [[0.1]]
  };
}
