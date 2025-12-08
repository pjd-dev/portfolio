#!/bin/bash
# Simulates two clones modifying the same file and pushing

set -e

REPO_URL="https://github.com/youruser/obsidianVault.git"
CLONE1="/tmp/vault_clone_a"
CLONE2="/tmp/vault_clone_b"
FILENAME="test.md"

# Clean up
rm -rf "$CLONE1" "$CLONE2"

# Clone twice
git clone "$REPO_URL" "$CLONE1"
git clone "$REPO_URL" "$CLONE2"

# Simulate edits in Clone A
echo "Edit from clone A - $(date)" >> "$CLONE1/$FILENAME"
cd "$CLONE1"
git add "$FILENAME"
git commit -m "Clone A edit"
git push

# Simulate conflicting edits in Clone B
echo "Conflicting edit from clone B - $(date)" >> "$CLONE2/$FILENAME"
cd "$CLONE2"
git add "$FILENAME"
git commit -m "Clone B conflicting edit"
echo "Attempting push from Clone B (expect conflict)..."
if ! git push; then
  echo "Conflict occurred. Manual merge or pull required."
fi
