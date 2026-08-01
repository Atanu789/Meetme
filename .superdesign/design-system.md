# Melanam Dark Product System

## Product intent
Melanam is a premium operating environment for live meetings, courses, recordings, AI course design, files, polls, and learning follow-up. It is not a marketing site or an experimental visual demo. Every screen should optimize for orientation, action, and repeated use by instructors, learners, and operations teams.

## Visual foundation
- Base: near-black graphite `#0B0D10`, layered surfaces `#12151A` and `#181C22`, quiet borders `#272D36`.
- Text: primary `#F4F7FA`, secondary `#A7B0BC`, subdued `#747E8C`.
- Signal: one controlled electric cyan `#37D7FF` for primary actions, focus, and active status. Success is `#49D17D`; caution is `#F2B84B`; danger is `#EF6B73`.
- Typography: use a clean system UI sans for all body and interface text. Use Orbitron only for the Melanam wordmark and rare compact numeric readouts; never for large decorative headings.
- Depth: solid surfaces and 1px borders, with restrained shadows only for modal layers. No glassmorphism, no gradients, no blurred coloured halos.
- Shape: 6px for controls and fields, 8px for panels. Avoid pill-shaped UI except compact status tags and avatars.

## Layout system
- Application shell: persistent left sidebar on desktop, compact top bar on small screens. The current section is always obvious.
- Main workspace: 12-column responsive grid, max width 1440px, 24px desktop gutter, 16px mobile gutter.
- Page headers: compact title, context, and action row. Do not use hero scale typography on operational screens.
- Content uses unframed page sections. Panels are reserved for individual tools, forms, data blocks, media, and overlays; never nest panels unnecessarily.
- Tables, course modules, recordings, and sessions should be scan-friendly rows with stable action columns.

## Interaction system
- Use Lucide icons in tool buttons, with a tooltip for unfamiliar actions.
- Primary actions are cyan filled buttons. Secondary actions are quiet bordered buttons. Destructive actions are text or red only when needed.
- Use tabs for workspace subviews, segmented controls for compact choices, dropdown menus for option sets, checkboxes/toggles for binary values, and date/time fields for scheduling.
- Motion is functional only: 120-180ms opacity/position transitions for menus, dialogs, and loading states. No auto-playing decorative animation, floating cards, particle fields, equalizers, rays, orbiting shapes, physics demos, or animated landing-page mockups.
- Respect reduced-motion preferences.

## Screen families
- Home: dark command center with upcoming session, recent work, quick actions, and only real data surfaces. No marketing hero, no invented lab/demo.
- LMS: sidebar-led dashboard with a course roster, schedule timeline, assignment queue, and recordings as dense rows.
- Meeting room: full-bleed video surface with low-profile controls and collapsible right-side panels for chat, files, polls, captions, AI notes, and whiteboard.
- Course Builder: dark course workspace with a source bar, curriculum tree, save state, and scheduling panel. It should feel like a serious authoring tool.
- Admin and billing: compact tables, filters, summary metrics, and explicit status, without visual flourish.

## Non-negotiables
- Preserve every current feature and route, changing only navigation, visual hierarchy, controls, and interaction ergonomics.
- Do not introduce gradients, SVG illustrations, decorative bokeh/orbs, oversized heroes, card-inside-card layouts, or one-off animated scenes.
- Maintain strong contrast, clear keyboard focus, responsive layouts, and no text clipping at mobile or desktop widths.

## Landing-page redesign exception — Red Noir

The public landing page adopts a premium red-noir treatment while preserving all real Melanam product claims, routes, and accessibility. Use a near-black foundation (`#050505`), charcoal layers (`#111113`, `#18181B`), white (`#F4F4F5`), muted zinc (`#A1A1AA`), and one high-contrast crimson signal (`#EF233C`, hover `#FF4056`). Use Space Grotesk throughout, with a tight, editorial display scale only in the hero.

Use a fixed atmospheric background: a soft crimson radial glow at the center, a sparse star field, and a faint 40px technical grid fading outward from the hero. The header floats within a glass-black, rounded-full navigation bar with a subtle blur and 1px white/10 border. Feature panels are black or charcoal glass, with understated white/10 borders, 12–16px corners, and restrained red hover glows. Avoid cyan, purple, blue, generic neon gradients, illustrative characters, or decorative mock brands.

Motion is refined and intentional: staggered upward entrances, a breathing live-status dot, extremely slow star-field drift, a rotating red conic border on the primary CTA, and a seamless horizontally infinite feature marquee that pauses on hover and respects `prefers-reduced-motion`. The meeting product preview may use a red scan line, active-speaker edge pulse, and live recording indicator. Keep controls legible, content high contrast, and motion gentle enough for a serious collaboration product.
