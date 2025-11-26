# Axiom Hive Desktop - Deployment Guide

## Building Installers

### Prerequisites

1. **Node.js 18+** and **pnpm** installed
2. **Platform-specific tools:**
   - **Windows:** Windows 10+ with Visual Studio Build Tools
   - **macOS:** macOS 10.15+ with Xcode Command Line Tools
   - **Linux:** Ubuntu 20.04+ with standard build tools

### Build Steps

```bash
# 1. Install dependencies
cd axiomhive-desktop
pnpm install

# 2. Build TypeScript code
pnpm run build

# 3. Create installers for your platform
pnpm run dist          # Current platform
pnpm run dist:win      # Windows
pnpm run dist:mac      # macOS
pnpm run dist:linux    # Linux
```

### Output

Installers will be created in the `release/` directory:

- **Windows:** `Axiom-Hive-Setup-1.0.0.exe` (NSIS installer) + portable version
- **macOS:** `Axiom-Hive-1.0.0.dmg` + `.zip`
- **Linux:** `Axiom-Hive-1.0.0.AppImage` + `.deb` package

## Installation Instructions for End Users

### Windows

1. Download `Axiom-Hive-Setup-1.0.0.exe`
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

**Portable Version:**
- Download `Axiom-Hive-1.0.0-portable.exe`
- Run directly without installation
- Data stored in `%APPDATA%\axiomhive-desktop`

### macOS

1. Download `Axiom-Hive-1.0.0.dmg`
2. Open the DMG file
3. Drag Axiom Hive to Applications folder
4. Launch from Applications or Launchpad

**Note:** First launch may require right-click → Open due to Gatekeeper

### Linux

**AppImage (Universal):**
```bash
chmod +x Axiom-Hive-1.0.0.AppImage
./Axiom-Hive-1.0.0.AppImage
```

**Debian/Ubuntu (.deb):**
```bash
sudo dpkg -i Axiom-Hive-1.0.0.deb
sudo apt-get install -f  # Fix dependencies if needed
```

## Licensing

### Demo Mode

The app runs in demo mode without a license key. Demo limitations:
- Full functionality for 30 days
- Watermark on exports
- Limited to 100 inferences

### Activation

1. Purchase a license key from https://axiomhive.com
2. Launch Axiom Hive
3. Go to Help → Enter License Key
4. Enter your license key and email
5. Click Activate

### License Key Format

```
AXIOM-XXXX-XXXX-XXXX-XXXX
```

Example: `AXIOM-A1B2-C3D4-E5F6-G7H8`

### Machine ID

Each license is tied to a specific machine. To transfer:

1. Deactivate on old machine: Help → Deactivate License
2. Activate on new machine with same license key

Get your Machine ID: Help → About → Machine ID

## Database Location

The SQLite database is stored in:

- **Windows:** `%APPDATA%\axiomhive-desktop\axiomhive.db`
- **macOS:** `~/Library/Application Support/axiomhive-desktop/axiomhive.db`
- **Linux:** `~/.config/axiomhive-desktop/axiomhive.db`

### Backup

To backup your data:

1. Close Axiom Hive
2. Copy the `axiomhive.db` file
3. Store in a safe location

### Restore

1. Close Axiom Hive
2. Replace `axiomhive.db` with your backup
3. Restart Axiom Hive

## Network Configuration

### Firewall

Axiom Hive runs a local server on port **3737**. Ensure:
- Port is not blocked by firewall
- No other application uses port 3737

### Private Network Deployment

For enterprise deployment on private networks:

1. Install on each workstation
2. No internet connection required
3. Each installation is independent
4. Data stays local to each machine

### Air-Gapped Systems

Axiom Hive works on completely air-gapped systems:

1. Transfer installer via USB/CD
2. Install normally
3. Activate with offline license key (contact sales)

## Troubleshooting

### App Won't Start

**Windows:**
```powershell
# Check if port 3737 is available
netstat -ano | findstr :3737

# Run as Administrator if needed
```

**macOS/Linux:**
```bash
# Check port availability
lsof -i :3737

# Check permissions
ls -la ~/Library/Application\ Support/axiomhive-desktop/
```

### Database Errors

If database is corrupted:

1. Backup current database
2. Delete `axiomhive.db`
3. Restart app (new database created automatically)

### License Issues

If activation fails:

1. Verify internet connection (for online activation)
2. Check email format
3. Ensure license key format is correct
4. Contact support with Machine ID

## Updates

### Checking for Updates

Help → Check for Updates

### Manual Update

1. Download new installer
2. Close Axiom Hive
3. Run new installer (overwrites old version)
4. Database and license preserved automatically

## Uninstallation

### Windows

Control Panel → Programs → Uninstall Axiom Hive

**Manual cleanup:**
```powershell
rmdir /s %APPDATA%\axiomhive-desktop
```

### macOS

1. Drag Axiom Hive from Applications to Trash
2. Delete data: `rm -rf ~/Library/Application\ Support/axiomhive-desktop`

### Linux

```bash
# If installed via .deb
sudo apt remove axiomhive-desktop

# Manual cleanup
rm -rf ~/.config/axiomhive-desktop
```

## Enterprise Deployment

### Silent Installation (Windows)

```powershell
Axiom-Hive-Setup-1.0.0.exe /S /D=C:\Program Files\AxiomHive
```

### Group Policy Deployment

1. Create MSI package (contact enterprise sales)
2. Deploy via GPO
3. Pre-configure license keys via registry

### Centralized Licensing

Enterprise customers can request:
- Volume licensing
- License server for activation
- Floating licenses
- Custom deployment scripts

Contact: enterprise@axiomhive.com

## Security Considerations

### Data Encryption

- Database: Use OS-level encryption (BitLocker, FileVault, LUKS)
- Network: All traffic is local (localhost only)
- Keys: Ed25519 keys generated per installation

### Compliance

- GDPR: All data stored locally, no cloud transmission
- HIPAA: Suitable for healthcare with proper OS encryption
- SOC 2: Audit logs provide complete trail

### Hardening

For high-security environments:

1. Disable auto-updates
2. Run with restricted user permissions
3. Enable OS-level encryption
4. Regular database backups
5. Monitor audit logs

## Support

- **Documentation:** https://axiomhive.com/docs
- **Email:** support@axiomhive.com
- **Enterprise:** enterprise@axiomhive.com
- **Emergency:** +1-555-AXIOM-HIVE

## Version History

### 1.0.0 (November 2025)
- Initial release
- State-Space Model implementation
- Ed25519 cryptographic signing
- SQLite local storage
- Cross-platform support
