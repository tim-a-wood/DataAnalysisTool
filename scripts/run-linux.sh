#!/usr/bin/env bash
set -euo pipefail

step() {
  printf '\n==> %s\n' "$1"
}

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

have_node() {
  command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1
}

install_node() {
  step "Installing Node.js LTS"
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y nodejs npm
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y nodejs npm
  else
    echo "No supported package manager found. Install Node.js LTS from https://nodejs.org and run this script again."
    exit 1
  fi
}

if ! have_node; then
  install_node
fi

if ! have_node; then
  echo "Node.js/npm still were not found after install. Open a new terminal and run this script again."
  exit 1
fi

step "Using Node $(node --version) and npm $(npm --version)"

if [ ! -d node_modules ]; then
  step "Installing app dependencies"
  npm install
else
  step "Dependencies already installed"
fi

step "Starting Dataset Analyzer"
echo "The browser should open automatically. If it does not, open the local URL printed below."
npm run dev -- --host 127.0.0.1 --open
