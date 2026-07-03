---
name: Mira Visual Identity
colors:
  surface: '#171210'
  surface-dim: '#171210'
  surface-bright: '#3e3835'
  surface-container-lowest: '#120d0b'
  surface-container-low: '#201a18'
  surface-container: '#241e1c'
  surface-container-high: '#2e2927'
  surface-container-highest: '#3a3331'
  on-surface: '#ebe0dc'
  on-surface-variant: '#bfcaaf'
  inverse-surface: '#ebe0dc'
  inverse-on-surface: '#352f2d'
  outline: '#8a947b'
  outline-variant: '#404a35'
  surface-tint: '#7fde00'
  primary: '#b3ff6a'
  on-primary: '#1c3700'
  primary-container: '#84e600'
  on-primary-container: '#356200'
  inverse-primary: '#3a6a00'
  secondary: '#ffb0ce'
  on-secondary: '#64003a'
  secondary-container: '#d20080'
  on-secondary-container: '#ffebf0'
  tertiary: '#ffe7c1'
  on-tertiary: '#412d00'
  tertiary-container: '#ffc451'
  on-tertiary-container: '#735100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#98fc2a'
  primary-fixed-dim: '#7fde00'
  on-primary-fixed: '#0e2000'
  on-primary-fixed-variant: '#2a5000'
  secondary-fixed: '#ffd9e5'
  secondary-fixed-dim: '#ffb0ce'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#8c0054'
  tertiary-fixed: '#ffdea8'
  tertiary-fixed-dim: '#ffba20'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#171210'
  on-background: '#ebe0dc'
  surface-variant: '#3a3331'
typography:
  display:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
  card-gap: 12px
---

## Brand & Style
The design system focuses on a **Premium iOS-style Health Utility** aesthetic. It prioritizes clarity and discretion for sensitive health data. The visual narrative moves away from traditional "feminine" tropes (florals, soft pastels) in favor of a high-performance, dark-mode interface that feels like a professional medical instrument refined for personal use.

The style is **Dark Minimalism** with high-contrast functional accents. It utilizes deep charcoal and obsidian surfaces to provide a low-strain viewing experience, especially useful for nighttime logging. Precision is conveyed through sharp data visualization and rigorous layout alignment, while warmth is introduced through subtle organic ochre undertones in the neutral palette.

**Emotional Response:** Empowered, secure, calm, and informed.

## Colors
The palette is rooted in a "Deep Canvas" strategy. The background is near-black (#050505) to eliminate visual noise. Interactive elements use **Electric Lime** for positive health states and primary actions, providing a "Safe" and "Active" signal that breaks from traditional medical blues or pinks. 

**Vivid Pink** is reserved strictly for cycle tracking and pain indicators, ensuring these data points are immediately scannable without overwhelming the UI. All neutrals contain a hint of warmth (brown/ochre hues) to prevent the dark mode from feeling cold or "gamer-centric," maintaining a sophisticated, wellness-focused atmosphere.

## Typography
This design system employs a dual-sans serif approach. **Manrope** is used for headlines to provide a modern, slightly geometric character that feels premium and balanced. **Inter** is used for all functional UI elements and body text to ensure maximum legibility at small sizes, particularly for data-rich logs and charts.

- **Scale:** Use `Display` for cycle day numbers or hero metrics. 
- **Readability:** Body text uses a slightly increased line height (1.4-1.5x) to ensure health insights are easy to digest.
- **Hierarchy:** Use `Text Secondary` for supporting descriptions and `Text Muted` for legal or meta-information.

## Layout & Spacing
The layout follows a strict 4px baseline grid to achieve a technical, utility-grade feel. 

- **Mobile First:** A standard 20px side margin is used for primary containers.
- **Compactness:** Information density should be high but organized. Use 12px gaps between cards in a vertical stack to maximize screen real estate.
- **Safe Areas:** Adhere strictly to iOS safe area insets for bottom navigation and top bars.
- **Grouping:** Related health metrics should be grouped in cards with 16px internal padding.

## Elevation & Depth
Depth is achieved through **Tonal Layering** rather than traditional shadows. This maintains a clean, modern aesthetic suitable for health tech.

- **Level 0 (Canvas):** #050505 - The base background.
- **Level 1 (Surface):** #1D1816 - Primary card backgrounds and navigation bars.
- **Level 2 (Inset):** #2A2523 - Search fields, segmented control tracks, and inner-card groupings.
- **Borders:** Use a 1px solid #2E2826 border for all cards and interactive elements to provide definition against the dark canvas without relying on glows.
- **Interactive State:** On press, surfaces should lighten slightly or use a subtle inner stroke of the primary color.

## Shapes
The design system uses a **Rounded** language that mimics physical hardware (like an iPhone's chassis). 

- **Primary Cards:** 20px - 24px corner radius.
- **Buttons & Inputs:** 12px - 16px corner radius.
- **Segmented Controls:** 8px - 10px corner radius for the outer container, with inner segments 2px smaller to create a nested look.
- **Icon Buttons:** Circular (pill) for standalone actions, or matching the 12px radius of inputs when aligned in a row.

## Components
- **Compact Cards:** Should have a subtle 1px border (#2E2826). Icons within cards use the Primary (Safe) or Accent (Cycle) color to indicate status.
- **Segmented Controls:** Use the Inset Surface (#2A2523) for the track and the Surface (#1D1816) for the active "thumb" with a subtle border.
- **Toggle Chips:** Small, interactive labels for logging symptoms. When inactive: Bordered with Text Muted. When active: Solid Primary or Secondary color with Black text.
- **Privacy Checkbox Rows:** High-density list items with a 1px bottom border. The checkbox itself should be a circular "radio-style" tick using the Primary color when selected.
- **Icon Buttons:** Use a light grey or muted brown wash for the background to keep them secondary to the main text actions.
- **Input Fields:** Minimalist. No bottom lines; use full-enclosure containers with Inset Surface background. Placeholder text should be Text Muted.
- **Progress Rings:** For cycle phase or goal tracking, use a stroke width of 4-6px with a rounded cap. Background track is always #2A2523.