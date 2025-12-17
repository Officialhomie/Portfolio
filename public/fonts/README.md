# Fonts Directory

## Söhne Font from Klim Type Foundry

This directory is for storing custom font files, specifically the **Söhne** font from Klim Type Foundry.

### Setup Instructions

1. **Purchase and Download Söhne Font**
   - Visit: https://klim.co.nz/retail-fonts/soehne
   - Purchase and download the font files

2. **Place Font Files Here**
   Place the following font files in this directory (`/public/fonts/`):
   - `Sohne-Regular.woff2` (weight: 400)
   - `Sohne-Medium.woff2` (weight: 500)
   - `Sohne-Semibold.woff2` (weight: 600)
   - `Sohne-Bold.woff2` (weight: 700)

3. **Enable the Font**
   - Open `src/lib/fonts/base-font.ts`
   - Change `const USE_SOEHNE_FONT = false;` to `const USE_SOEHNE_FONT = true;`
   - Save the file

4. **Restart Dev Server**
   - The font will be automatically loaded and applied site-wide

### File Format Notes

- **Preferred**: `.woff2` format (smaller file size, better compression)
- **Alternative**: `.woff` format (update paths in `base-font.ts` if needed)
- **Conversion**: Use online tools to convert `.ttf` or `.otf` to `.woff2`

### Font Weights Supported

- **400** - Regular
- **500** - Medium  
- **600** - Semibold
- **700** - Bold

### Fallback Behavior

- If Söhne files are not found or `USE_SOEHNE_FONT` is `false`, the system automatically uses **Inter Tight** as the fallback font
- This ensures the site always has a working font

### Font Usage

Once enabled, Söhne will be used throughout the entire application via the CSS variable `--font-base-sans`, which is already configured in `globals.css`.

### Troubleshooting

- **Font not loading?** Check that file names match exactly (case-sensitive)
- **Wrong weights?** Verify the weight values in `base-font.ts` match your font files
- **Build errors?** Ensure all font files are present before enabling `USE_SOEHNE_FONT`

