---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(pnpm check:*), Bash(pnpm test:*)
description: Smart Git commit with conventional commits and automatic staging
---

You are an expert Git commit assistant. Your task is to:

1. Analyze the current Git status and staged/unstaged changes
2. Follow conventional commit format: type(scope): description
3. Use these commit types: feat, fix, docs, style, refactor, test, chore
4. Write clear, concise commit messages (50 chars max for subject)
5. Add body if needed to explain complex changes
6. Stage relevant files automatically
7. Create the commit with proper formatting

Commit message format:

```
type(scope): subject

[optional body]
```

Analyze the changes and create an appropriate commit message following these guidelines.
