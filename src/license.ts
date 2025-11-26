/**
 * Simple Licensing System
 * Validates license keys for desktop app activation
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface License {
  key: string;
  email: string;
  activatedAt: number;
  expiresAt: number | null;
  machineId: string;
}

export class LicenseManager {
  private licensePath: string;
  private machineId: string;

  constructor() {
    this.licensePath = path.join(app.getPath('userData'), 'license.json');
    this.machineId = this.generateMachineId();
  }

  /**
   * Generate a unique machine ID based on system characteristics
   */
  private generateMachineId(): string {
    const os = require('os');
    const data = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.cpus()[0].model}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Validate a license key format
   * Format: AXIOM-XXXX-XXXX-XXXX-XXXX
   */
  public validateKeyFormat(key: string): boolean {
    const pattern = /^AXIOM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(key);
  }

  /**
   * Verify license key cryptographically
   * In production, this would check against a server or embedded signature
   */
  public verifyLicenseKey(key: string, email: string): boolean {
    if (!this.validateKeyFormat(key)) {
      return false;
    }

    // Simple verification: hash email + machine ID and check against key suffix
    const hash = crypto.createHash('sha256')
      .update(email + this.machineId)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();

    // For demo purposes, accept any properly formatted key
    // In production, implement proper signature verification
    return true;
  }

  /**
   * Activate a license
   */
  public activateLicense(key: string, email: string): boolean {
    if (!this.verifyLicenseKey(key, email)) {
      return false;
    }

    const license: License = {
      key,
      email,
      activatedAt: Date.now(),
      expiresAt: null, // Perpetual license
      machineId: this.machineId
    };

    try {
      fs.writeFileSync(this.licensePath, JSON.stringify(license, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save license:', error);
      return false;
    }
  }

  /**
   * Check if the app is licensed
   */
  public isLicensed(): boolean {
    try {
      if (!fs.existsSync(this.licensePath)) {
        return false;
      }

      const data = fs.readFileSync(this.licensePath, 'utf8');
      const license: License = JSON.parse(data);

      // Verify machine ID matches
      if (license.machineId !== this.machineId) {
        console.warn('License machine ID mismatch');
        return false;
      }

      // Check expiration
      if (license.expiresAt && license.expiresAt < Date.now()) {
        console.warn('License expired');
        return false;
      }

      // Verify key is still valid
      return this.verifyLicenseKey(license.key, license.email);
    } catch (error) {
      console.error('License validation error:', error);
      return false;
    }
  }

  /**
   * Get current license info
   */
  public getLicenseInfo(): License | null {
    try {
      if (!fs.existsSync(this.licensePath)) {
        return null;
      }

      const data = fs.readFileSync(this.licensePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Deactivate license (for transfers)
   */
  public deactivateLicense(): boolean {
    try {
      if (fs.existsSync(this.licensePath)) {
        fs.unlinkSync(this.licensePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to deactivate license:', error);
      return false;
    }
  }

  /**
   * Generate a demo license key for testing
   */
  public static generateDemoKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
      segments.push(segment);
    }
    return `AXIOM-${segments.join('-')}`;
  }

  /**
   * Get machine ID for support purposes
   */
  public getMachineId(): string {
    return this.machineId;
  }
}
