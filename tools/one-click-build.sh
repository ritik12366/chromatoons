#!/data/data/com.termux/files/usr/bin/sh
# ============================================================================
# Chroma Toons — ONE-CLICK build (Termux).
#
# Ye "detected dubious ownership" problem ko poori tarah bypass karta hai:
# /storage/emulated/0 (shared storage) pe git owner mismatch karta hai, isliye
# project ko Termux ke apne home me copy kar ke wahan se commit/push karta hai.
#
# Chalao:   sh tools/one-click-build.sh
#
# Requirements (ek baar):
#   pkg install -y git gh curl
#   termux-setup-storage
#   gh auth login
# ============================================================================
set -e

SRC="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$HOME/ChromaToonsClone-build"
WORKFLOW_FILE="android.yml"
ARTIFACT="chromatoons-apk"
DEST="/sdcard/Download/ChromaToons-APK"
REPO_NAME="${REPO_NAME:-chromatoons}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$1" >&2; exit 1; }

# ---- 0. tools + login -------------------------------------------------------
for t in git gh rsync; do
  command -v "$t" >/dev/null 2>&1 || die "'$t' nahi mila. Chalao: pkg install -y git gh rsync"
done
gh auth status >/dev/null 2>&1 || die "GitHub login nahi. Chalao: gh auth login"

# Shared storage ko safe mark kar do (agar upar se chalao to bhi kaam kare)
git config --global --add safe.directory '*' 2>/dev/null || true

# ---- 1. project ko home me copy karo (ownership theek ho jaati hai) ---------
say "Project ko $BUILD_DIR me copy kar rahe hain"
mkdir -p "$BUILD_DIR"
rsync -a --delete --exclude '.git' --exclude 'android/build' \
      --exclude 'android/.gradle' "$SRC/" "$BUILD_DIR/"

cd "$BUILD_DIR"
git config user.email >/dev/null 2>&1 || git config user.email "chromatoons@example.com"
git config user.name  >/dev/null 2>&1 || git config user.name  "Chroma Toons Builder"

# ---- 2. git init + commit ---------------------------------------------------
say "Commit bana rahe hain"
if [ ! -d .git ]; then git init >/dev/null; fi
git add -A
git commit -m "Chroma Toons free build (non-Unity)" >/dev/null 2>&1 || echo "nothing new to commit"
git branch -M main >/dev/null 2>&1 || true

# ---- 3. repo create + push --------------------------------------------------
GH_USER="$(gh api user --jq .login)"
say "GitHub: $GH_USER / repo: $REPO_NAME"

if ! gh repo view "$GH_USER/$REPO_NAME" >/dev/null 2>&1; then
  say "Repo bana rahe hain (public)"
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  NEED_DISPATCH=0
else
  say "Repo pehle se hai — push kar rahe hain"
  git remote get-url origin >/dev/null 2>&1 || \
    git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
  PUSH_OUT="$(git push -u origin main --force 2>&1)" || { printf '%s\n' "$PUSH_OUT"; die "git push fail hua"; }
  printf '%s\n' "$PUSH_OUT"
  case "$PUSH_OUT" in
    *"Everything up-to-date"*) NEED_DISPATCH=1 ;;
    *) NEED_DISPATCH=0 ;;
  esac
fi

# ---- 4. workflow ka intezaar (push se khud trigger hota hai) ----------------
# Push hamesha workflow trigger karta hai. Sirf jab koi naya commit na ho tab
# manually trigger karo — warna do runs ban kar ek dusre ko cancel kar dete hain.
if [ "${NEED_DISPATCH:-0}" = "1" ]; then
  say "Naya commit nahi — workflow manually trigger kar rahe hain"
  gh workflow run "$WORKFLOW_FILE" --ref main >/dev/null 2>&1 || true
fi
say "Workflow start hone ka intezaar..."

RUN_ID=""
i=0
while [ "$i" -lt 30 ]; do
  RUN_ID="$(gh run list --workflow "$WORKFLOW_FILE" --branch main --limit 5 \
    --json databaseId,status \
    --jq '[.[] | select(.status=="queued" or .status=="in_progress")][0].databaseId' 2>/dev/null)"
  [ -n "$RUN_ID" ] && break
  i=$((i + 1))
  sleep 5
done
if [ -z "$RUN_ID" ]; then
  RUN_ID="$(gh run list --workflow "$WORKFLOW_FILE" --branch main --limit 1 \
    --json databaseId --jq '.[0].databaseId' 2>/dev/null)"
fi
[ -n "$RUN_ID" ] && [ "$RUN_ID" != "" ] || die "Run nahi mila. GitHub Actions tab check karo."

say "Run $RUN_ID watch kar rahe hain (2-5 min)"
gh run watch "$RUN_ID" --exit-status

# ---- 5. APK download --------------------------------------------------------
say "APK download kar rahe hain"
if ! mkdir -p "$DEST" 2>/dev/null; then
  DEST="$HOME/storage/downloads/ChromaToons-APK"
  mkdir -p "$DEST"
  say "Note: /sdcard access nahi — $DEST use ho raha hai (termux-setup-storage chalao)"
fi
rm -rf "$DEST"/* 2>/dev/null || true
gh run download "$RUN_ID" -n "$ARTIFACT" -D "$DEST"

say "DONE! APK yahan hai:"
ls -lh "$DEST"
echo
echo "Install: file manager se 'app-release.apk' tap karo."
