# Running Dataset Analyzer

## Windows

Double-click:

```text
Run Dataset Analyzer.bat
```

The launcher checks for Node.js/npm. If they are missing, it downloads and installs the latest Node.js LTS release from nodejs.org, installs the app dependencies, starts the local dev server, and opens the browser.

If Windows asks for permission during Node.js installation, approve it.

## macOS

Open Terminal in the extracted project folder and run:

```bash
chmod +x scripts/run-macos.sh
./scripts/run-macos.sh
```

The script installs Node.js LTS from nodejs.org if needed, then installs dependencies and starts the app.

## Linux

Open Terminal in the extracted project folder and run:

```bash
chmod +x scripts/run-linux.sh
./scripts/run-linux.sh
```

The script installs Node.js LTS with the system package manager when possible, then installs dependencies and starts the app.

## Manual Fallback

Install Node.js LTS from https://nodejs.org, then run:

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal, usually:

```text
http://127.0.0.1:5173/
```
