@AGENTS.md

# Claude Code — notes specific to this repo

The shared agent guide is in [AGENTS.md](./AGENTS.md). This file adds
Claude-Code-specific guidance.

## Skills you can use here

- `/security-review` — run before merging anything that touches auth,
  RLS, webhooks, payment flows, or new public endpoints.
- `/review` — general PR review.
- `/ultrareview` — multi-agent cloud review of the current branch
  (user-triggered only — the assistant cannot launch it).

## Tool preferences

- Prefer **Edit** over Write when modifying existing files. Write is
  for new files or full rewrites.
- Use **Read** before any Edit (the tool requires it). Don't `cat`
  files via Bash.
- For broad code searches (>3 queries), spawn the **Explore** agent
  with thoroughness `medium`. For targeted lookups (known path,
  specific symbol), use Read or `grep` via Bash directly.
- Use **TodoWrite** when a task has 3+ discrete steps; mark items
  done as soon as they finish (don't batch).

## Project-wide preferences

- **Terse responses.** End-of-turn summary: one or two sentences.
  No headers/sections for simple tasks.
- **No emojis** unless explicitly requested.
- **Markdown links for file references**: `[file.ts:42](path/file.ts#L42)`
  — never plain backticks for paths in chat.
- **Portuguese in user-facing strings** (UI labels, validation
  messages, seed data). Code identifiers, comments, commit messages,
  and docs in English.
- **Don't write planning/decision/analysis Markdown** as a side-effect
  of a task. The user will ask if they want one.

## Verifying UI changes

For UI/frontend work, start the dev server and exercise the change in
a browser before reporting it as done. Type-check + tests prove code
correctness, not feature correctness — say so explicitly when you
can't visually verify.

## Git etiquette

- **Only commit when explicitly asked.**
- Default to creating new commits, not amending.
- Stage specific files by name; don't `git add -A` (risks committing
  `.env` or credentials).
- Commit message format: present-tense, English, scope-prefixed
  (`feat(security): …`, `fix(logger): …`, `feat(perf): …`). Keep the
  PR title short (<70 chars).
- `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` trailer
  on commits you author.

## Risky actions — always confirm first

Per repo policy: never push to remote, force-push, reset --hard,
delete branches, drop tables, run destructive Prisma commands, or
bypass hooks (`--no-verify`) without explicit user authorization in
the current turn. Authorization for one such action does not extend
to others.

## Memory

This project lives at `/home/fred/Desktop/tcg-shop-saas`. The
auto-memory system at
`~/.claude/projects/-home-fred-Desktop-tcg-shop-saas/memory/` holds
user/feedback/project/reference notes. Use it for facts that survive
beyond the current conversation; don't store ephemeral task state
there.
