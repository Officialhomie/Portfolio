# Base Font Setup Guide

This project is configured to use fonts similar to Base's brand typography.

## Current Setup

- **Primary Font**: Inter (loaded from Google Fonts)
  - Similar appearance to Coinbase Sans
  - Used by Base as a fallback font
  - Variable font with weights: 400, 500, 600, 700

- **Monospace Font**: System monospace fallback
  - Configured to use Coinbase Mono if available
  - Falls back to system monospace fonts

## Using Coinbase Sans (Optional)

Base uses **Coinbase Sans**, which is a proprietary font. If you have access to Coinbase Sans font files:

### Steps to Add Coinbase Sans:

1. **Download Coinbase Sans fonts**:
   - Visit Base brand resources (if you have access)
   - Download the following font files:
     - `CoinbaseSans-Regular.woff2`
     - `CoinbaseSans-Medium.woff2`
     - `CoinbaseSans-Bold.woff2`
     - `CoinbaseMono-Regular.woff2` (optional)
     - `CoinbaseMono-Medium.woff2` (optional)

2. **Place fonts in project**:
   ```bash
   # Create fonts directory if it doesn't exist
   mkdir -p public/fonts
   
   # Copy font files to public/fonts/
   cp /path/to/CoinbaseSans-*.woff2 public/fonts/
   cp /path/to/CoinbaseMono-*.woff2 public/fonts/  # if available
   ```

3. **Update font configuration**:
   - Open `src/lib/fonts/base-font.ts`
   - Comment out the `Inter` import and export
   - Uncomment the `localFont` code for Coinbase Sans
   - Set `preload: true` for better performance

4. **Restart the dev server**:
   ```bash
   npm run dev
   ```

## Font Usage

The fonts are automatically applied via CSS variables:

- `--font-base-sans`: Primary sans-serif font (Inter or Coinbase Sans)
- `--font-base-mono`: Monospace font (system or Coinbase Mono)

### In Tailwind CSS:

```tsx
// Use sans-serif (default)
<div className="font-sans">Text</div>

// Use monospace
<div className="font-mono">Code</div>
```

### In CSS:

```css
.my-element {
  font-family: var(--font-base-sans);
}

.code-element {
  font-family: var(--font-base-mono);
}
```

## Notes

- Inter is an excellent fallback that closely matches Coinbase Sans
- Base's website uses Inter as a fallback when Coinbase Sans isn't available
- The font setup is optimized for performance with `display: swap`
- Fonts are loaded via Next.js font optimization for best performance

