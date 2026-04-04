# Alatar UI/UX System Design

## 1. Purpose
This document is the single source of truth for frontend design and UX decisions while migrating from static HTML pages to Angular.

All frontend work must align with this document before implementation.

## 2. Source Audit
This system is extracted from the current static pages:
- index.html
- about.html
- partners.html
- products.html
- stations.html
- gallery.html
- contact.html
- home.css
- home.js
- i18n.js
- ui-sim.js
- products.js
- gallery.js

## 3. Brand DNA
- Positioning: premium Egyptian agriculture with heritage, trust, and export-grade quality.
- Tone: confident, respectful, credible, operationally strong.
- Mood: modern agribusiness with legacy storytelling.

## 4. Visual Tokens
Use CSS custom properties in Angular and avoid ad-hoc hardcoded colors.

### Core colors
- --color-primary-700: #2D6A4F
- --color-primary-600: #2E6B50
- --color-primary-500: #11D47D
- --color-accent-orange: #E8871E
- --color-accent-gold: #D4AF37
- --color-bg-light: #FCFDFC
- --color-bg-dark: #151D19
- --color-surface: #FFFFFF
- --color-text-main: #111815
- --color-text-muted: #5F766A

### Surfaces and depth
- Cards: white surface + subtle border + soft shadow.
- Hero blocks: image + dark gradient overlay.
- Premium highlights: sparse gold/orange usage for trust badges and CTAs.

## 5. Typography
- Arabic primary: Cairo.
- English fallback: Inter.
- Russian fallback: Noto Sans.

Rules:
- Headlines: high contrast, bold to black.
- Arabic paragraph line-height: 1.8 to 1.9.
- EN/RU paragraph line-height: 1.6 to 1.72.
- Keep hierarchy explicit (H1, H2, H3, body, helper).

## 6. Layout System
- Max content width: 1280px to 1440px depending on section.
- Horizontal padding: 24px desktop, 16px mobile.
- Section spacing: 80px to 120px vertical rhythm.
- Radius scale: 8px, 12px, 16px, pill.

## 7. Navigation System
### Desktop nav
- Sticky top header with blur and subtle border.
- Left: brand mark + name + "Established 1975" micro-label.
- Center: 7 primary links (Home, About, Partners, Products, Stations, Gallery, Contact).
- Right: language switcher (AR, EN, RU) + optional CTA.

### Mobile nav (app-like)
- Keep top compact header with menu trigger.
- Use app-like experience:
  - Bottom floating dock for primary sections.
  - Expandable mobile sheet for full navigation and secondary actions.
- Motion should be smooth and short (180ms to 280ms).

### Active states
- Active page must be visible via color + weight + indicator.
- Hover/focus states must preserve readability and contrast.

## 8. Motion and Interaction
- Use meaningful motion only:
  - Entrance reveal for hero and nav elements.
  - Hover lift for cards/buttons.
  - Drawer/dock transitions on mobile.
- Durations:
  - Fast micro interactions: 140ms to 180ms.
  - Structural transitions: 220ms to 320ms.
- Use ease-out curves for entrance and standard ease for state toggles.

## 9. UX Patterns
- Forms:
  - Strong labels, required markers, clear validation copy.
  - Immediate feedback and submit states.
- Lists/filters:
  - Keep selected filter visually explicit.
  - Keep empty state with guidance text.
- Preview mode helpers:
  - Toast messages must be short, direct, and actionable.

## 10. Internationalization and Direction
- Default language: AR.
- AR uses dir="rtl".
- EN/RU use dir="ltr".
- Direction and language must switch on root html element.
- Components must avoid layout break on direction change.

## 11. Accessibility Baseline
- Keyboard accessible navigation and menus.
- Visible focus rings on interactive elements.
- Target size for touch controls >= 44x44.
- Maintain color contrast for text and controls.
- Use semantic landmarks: header, nav, main, section, footer.

## 12. Frontend Engineering Rules (Angular)
- Reuse token variables from a shared global style file.
- Build components as standalone and composable.
- Keep responsive behavior in component styles, not inline hacks.
- Avoid one-off visual decisions that diverge from this system.
- Any deliberate visual deviation must first update this document.

## 13. Definition of Done for UI Tasks
A frontend task is complete only if:
1. It follows this system design.
2. It works in desktop and mobile.
3. It works in AR, EN, RU direction assumptions.
4. It passes accessibility baseline.
5. It does not introduce style drift from brand identity.
