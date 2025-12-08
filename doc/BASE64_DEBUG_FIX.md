# Base64 Encoding/Decoding - Debug & Fix Guide

## Problem Summary

When using `obsidian_write_note` with `base64` parameter, notes were getting corrupted with gibberish Unicode characters. The issue was caused by incorrect handling of base64-encoded content.

## Root Cause

The original implementation had a fundamental misunderstanding of how `base64` should work:

### Original (Broken) Logic
```typescript
if (base64) {
  // Decode base64 to get content
  finalContent = Buffer.from(base64, "base64").toString("utf8");
}

// Then write with matter.stringify()
await writeNote(rel, {
  frontmatter: frontmatter ?? {},
  content: finalContent,  // ❌ This adds frontmatter AGAIN
});
```

**Problem**: When `base64` contains a complete note (frontmatter + content), decoding it and then passing to `matter.stringify()` causes:
1. Double frontmatter (original + new)
2. Incorrect YAML parsing
3. Corrupted output with mixed encodings

### Fixed Logic
```typescript
if (base64) {
  // Decode to get COMPLETE note
  const completeNote = Buffer.from(base64, "base64").toString("utf8");
  
  // Write directly without processing
  await writeNoteText(rel, completeNote);  // ✅ Direct write
  return;
}

// Standard path for content-only
await writeNote(rel, {
  frontmatter: frontmatter ?? {},
  content: content ?? "",
});
```

## Two Modes of Operation

### Mode 1: Content + Frontmatter (Separate)
Use when you have markdown body and want to add frontmatter programmatically.

```json
{
  "path": "note.md",
  "frontmatter": {
    "title": "My Note",
    "tags": ["example"]
  },
  "content": "# Heading\n\nBody text here"
}
```

**Result:**
```markdown
---
title: My Note
tags:
  - example
---

# Heading

Body text here
```

### Mode 2: Base64 (Complete Note)
Use when you have a complete note with frontmatter already included.

```json
{
  "path": "note.md",
  "base64": "LS0tCnRpdGxlOiBNeSBOb3RlCnRhZ3M6CiAgLSBleGFtcGxlCi0tLQoKIyBIZWFkaW5nCgpCb2R5IHRleHQgaGVyZQ=="
}
```

**Result:** Exact same as the markdown you encoded.

## When to Use Each Mode

### Use `content` + `frontmatter` when:
- Building notes programmatically
- Need to modify frontmatter separately
- Creating notes from templates
- Simple markdown without complex frontmatter

### Use `base64` when:
- Copying existing notes exactly
- Preserving complex frontmatter formatting
- Handling large notes
- Avoiding JSON escaping issues with special characters

## Testing the Fix

### Test 1: Simple Base64
```bash
cd apps/mcp

# Create test note
cat > test-note.md << 'EOF'
---
title: Test Note
tags: [test, debug]
---

# Test Content

This is a **test** note.
EOF

# Encode to base64
node dist/tools/encode-md.js --b64 test-note.md

# Use the base64 output in MCP call
```

### Test 2: Complex Note with Frontmatter
```bash
# Create complex note
cat > complex-note.md << 'EOF'
---
title: Complex Note
date: 2025-12-06
tags:
  - complex
  - test
metadata:
  author: Test User
  version: 1.0
---

# Complex Content

Multiple lines with:
- Lists
- **Bold** and *italic*
- `code blocks`

## Subsection

More content here.
EOF

# Encode and test
node dist/tools/encode-md.js --rpc-b64 --note test/complex.md complex-note.md
```

### Test 3: Verify No Corruption
```bash
# Write using base64
# Then read back
# Compare with original
diff test-note.md <(cat vault-data/test-note.md)
```

## Common Issues & Solutions

### Issue 1: Gibberish Unicode Output
**Symptom**: Note contains characters like `�` or strange symbols
**Cause**: Double-encoding or mixing base64 with matter.stringify()
**Solution**: Use fixed version that writes base64 content directly

### Issue 2: Frontmatter Appears Twice
**Symptom**: Note has two `---` sections at the top
**Cause**: Base64 contains frontmatter, but `frontmatter` parameter also provided
**Solution**: When using `base64`, don't provide `frontmatter` parameter

### Issue 3: Newline Handling
**Symptom**: Extra or missing line breaks
**Cause**: Base64 encoding includes or excludes trailing newlines
**Solution**: Consistent handling - fixed in the new implementation

### Issue 4: Large File Issues
**Symptom**: Very large notes fail or timeout
**Cause**: Single base64 string too large for JSON
**Solution**: Use chunked mode in encode-md:
```bash
encode-md --chunked --chunk-size 50000 large-file.md
```

## API Documentation

### obsidian_write_note

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Relative path to note |
| `content` | string | No | Markdown body (without frontmatter) |
| `frontmatter` | object | No | Frontmatter as key-value pairs |
| `base64` | string | No | Base64-encoded complete note |

#### Rules

1. **Mutually Exclusive**: Use either `base64` OR (`content` + `frontmatter`), not both
2. **Base64 Priority**: If `base64` is provided, `frontmatter` is ignored
3. **Complete Notes**: `base64` should contain the entire note including frontmatter
4. **UTF-8 Encoding**: All content must be valid UTF-8

#### Examples

**Example 1: Using content + frontmatter**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "obsidian_write_note",
    "arguments": {
      "path": "notes/example.md",
      "frontmatter": {
        "title": "Example",
        "tags": ["example"]
      },
      "content": "# Example\n\nContent here."
    }
  }
}
```

**Example 2: Using base64**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "obsidian_write_note",
    "arguments": {
      "path": "notes/example.md",
      "base64": "LS0tCnRpdGxlOiBFeGFtcGxlCnRhZ3M6CiAgLSBleGFtcGxlCi0tLQoKIyBFeGFtcGxlCgpDb250ZW50IGhlcmUu"
    }
  }
}
```

## encode-md Tool Updates

The `encode-md` tool has been updated with clearer documentation:

### Key Changes
1. **Clarified modes**: Explicitly states base64 is for COMPLETE notes
2. **Usage notes**: Added important notes section
3. **Better examples**: Shows when to use each mode

### Usage
```bash
# For complete note with frontmatter - use base64
encode-md --rpc-b64 --note target.md source.md

# For body only (frontmatter separate) - use content
encode-md --rpc --note target.md source.md
```

## Prevention Checklist

Before using base64 mode:
- [ ] Does your note have frontmatter? → Use base64
- [ ] Is it a simple markdown body? → Use content
- [ ] Do you need to modify frontmatter? → Use content + frontmatter
- [ ] Are you copying an existing note? → Use base64
- [ ] Is the note very large (>1MB)? → Use chunked mode

## Verification Steps

After writing a note, verify it:

```typescript
// 1. Write note
await writeNote("test.md", { /* ... */ });

// 2. Read it back
const { frontmatter, content } = await readNote("test.md");

// 3. Verify structure
assert(frontmatter.title === "Expected Title");
assert(content.includes("Expected Content"));
```

## Migration Guide

If you have existing code using the old broken base64 method:

### Before (Broken)
```typescript
const base64Content = Buffer.from(noteBody, "utf8").toString("base64");
await writeNote(path, {
  frontmatter: metadata,
  base64: base64Content  // ❌ Wrong! This causes corruption
});
```

### After (Fixed)
```typescript
// Option 1: Use content mode (recommended for programmatic use)
await writeNote(path, {
  frontmatter: metadata,
  content: noteBody
});

// Option 2: Use base64 mode (for complete notes)
const completeNote = matter.stringify(noteBody, metadata);
const base64 = Buffer.from(completeNote, "utf8").toString("base64");
await writeNote(path, {
  base64: base64  // ✅ Correct! No frontmatter parameter
});
```

## Performance Considerations

### Base64 Overhead
- **Encoding**: ~33% size increase
- **Decoding**: Minimal CPU overhead
- **Network**: Larger payload size

### When Base64 Makes Sense
- Complex frontmatter (nested objects, arrays)
- Special characters that need escaping
- Preserving exact formatting
- Binary-safe transmission

### When Content Mode Makes Sense
- Simple notes
- Programmatic generation
- Dynamic frontmatter
- Smaller payload size

## Troubleshooting

### Debug Output
Enable debug logging:
```typescript
if (base64) {
  const decoded = Buffer.from(base64, "base64").toString("utf8");
  console.log("Decoded base64 length:", decoded.length);
  console.log("First 100 chars:", decoded.substring(0, 100));
}
```

### Common Errors

**Error: "invalid base64 payload"**
- Check base64 string is valid
- Ensure no whitespace or newlines in base64 string
- Verify encoding matches (UTF-8)

**Error: Note appears empty**
- Check if base64 was actually decoded
- Verify writeNoteText is being called
- Check file permissions

## Summary

✅ **Fixed**: Base64 mode now writes complete notes directly without re-processing  
✅ **Clarified**: Documentation explains when to use each mode  
✅ **Tested**: Encoding/decoding round-trips correctly  
✅ **Backward Compatible**: Content mode still works as before  

The fix ensures that base64-encoded notes are written exactly as provided, preventing the corruption that occurred when frontmatter was processed twice.
