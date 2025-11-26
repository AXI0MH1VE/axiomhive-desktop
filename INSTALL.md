# Installation Instructions

## Download Options

### Option 1: Linux Application (Recommended for Quick Start)

**File:** `axiomhive-desktop-v1.0.0-linux.tar.gz` (113 MB)

Download from: https://github.com/AXI0MH1VE/axiomhive-desktop/releases/latest

```bash
# Download
wget https://github.com/AXI0MH1VE/axiomhive-desktop/releases/download/v1.0.0/axiomhive-desktop-v1.0.0-linux.tar.gz

# Extract
tar -xzf axiomhive-desktop-v1.0.0-linux.tar.gz

# Run
cd linux-unpacked
./axiomhive-desktop
```

The application will:
- Start embedded server on http://localhost:3737
- Initialize SQLite database in `~/.config/axiomhive-desktop/`
- Open the desktop interface

### Option 2: Complete Package (For Development/Customization)

**File:** `axiomhive-complete-package-v1.0.0.zip` (114 MB)

Includes:
- Linux application
- Complete source code
- Documentation
- Marketing materials

```bash
# Download
wget https://github.com/AXI0MH1VE/axiomhive-desktop/releases/download/v1.0.0/axiomhive-complete-package-v1.0.0.zip

# Extract
unzip axiomhive-complete-package-v1.0.0.zip

# Run application
cd axiomhive-complete-package/app/linux-unpacked/
./axiomhive-desktop
```

### Option 3: Build from Source

```bash
# Clone repository
git clone https://github.com/AXI0MH1VE/axiomhive-desktop.git
cd axiomhive-desktop

# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Run in development mode
pnpm run dev

# Or create installers
pnpm run dist        # Current platform
pnpm run dist:win    # Windows
pnpm run dist:mac    # macOS
pnpm run dist:linux  # Linux
```

## System Requirements

- **OS:** Linux (Ubuntu 20.04+), Windows 10+, or macOS 10.15+
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 500MB for application
- **CPU:** Any modern 64-bit processor

## First Run

1. Launch the application
2. The embedded server starts automatically
3. Dashboard opens showing:
   - Total inferences: 0
   - Completed: 0
   - State transitions: 0
4. Navigate to "New Inference" to submit your first query

## Troubleshooting

### Port Already in Use

If port 3737 is already in use:

```bash
# Check what's using the port
lsof -i :3737

# Kill the process or change the port in src/server.ts
```

### Permission Denied

```bash
# Make executable
chmod +x axiomhive-desktop
```

### Database Errors

If database is corrupted:

```bash
# Backup and remove
mv ~/.config/axiomhive-desktop/axiomhive.db ~/.config/axiomhive-desktop/axiomhive.db.backup
# Restart app - new database will be created
```

## Documentation

- **README.md** - Technical documentation
- **DEPLOYMENT.md** - Deployment guide
- **Marketing Materials** - In `marketing/` directory

## Support

- **Repository:** https://github.com/AXI0MH1VE/axiomhive-desktop
- **Issues:** https://github.com/AXI0MH1VE/axiomhive-desktop/issues
- **Releases:** https://github.com/AXI0MH1VE/axiomhive-desktop/releases

## License

Commercial license. See LICENSE file for details.
