---
name: Serene Feminine Health
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#504444'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#827474'
  outline-variant: '#d4c2c3'
  surface-tint: '#7c5357'
  primary: '#7c5357'
  on-primary: '#ffffff'
  primary-container: '#e8b4b8'
  on-primary-container: '#6b4448'
  inverse-primary: '#eeb9bd'
  secondary: '#50625d'
  on-secondary: '#ffffff'
  secondary-container: '#d0e4de'
  on-secondary-container: '#546662'
  tertiary: '#635979'
  on-tertiary: '#ffffff'
  tertiary-container: '#c8bbe0'
  on-tertiary-container: '#534a69'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdadc'
  primary-fixed-dim: '#eeb9bd'
  on-primary-fixed: '#301216'
  on-primary-fixed-variant: '#623c40'
  secondary-fixed: '#d3e7e1'
  secondary-fixed-dim: '#b7cbc5'
  on-secondary-fixed: '#0d1f1b'
  on-secondary-fixed-variant: '#384a46'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#cdc1e5'
  on-tertiary-fixed: '#1f1732'
  on-tertiary-fixed-variant: '#4b4260'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  touch-target-min: 44px
---

## Brand & Style

The design system is centered on the principles of **Support, Privacy, and Clarity**. It avoids the sterile, clinical atmosphere of traditional medical applications in favor of a "sanctuary" aesthetic—a digital space that feels safe and personal.

The style is a blend of **Soft Minimalism** and **Contemporary Utility**. It leverages generous whitespace to reduce cognitive load during health tracking, while using organic shapes to evoke a sense of natural rhythm. The interface should feel breathable and calm, prioritizing the user's emotional state as much as their data.

Targeting a feminine audience seeking a private health companion, the UI uses Russian as its primary language. The tone of voice and visual language are empathetic yet precise, ensuring that sensitive information is presented with dignity and absolute clarity.

## Colors

The palette is rooted in a collection of soft, muted pastels that suggest wellness and tranquility.

- **Primary (Muted Rose):** Used for primary actions, active cycle states, and key highlights. It is warm and supportive, not aggressive.
- **Secondary (Sage Green):** Applied to health indicators, positive trends, and "safe" status messages.
- **Tertiary (Lavender):** Used for supplementary tracking categories (e.g., mood or sleep) and subtle accents.
- **Neutral (Warm Cream):** This is the canvas color. It provides a softer contrast than pure white, reducing eye strain.
- **Deep Charcoal:** Reserved for typography and high-contrast UI boundaries to ensure WCAG AA accessibility and a grounded, trustworthy feel.

## Typography

This design system utilizes **Inter** for its exceptional legibility and systematic neutral tone. Given the Russian UI language (Cyrillic), Inter provides excellent character balance and avoids the "crowded" feel often found in condensed fonts.

- **Hierarchy:** Strong contrast between headlines and body text is achieved through weight rather than just size.
- **Readability:** A generous line height (1.6 for body) is strictly maintained to facilitate the reading of long-form health articles or personal notes.
- **Language Support:** All type scales account for the slightly longer word lengths typical in Russian translation, ensuring containers have adequate horizontal breathing room.

## Layout & Spacing

The layout philosophy follows a **Fluid Card-Based** model. On desktop, content is grouped into distinct modules that float on the Warm Cream background, preventing the UI from feeling overwhelming. On mobile (PWA), the layout shifts to a single-column stack with standardized side margins.

- **Mobile PWA Navigation:** A fixed bottom navigation bar provides immediate access to the primary views (Calendar, Insights, Add Log, Profile). The "Add" action is centrally positioned and visually distinct.
- **Safe Areas:** All interactive elements maintain a minimum 20px distance from the screen edges on mobile.
- **Rhythm:** An 8px linear scale is used for all padding and margins to maintain a predictable, harmonic flow.

## Elevation & Depth

To maintain the "Calm" personality, the design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Soft Ambient Shadows**.

- **Surface Levels:** The base layer is the `neutral` cream. Cards sit on top of this with a subtle white background and a very soft, high-diffusion shadow (0px 4px 20px, 4% opacity of Charcoal).
- **Depth Cues:** Depth is primarily communicated through subtle color shifts rather than physical height. For example, a "pressed" state might involve a slight darkening of the card's background color rather than a shadow change.
- **Modals:** Overlays use a light backdrop blur (12px) to keep the user grounded in their current context while highlighting the new interaction layer.

## Shapes

The shape language is characterized by **Generous Radii**. This reinforces the friendly and approachable nature of the brand.

- **Cards:** Use the `rounded-xl` (24px) setting to create a soft, containerized look that feels safe.
- **Buttons:** Primary buttons are fully rounded (pill-shaped) to maximize touch-target ergonomics.
- **Input Fields:** Use `rounded-lg` (16px) to maintain consistency with the card language without wasting internal space.

## Components

### Buttons
- **Primary:** Pill-shaped, Rose background with Charcoal text. No borders.
- **Secondary:** Pill-shaped, Sage background or transparent with a 1.5px Charcoal stroke.
- **Touch Targets:** All buttons have a minimum height of 48px to ensure accessibility for PWA users.

### Cards
- Standard layout: 24px padding, 24px corner radius.
- Desktop: Grid of cards with 16px-24px gutters.
- Mobile: Full-width cards with 20px side margins.

### Form Inputs
- Backgrounds are slightly lighter than the neutral base or pure white.
- Labels are positioned above the field in `label-md` style.
- Focus state is indicated by a soft Sage green glow rather than a harsh border.

### Chips & Tags
- Used for logging symptoms or moods. These use the `tertiary` (Lavender) and `secondary` (Sage) palettes with `label-sm` typography.
- Active states are filled; inactive states are outlined or low-opacity.

### Navigation (PWA Bottom Bar)
- Height: 64px.
- Icons: 24px, linear style with 1.5px stroke weight.
- Labels: `label-sm` centered below icons. Active state uses the Primary Rose color.

### Progress Indicators
- Circular trackers for cycle phases use soft gradients between the primary rose and secondary sage to represent transitions naturally.
