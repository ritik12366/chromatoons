#!/data/data/com.termux/files/usr/bin/sh
# ============================================================================
# Chroma Toons — one-shot cloud build from Termux.
#
# Pushes this project to a GitHub repo, runs the "Build Android APK" workflow
# and downloads the finished APK to /sdcard/Download/ChromaToons-APK/.
#
# This does NOT build locally: no JDK/Gradle/SDK exists on the phone. The build
# happens on GitHub's ubuntu-latest runner (see .github/workflows/android.yml).
#
# Requirements (install once in Termux):
#   pkg install git gh curl
# Then authenticate once:
#   gh auth login
# ============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOW_FILE="android.yml"
APK_NAME="ChromaToons"
DEST="/sdcard/Download/ChromaToons-APK"
REPO_NAME="${REPO_NAME:-chromatoons}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$1" >&2; exit 1; }

# ---- 0. check tools ---------------------------------------------------------
for t in git gh curl; do
  command -v "$t" >/dev/null 2>&1 || die "'$t' not found. Run: pkg install git gh curl"
done
gh auth status >/dev/null 2>&1 || die "Not logged in to GitHub. Run: gh auth login"

cd "$PROJECT_DIR"
[ -f .github/workflows/"$WORKFLOW_FILE" ] || die "workflow .github/workflows/$WORKFLOW_FILE missing"

# Android shared storage is often owned by another uid, which makes git refuse
# with "detected dubious ownership". Mark this folder (and everything) as safe.
git config --global --get-all safe.directory 2>/dev/null | grep -qx '\*' \
  || git config --global --add safe.directory '*'
git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true

# ---- 1. init + commit -------------------------------------------------------
say "Preparing local repository"
if [ ! -d .git ]; then git init >/dev/null; fi

# Make sure a commit identity exists (fresh setups usually have none).
git config user.email >/dev/null 2>&1 || git config user.email "chromatoons@example.com"
git config user.name  >/dev/null 2>&1 || git config user.name  "Chroma Toons Builder"

git add -A
git commit -m "Chroma Toons free build (non-Unity)" >/dev/null 2>&1 || echo "nothing new to commit"
git branch -M main >/dev/null 2>&1 || true

# ---- 2. create the GitHub repo (if needed) and push -------------------------
GH_USER="$(gh api user --jq .login)"
say "Using GitHub account: $GH_USER / repo: $REPO_NAME"

if ! gh repo view "$GH_USER/$REPO_NAME" >/dev/null 2>&1; then
  say "Creating repository $GH_USER/$REPO_NAME (public)"
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
else
  say "Repository exists — pushing"
  git remote get-url origin >/dev/null 2>&1 || \
    git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
  git push -u origin main
fi

# ---- 3. run the workflow ----------------------------------------------------
say "Starting the build workflow"
gh workflow run "$WORKFLOW_FILE" --ref main >/dev/null || true

say "Waiting for the workflow to start..."
sleep 6
RUN_ID="$(gh run list --workflow "$WORKFLOW_FILE" --limit 1 --json databaseId --jq '.[0].databaseId')"
[ -n "$RUN_ID" ] || die "Could not find the workflow run"

say "Watching run $RUN_ID (this takes a few minutes)"
gh run watch "$RUN_ID" --exit-status

# ---- 4. download the APK ----------------------------------------------------
say "Downloading the APK artifact"
if ! mkdir -p "$DEST" 2>/dev/null; then
  DEST="$HOME/storage/downloads/ChromaToons-APK"
  mkdir -p "$DEST"
  say "No access to /sdcard — using $DEST"
  say "Tip: run 'termux-setup-storage' once to allow writing to /sdcard"
fi
rm -rf "$DEST"/* 2>/dev/null || true
gh run download "$RUN_ID" -n chromatoons-apk -D "$DEST"

say "Done. APK saved under $DEST :"
ls -lh "$DEST"

cat <<EOF

Next:
  - Install the APK from $DEST (tap it in your file manager).
  - Rebuild anytime with:  sh tools/build-termux.sh
EOF
