# WalletConnect Configuration Fix

## Issue Found
The `.env.local` file contains a placeholder Project ID: `your_project_id_here`

This causes:
- ❌ 403 errors from WalletConnect API
- ❌ 400 errors from pulse.walletconnect.org
- ❌ Wallet connection modal not working properly
- ❌ MetaMask connection errors

## Solution

### Step 1: Get a Free WalletConnect Project ID

1. Go to https://cloud.reown.com/
2. Sign up or log in
3. Create a new project
4. Copy your Project ID (it's a long hex string like `a1b2c3d4e5f6...`)

### Step 2: Update .env.local

Replace the placeholder in `.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

**Important**: Replace `your_actual_project_id_here` with your real Project ID from Reown Cloud.

### Step 3: Restart Dev Server

After updating `.env.local`, restart your dev server:

```bash
npm run dev
```

## Code Changes Made

1. ✅ Removed duplicate AppKit initialization from `config.ts`
2. ✅ Added better Project ID validation
3. ✅ Improved error messages
4. ✅ Added fallback handling for missing Project ID

## Verification

After setting up your Project ID, you should see:
- ✅ No 403 errors in console
- ✅ Wallet connection modal works
- ✅ Can connect MetaMask and other wallets
- ✅ No "your_project_id_here" in network requests

## Temporary Workaround

If you don't have a Project ID yet, the app will:
- Still work for local development
- Show warnings in console
- Use a fallback Project ID (may have limited functionality)
- Wallet connection may not work properly

## Next Steps

1. Get your Project ID from https://cloud.reown.com/
2. Update `.env.local` with the real Project ID
3. Restart the dev server
4. Test wallet connection

