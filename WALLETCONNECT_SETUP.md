# WalletConnect Project ID Setup

## Why You Need This

The WebSocket error you're seeing (`code: 3000 (Unauthorized: invalid key)`) is because WalletConnect requires a valid Project ID to establish secure connections for wallet integrations.

## How to Get a Free WalletConnect Project ID

1. **Visit WalletConnect Cloud**
   - Go to: https://cloud.walletconnect.com/
   - Sign up for a free account (or sign in if you already have one)

2. **Create a New Project**
   - Click "Create New Project"
   - Enter your project name (e.g., "Web3 Portfolio")
   - Select your project type

3. **Copy Your Project ID**
   - After creating the project, you'll see your Project ID
   - It looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

4. **Add to Your Environment File**
   - Open `.env.local` in your project root
   - Replace `your_project_id_here` with your actual Project ID:
     ```
     NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
     ```

5. **Restart Your Dev Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## Alternative: Development Without WalletConnect

If you want to develop without WalletConnect for now, the app will still run but wallet connections won't work. The warning in the console is informational and won't break your app.

## Troubleshooting

- **Still seeing the error?** Make sure:
  - The Project ID in `.env.local` doesn't have quotes around it
  - You've restarted the dev server after updating `.env.local`
  - The Project ID is correct (no typos)

- **Project ID format:** Should be a long alphanumeric string (usually 32+ characters)

## Need Help?

- WalletConnect Docs: https://docs.walletconnect.com/
- WalletConnect Cloud: https://cloud.walletconnect.com/

