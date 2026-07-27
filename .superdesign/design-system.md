# Melanam Studio Design System

## Product context
Melanam is a work-focused video meetings and LMS product. The Studio extension turns a learning source into useful outputs: a concise summary, a structured course, quiz, flashcards, notes, article, key takeaways, or a new AI video brief. The workflow should feel like an operational learning tool, not a marketing page.

## Visual rules
- Retain the project fonts: Segoe UI for UI and Orbitron for compact display headings.
- Use cloud/white work surfaces, slate content text, cyan for primary action and mint for completion/status. Use amber only for caution.
- Use flat, dense workspace bands with one clearly framed input/result workspace. Avoid decorative cards inside cards and avoid oversized display type.
- Use `lucide-react` icons in compact icon buttons. Use semantic progress, tabs, a menu/segmented mode switch, and real error states.
- Responsive layout: a source panel flows above the result panel on small screens; stable controls and no text clipping.

## Studio flow
1. Paste a source or enter a prompt.
2. Detect/validate YouTube as the first supported provider.
3. Show ingestion status, then choose or auto-route to an output mode.
4. Stream a readable result and enable Markdown download where applicable.
