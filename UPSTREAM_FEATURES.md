# Upstream Main Branch New Features & Changes

## Top Features to Merge (Recommended)

### 1. 🧠 Memory Search Paths Config (HOT!)
**Commit:** `0fd9d3abd`
- **What it is:** New `memorySearch.paths` config option
- **Why it's great:** Users can now explicitly specify additional directories or files to include in memory search
- **Benefits:**
  - More flexible memory management (no need to symlink)
  - Security-conscious approach (users opt-in to paths)
  - Recursively scans `.md` files in specified directories
  - Paths can be absolute or relative to workspace
- **Impact:** This makes memory search much more powerful and flexible

### 2. 📹 Telegram Video Notes Support
**Commits:** `4ac7aa4a4` and `78722d0b4`
- **What it is:** Added support for Telegram `video_note` (circular video messages)
- **Why it's great:** Full Telegram feature support
- **Impact:** Better Telegram integration, supports all video message types

### 3. 🤖 Telegram Multi-Agent AccountId Support
**Commits:** `fcc53bcf1` and `6132c3d01`
- **What it is:** Include AccountId in Telegram native command context for multi-agent routing
- **Why it's great:** Proper multi-agent support in Telegram
- **Impact:** Better multi-agent workflows, fixed routing issues

### 4. 📢 Telegram Empty Response Handling
**Commits:** `718bc3f9c`, `076165270`, `a2d06e75b`
- **What it is:** Notify users when agent returns empty response, handle empty reply arrays
- **Why it's great:** Better user experience - users know when messages fail silently
- **Impact:** Fewer confused users, better error handling

### 5. 💬 Verbose Tool Summaries in DM Sessions
**Commit:** `f27a5030d`
- **What it is:** Restored verbose tool summaries in DM sessions
- **Why it's great:** Better debugging and transparency in DMs
- **Impact:** More informative DM conversations

### 6. 👥 Mention Patterns Enhancement
**Commits:** `16a5549ec` and `22b59d24c`
- **What it is:** Check mentionPatterns even when explicit mention is available
- **Why it's great:** More flexible mention handling
- **Impact:** Better mention behavior across all platforms

### 7. 🎯 Native Slash Commands Excluded from Tool Results
**Commit:** `c13c39f12`
- **What it is:** Exclude native slash commands from onToolResult
- **Why it's great:** Cleaner command processing
- **Impact:** Better command-response handling

### 8. 💾 Security Improvements
**Commit:** `b71772427`
- **What it is:** Security hardening for media text attachments
- **Impact:** Better security handling

## Nice-to-Have Features

### 9. 🖥️ UI Chat Session Improvements
**Commit:** `6372242da`
- **What it is:** Improve chat session dropdown and refresh behavior
- **Impact:** Better UI experience

### 10. 🐧 Windows NTFS Compatibility
**Commit:** `c20035094`
- **What it is:** Use `&` instead of `<>` in XML escaping test for Windows NTFS compatibility
- **Impact:** Better Windows support

### 11. 📝 Documentation Updates
- MD post name fix: `Venius` → `Venice` (#3638)
- WhatsApp docs clarification for self-message dmPolicy bypass
- Changelog updates for mention patterns (#3303)

## Summary: What's Opening Up?

**Memory Search:** Much more open and flexible with explicit path configuration. Users can add any directories to their memory search without symlinks.

**Telegram:** Better multi-agent support, video notes, and more reliable messaging (no more empty responses).

**Multi-Agent:** Proper AccountId support in native commands means true multi-agent routing in Telegram.

## Safe Merge Strategy

### Your Branch Status:
- **Branch:** testNebiusTokenFactory
- **Your commits (ahead of upstream):**
  - `c5a58aa4f` - Adding models
  - `704d79101` - Fix Nebius API key URL typo
  - `e931a5a91` - Fix formatting
  - `0bbd3248e` - Fixing and Adding Nebius Token Factory
  - `18e67260d` - Merge PR #2715: Add Nebius Token Factory as Inference Provider
  - `c79479141` - Add Nebius models support

### Safe Merge Steps:

#### Option 1: Rebase (Clean History)
```bash
# 1. Make sure your branch is clean and committed
git status
git add -A
git commit -m "feat: 完成 Nebius Token Factory provider integration"

# 2. Rebase onto latest upstream
git rebase upstream/main

# 3. Resolve any conflicts (if any)
# Likely conflicts in:
# - src/agents/models-config.providers.ts (if upstream changed Nebius models)
# - docs/providers/nebius.md (if upstream updated Nebius docs)

# 4. Test after rebase
pnpm lint
pnpm test

# 5. Force push to your fork (your origin)
git push origin testNebiusTokenFactory --force-with-lease
```

#### Option 2: Merge Foreign Branch (Preserve History)
```bash
# 1. Merge upstream/main into your branch
git merge upstream/main -m "Merge upstream main: add new features"

# 2. Resolve conflicts
# Same files as above

# 3. Test
pnpm lint
pnpm test

# 4. Push
git push origin testNebiusTokenFactory
```

### Recommended: Option 1 (Rebase)
- Cleaner history
- Easier to review
- Your branch remains independent
- `--force-with-lease` is safer than `--force`

### Potential Conflicts to Watch:

1. **src/agents/models-config.providers.ts**
   - Your Nebius models might conflict with upstream changes
   - Solution: Keep your additions, merge any upstream provider improvements

2. **docs/providers/nebius.md**
   - Upstream might have updated Nebius docs
   - Solution: Merge your additions with upstream changes

3. **src/config/**
   - Memory search config (`paths`) might affect your setup
   - Solution: Test memory search after merge

## Testing Checklist After Merge:

- [ ] Lint passes: `pnpm lint`
- [ ] Format passes: `pnpm format`
- [ ] Tests pass: `pnpm test`
- [ ] Nebius provider works with all models
- [ ] Memory search still works correctly
- [ ] Telegram channels still function
- [ ] Image analysis (Qwen2.5 VL) works
- [ ] No breaking changes to your existing functionality

## What You Get After Merge:

✅ Better memory search flexibility
✅ Full Telegram video support
✅ Improved multi-agent routing
✅ Better error handling
✅ Security improvements
✅ UI improvements
✅ Windows compatibility
✅ Your Nebius Token Factory integration preserved

## Verdict:

**HIGHLY RECOMMENDED to merge!** The new features are significant, high-quality improvements that make Moltbot more capable without breaking your Nebius integration.

Use **rebase** for clean history or **merge** if you want to preserve the exact commit timestamps.