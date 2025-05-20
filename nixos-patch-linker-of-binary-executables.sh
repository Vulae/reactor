#! /usr/bin/env bash
set -o errexit || exit; set -o nounset; set -o pipefail

if [[ -f /etc/os-release ]] && grep -q 'ID=nixos' /etc/os-release; then
  if [[ ! -v NIX_LD ]] || [[ -z $NIX_LD ]]; then
    >&2 echo 'NIX_LD environment variable is not set! Did you enter the project nix-shell?'
    exit 1
  fi
else
  exit 0 # Not a NixOS system, skipping patching.
fi

SCRIPT_DIR=$(dirname -- "${BASH_SOURCE[0]}")
cd -- "$SCRIPT_DIR" # Always `cd` to project root where `node_modules` can be found

BIN_EXECUTABLES_TO_PATCH=(
  ./node_modules/sass-embedded-linux-x64/dart-sass/src/dart
)

for bin_executable_path in "${BIN_EXECUTABLES_TO_PATCH[@]}"; do
  (set -o xtrace; patchelf --set-interpreter "$NIX_LD" "$bin_executable_path")
done