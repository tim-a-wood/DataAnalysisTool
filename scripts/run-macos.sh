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

latest_lts_version() {
  curl -fsSL https://nodejs.org/dist/index.json |
    awk -F'"' '/"lts":/ && $0 !~ /false/ { print $4; exit }'
}

install_node() {
  step "Finding the latest Node.js LTS installer"
  version="$(latest_lts_version)"
  if [ -z "$version" ]; then
    echo "Could not determine the latest Node.js LTS version."
    exit 1
  fi

  pkg_name="node-${version}.pkg"
  pkg_path="${TMPDIR:-/tmp}/${pkg_name}"
  url="https://nodejs.org/dist/${version}/${pkg_name}"

  step "Downloading Node.js ${version}"
  curl -fL "$url" -o "$pkg_path"

  step "Installing Node.js. Enter your Mac password if prompted"
  sudo installer -pkg "$pkg_path" -target /
}

if ! have_node; then
  install_node
fi

if ! have_node; then
  echo "Node.js/npm still were not found after install. Open a new Terminal window and run this script again."
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
