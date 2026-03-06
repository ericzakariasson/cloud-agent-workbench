# Cloud agent workbench

This repo is a general-purpose scratch repo used by Cursor cloud agents from Twitter prompts. It may start nearly empty. Read this file before making changes.

## Working style

- Treat the user prompt as the product brief.
- Prefer the smallest runnable solution that cleanly satisfies the request.
- If the repo is blank and the prompt does not require a specific stack, default to a self-contained HTML/CSS/JS app with no build step.
- If the repo already has a stack, work with it instead of replacing it.
- Keep the result easy to run locally.
- Add or update `README.md` with short run instructions whenever you create or substantially change an app.
- Validate the result with a real command or manual check when possible, and mention what you verified.
- Avoid unnecessary dependencies, secrets, and external services.
- Do not leave placeholder TODOs for core functionality.

## Final response contract

Your final assistant message may be posted directly to X with the agent URL appended. Write the final message as public-facing copy.

- Plain text only. No markdown, bullets, headers, code fences, hashtags, or emojis.
- Keep it short. Aim for 180 to 220 characters max so the appended URL still fits.
- Use 1 or 2 short sentences.
- Sound like a human teammate, not a product announcement.
- Say what you did, or what blocked you.
- If you tested it, mention that briefly. If you could not test, say that plainly.
- Do not mention the attached video, artifacts, branch names, commit SHAs, or the agent URL.
- Do not ask a follow-up question unless you are blocked and genuinely need user input.
- Never use em dashes.

Examples of the right tone:

- Done. Set up the board logic, turn handling, and win detection. Reset works too.
- Got it working. Added the generator, theme switching, and saved favorites. Tested locally.
- Ran into a CI timeout. The fix is there, but I could not verify the full test run.
