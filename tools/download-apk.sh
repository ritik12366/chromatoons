#!/data/data/com.termux/files/usr/bin/sh
# ============================================================================
# Chroma Toons — sirf APK download karne ke liye.
#
# GitHub Actions ka latest (ya diya gaya) run se APK nikaalta hai.
# Build nahi karta — sirf download. Build ke liye tools/build-termux.sh dekho.
#
# Use:
#   sh tools/download-apk.sh            # latest run
#   sh tools/download-apk.sh <RUN_ID>   # koi specific run
# ============================================================================
set -e

WORKFLOW_FILE="android.yml"
ARTIFACT="chromatoons-apk"
DEST="/sdcard/Download/ChromaToons-APK"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$1" >&2; exit 1; }

command -v gh >/dev/null 2>&1 || die "'gh' nahi mila. Chalao: pkg install gh"
gh auth status >/dev/null 2>&1 || die "Login nahi ho. Chalao: gh auth login"

# /sdcard pe likhne ki koshish, warna ghar me fallback
if ! mkdir -p "$DEST" 2>/dev/null; then
  DEST="$HOME/storage/downloads/ChromaToons-APK"
  mkdir -p "$DEST"
  say "No /sdcard access — $DEST use kar rahe hain (chalao: termux-setup-storage)"
fi

RUN_ID="$1"
if [ -z "$RUN_ID" ]; then
  say "Latest run dhoondh rahe hain..."
  RUN_ID="$(gh run list --workflow "$WORKFLOW_FILE" --status success --limit 1 \
    --json databaseId --jq '.[0].databaseId')"
  [ -n "$RUN_ID" ] || die "Koi successful build nahi mila. Pehle build karo: sh tools/build-termux.sh"
  say "Latest successful run: $RUN_ID"
fi

rm -rf "$DEST"/* 2>/dev/null || true

say "APK download ho raha hai..."
gh run download "$RUN_ID" -n "$ARTIFACT" -D "$DEST"

say "Ho gaya. APK yahan hai:"
ls -lh "$DEST"
echo
echo "Install: file manager me kholo aur 'app-release.apk' tap karo."
