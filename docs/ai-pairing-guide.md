# AI Pair Programming Guide for Large Codebases

## Overview
When working with AI assistants on large codebases, it's important to manage context effectively to avoid hitting token limits. This guide provides strategies for efficient AI pair programming.

## Strategies

### 1. Directory-First Approach
Before diving into specific files, understand the project structure:
```bash
# Example: List only directories first
list_dir /your/project/root
```

### 2. Focused Searches
Instead of searching the entire codebase, target specific directories:

**Good:**
```bash
# Search only in models directory for UUID usage
codebase_search "UUID" in /models

# Search specific file types
grep_search "*.js" in /services
```

**Avoid:**
```bash
# Too broad, may hit token limits
codebase_search "how does the authentication system work"
```

### 3. Chunking Large Files
When viewing large files:
- Request specific line ranges (e.g., 1-200)
- Focus on relevant functions/classes using view_code_item
- Use grep_search to find specific sections first

### 4. Task Decomposition
Break down large tasks into smaller, focused chunks:

1. **Investigation Phase**
   - Search specific directories
   - View only relevant file sections
   - Document dependencies

2. **Implementation Phase**
   - Work on one component at a time
   - Verify changes in related files
   - Test incrementally

### 5. Search Best Practices

#### Effective Queries
**Good:**
- "generate UUID in User model"
- "authentication middleware implementation"
- "database connection setup"

**Avoid:**
- "how does the app work"
- "show me the codebase"
- "explain the architecture"

#### Search Parameters
- Use CaseInsensitive: true for broader matches
- Specify file extensions in Includes (e.g., ["*.js", "*.ts"])
- Target specific directories in TargetDirectories

### 6. Context Management

#### Essential Context
When asking questions, provide:
- Specific file/function names
- Relevant error messages
- Current task scope

#### Minimize Context
Avoid including:
- Unrelated files/directories
- Historical changes not relevant to current task
- Generated files (node_modules, build outputs)

## Examples

### Example 1: Feature Implementation
```markdown
Task: Implement UUID service

1. First Search:
   - Target: /services directory
   - Query: "UUID generation"

2. View Implementation:
   - Check UuidService.js
   - View specific methods

3. Find Usage:
   - Search models directory
   - Look for UUID references
```

### Example 2: Bug Fix
```markdown
Task: Fix UUID collision

1. Locate Issue:
   - Search error logs
   - Find affected models

2. Check Implementation:
   - View UUID generation code
   - Check collision prevention

3. Verify Fix:
   - Test in affected models
   - Validate uniqueness
```

## Tips for Success

1. **Start Small**
   - Begin with specific files/functions
   - Expand scope gradually

2. **Use Tools Effectively**
   - Combine grep_search and codebase_search
   - Use view_code_item for specific functions

3. **Maintain Focus**
   - Work on one component at a time
   - Keep context relevant to current task

4. **Document Progress**
   - Track completed changes
   - Note remaining tasks

## Common Pitfalls to Avoid

1. **Overloading Context**
   - Don't include entire files
   - Avoid broad searches

2. **Unclear Queries**
   - Be specific about what you're looking for
   - Include relevant technical terms

3. **Skipping Verification**
   - Always verify changes
   - Test incrementally

## Remember
- Token limits are your friend - they force you to be specific and focused
- Quality of context matters more than quantity
- Break down large tasks into manageable chunks
