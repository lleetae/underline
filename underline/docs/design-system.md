# Underline Design System

## Overview

The Underline design system follows a **Minimal Charcoal + Red Accent** aesthetic, creating a clean, sophisticated visual language that emphasizes content while using strategic red accents to guide user attention and action.

## Color Palette

### Primary Colors

| Token | Hex Code | Usage |
|-------|----------|-------|
| **Background** | `#FAFAFA` | Default page and card backgrounds, providing a soft off-white canvas |
| **Primary Text** | `#171717` | Headings, body text, primary icons - high contrast charcoal |
| **Secondary Text** | `#333333` | Supporting text, labels, secondary content - readable slate |

### Accent & Action Colors

| Token | Hex Code | Usage |
|-------|----------|-------|
| **Accent Red** | `#CC0000` | Primary CTAs, badges, key action buttons, important highlights |
| **Accent Hover** | `#B30000` | Hover and active states for red interactive elements |

### Borders & Dividers

| Token | Hex Code | Usage |
|-------|----------|-------|
| **Secondary** | `#C2C2C2` | Borders, dividers, disabled states, subtle separators |

### Background Variations

| Token | Hex Code | Usage |
|-------|----------|-------|
| **Card Background** | `#FFFFFF` | Pure white for card containers, creating layered depth |
| **Soft Highlight** | `#EAEAEA` - `#F0F0F0` | Input backgrounds, chip fills, subtle container backgrounds |

## Typography

### Font Families

- **Primary**: System UI fonts (optimized for readability across platforms)
- **Weights**: 
  - Regular: `400` (body text, inputs)
  - Medium: `500` (labels, buttons)
  - Semibold: `600` (subheadings)
  - Bold: `700` (headings, emphasis)

### Text Hierarchy

| Element | Size | Weight | Color | Usage |
|---------|------|--------|-------|-------|
| **H1** | `1.5rem` (24px) | Medium (500) | Primary (`#171717`) | Page titles |
| **H2** | `1.25rem` (20px) | Medium (500) | Primary (`#171717`) | Section headers |
| **H3** | `1.125rem` (18px) | Medium (500) | Primary (`#171717`) | Subsection headers |
| **Body** | `1rem` (16px) | Regular (400) | Primary (`#171717`) | Body content |
| **Label** | `1rem` (16px) | Medium (500) | Primary (`#171717`) | Form labels, UI labels |
| **Small** | `0.875rem` (14px) | Regular (400) | Secondary (`#333333`) | Supporting text |
| **Caption** | `0.75rem` (12px) | Regular (400) | Secondary (`#333333`) | Metadata, timestamps |

## Component Tokens

### Buttons

#### Primary Button (CTA)
- **Background**: `#CC0000` (Accent Red)
- **Text**: `#FAFAFA` (Off White)
- **Hover**: `#B30000` (Darker Red)
- **Border**: None
- **Border Radius**: `10px` (0.625rem)

#### Secondary Button
- **Background**: Transparent
- **Text**: `#171717` (Charcoal)
- **Border**: `1px solid #C2C2C2` (Silver)
- **Hover**: Background `#F0F0F0`
- **Border Radius**: `10px`

#### Disabled State
- **Background**: `#EAEAEA`
- **Text**: `#C2C2C2`
- **Opacity**: `50%`

### Form Inputs

- **Background**: `#F0F0F0` (Soft Highlight)
- **Border**: `1px solid transparent` (default)
- **Border (Focus)**: `1px solid #CC0000` (Accent Red)
- **Text**: `#171717` (Charcoal)
- **Placeholder**: `#C2C2C2` (Silver)
- **Border Radius**: `10px`

### Cards

- **Background**: `#FFFFFF` (Pure White)
- **Border**: `1px solid #C2C2C2` (Silver)
- **Text**: `#171717` (Charcoal)
- **Border Radius**: `10px` - `16px`
- **Shadow**: Minimal or none (flat design)

### Badges & Chips

- **Background**: `#CC0000` (Accent Red) for active/important
- **Background (Neutral)**: `#EAEAEA` (Soft Highlight)
- **Text (Active)**: `#FAFAFA` (Off White)
- **Text (Neutral)**: `#333333` (Slate)
- **Border Radius**: `16px` (pill shape)

### Dividers

- **Color**: `#C2C2C2` (Silver)
- **Height**: `1px`
- **Opacity**: `100%` (fully opaque for clarity)

## Layout Principles

### Spacing Scale

Based on `4px` (0.25rem) increments:
- **xs**: `4px` (0.25rem)
- **sm**: `8px` (0.5rem)
- **md**: `16px` (1rem)
- **lg**: `24px` (1.5rem)
- **xl**: `32px` (2rem)
- **2xl**: `48px` (3rem)

### Container Widths

- **Small**: `384px` (24rem)
- **Medium**: `448px` (28rem)
- **Desktop Max**: `1400px`

## Design Principles

### 1. Minimal & Clean
- Use whitespace generously
- Avoid visual clutter
- Let content breathe

### 2. Strategic Accent Usage
- Red accents draw attention - use sparingly
- Reserve red for primary actions and important information
- Don't overuse accent color on decorative elements

### 3. Clear Hierarchy
- Use contrast (charcoal on off-white) for readability
- Maintain consistent text sizes and weights
- Guide users through content with visual weight

### 4. Accessibility
- Maintain WCAG AA contrast ratios minimum
  - `#171717` on `#FAFAFA`: 12.6:1 ✓
  - `#CC0000` on `#FAFAFA`: 5.6:1 ✓
- Use consistent interactive states
- Provide clear focus indicators

## Usage Examples

### Primary CTA Button
```css
.primary-button {
  background-color: #CC0000;
  color: #FAFAFA;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 500;
}

.primary-button:hover {
  background-color: #B30000;
}
```

### Card Component
```css
.card {
  background-color: #FFFFFF;
  border: 1px solid #C2C2C2;
  border-radius: 16px;
  padding: 24px;
  color: #171717;
}
```

### Input Field
```css
.input-field {
  background-color: #F0F0F0;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px 16px;
  color: #171717;
}

.input-field:focus {
  border-color: #CC0000;
  outline: none;
}
```

## Implementation Notes

### CSS Custom Properties

The design system is implemented using CSS custom properties in `app/globals.css`:

```css
:root {
  --background: #FAFAFA;
  --foreground: #171717;
  --primary: #CC0000;
  --secondary: #C2C2C2;
  --accent: #CC0000;
  --muted: #EAEAEA;
  /* ... and more */
}
```

### Tailwind Integration

Use Tailwind's color system via CSS variables:
- `bg-background` → `#FAFAFA`
- `text-foreground` → `#171717`
- `bg-primary` → `#CC0000`
- `border-secondary` → `#C2C2C2`

## Version History

- **v1.0** (2025-11-28): Initial Minimal Charcoal + Red Accent design system
