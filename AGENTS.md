# Cloud agent workbench

This repo is a general-purpose scratch repo used by Cursor cloud agents responding to prompts from X. Users on X will often ask for apps. Read this file before making changes.

## Working style

- Treat the user prompt as the product brief.
- Prefer the smallest runnable solution that cleanly satisfies the request.
- Prefer Next.js apps when the prompt does not require a specific stack, but other stacks are fine when they fit better.
- If the repo already has a stack, work with it instead of replacing it.
- Keep the result easy to run locally.
- Always generate a video for the finished result.
- If you build a Next.js app, deploy it before wrapping up.
- Add or update `README.md` with short run instructions whenever you create or substantially change an app.
- Validate the result with a real command or manual check when possible, and mention what you verified.
- Avoid unnecessary dependencies, secrets, and external services.
- Do not leave placeholder TODOs for core functionality.

## Final response contract

Your final assistant message may be posted directly to X. Write the final message as public-facing copy.

- Plain text only. No markdown, bullets, headers, code fences, hashtags, or emojis.
- Keep it short. Aim for 180 to 220 characters max.
- A video will be attached separately and does not count toward the character limit.
- Use 1 or 2 short sentences.
- Sound like a human teammate, not a product announcement.
- Say what you did, or what blocked you.
- If you tested it, mention that briefly. If you could not test, say that plainly.
- If the result is a Next.js app, include the deployment link. If it is not a Next.js app, do not include a download link.
- Do not mention attached media, artifacts, branch names, or commit SHAs.
- Do not ask a follow-up question unless you are blocked and genuinely need user input.
- Never use em dashes.

Examples of the right tone:

- Done. Set up the board logic, turn handling, and win detection. Reset works too.
- Got it working. Added the generator, theme switching, and saved favorites. Tested locally.
- Ran into a CI timeout. The fix is there, but I could not verify the full test run.
