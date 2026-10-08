#!/usr/bin/env bash
# Publish a built site into the gh-pages branch, or delete one.
#
#   publish-pages.sh pr-42     put ./dist at /pr-42/
#   publish-pages.sh .         put ./dist at the site root
#   publish-pages.sh --remove pr-42
#
# gh-pages holds several versions of the app at once — main at the root, one
# directory per open pull request — which is the whole reason this exists
# rather than actions/deploy-pages. That action publishes a single artifact as
# the entire site, so a preview could only ever replace the app rather than
# sit beside it.
set -euo pipefail

REMOVE=no
if [ "${1:-}" = "--remove" ]; then
  REMOVE=yes
  shift
fi
TARGET="${1:?usage: publish-pages.sh [--remove] <target-dir>}"

# Refuse anything that could climb out of the branch. TARGET is interpolated
# into rm -rf below, and it arrives from a workflow expression; a pull request
# number cannot contain a slash today, and this stops that from being load
# bearing.
case "$TARGET" in
  .) ;;
  *[/\\]*|..|"") echo "refusing suspicious target: $TARGET" >&2; exit 1 ;;
esac

if [ "$REMOVE" = no ] && [ ! -d dist ]; then
  echo "no dist/ to publish — did the build run?" >&2
  exit 1
fi

SOURCE=$(pwd)
REMOTE="https://x-access-token:${GITHUB_TOKEN:?GITHUB_TOKEN is required}@github.com/${GITHUB_REPOSITORY}.git"

git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"

# Up to five attempts, because two runs can publish at once — a merge to main
# and a push to some pull request — and the loser of that race gets a
# non-fast-forward. Each attempt starts from a fresh clone rather than trying
# to rebase a tree of built assets, which has no useful merge semantics.
for attempt in 1 2 3 4 5; do
  WORK=$(mktemp -d)
  # --quiet, and never echo $REMOTE: it carries the token.
  if git clone --quiet --branch gh-pages --single-branch --depth 1 "$REMOTE" "$WORK" 2>/dev/null; then
    :
  else
    # First ever publish: an orphan branch with no history, so the branch
    # never carries a copy of the source tree.
    git clone --quiet --depth 1 "$REMOTE" "$WORK"
    git -C "$WORK" checkout --quiet --orphan gh-pages
    git -C "$WORK" rm -rqf . >/dev/null 2>&1 || true
  fi

  if [ "$REMOVE" = yes ]; then
    rm -rf "${WORK:?}/${TARGET}"
  elif [ "$TARGET" = "." ]; then
    # Replacing the root must not take the previews with it. Everything that
    # is not .git and not a pr-* directory goes; the previews stay.
    find "$WORK" -mindepth 1 -maxdepth 1 \
      ! -name .git ! -name 'pr-*' -exec rm -rf {} +
    cp -R "$SOURCE"/dist/. "$WORK"/
  else
    rm -rf "${WORK:?}/${TARGET}"
    mkdir -p "$WORK/$TARGET"
    cp -R "$SOURCE"/dist/. "$WORK/$TARGET"/
  fi

  # Pages runs Jekyll over a branch unless told not to, and Jekyll drops
  # files and directories whose names begin with an underscore. Vite does not
  # emit any today, but the cost of being wrong about that later is a missing
  # asset on a live site and no error anywhere.
  touch "$WORK/.nojekyll"

  git -C "$WORK" add --all
  if git -C "$WORK" diff --cached --quiet; then
    echo "nothing changed at ${TARGET}"
    rm -rf "$WORK"
    exit 0
  fi

  git -C "$WORK" commit --quiet -m "${GITHUB_SHA:-manual} -> ${TARGET}"
  if git -C "$WORK" push --quiet origin gh-pages; then
    echo "published ${TARGET}"
    rm -rf "$WORK"
    exit 0
  fi

  echo "push lost a race (attempt ${attempt}) — retrying from a fresh clone" >&2
  rm -rf "$WORK"
  sleep $((attempt * 3))
done

echo "could not publish ${TARGET} after five attempts" >&2
exit 1
