# Vercel Login Instructions

## Option 1: Use Token (Recommended - Non-Interactive)

1. **Get your Vercel token:**
   - Go to: https://vercel.com/account/tokens
   - Click "Create Token"
   - Give it a name (e.g., "sales-tools-verification")
   - Copy the token

2. **Set the token as environment variable:**
   ```bash
   export VERCEL_TOKEN=your_token_here
   ```

3. **Or add to your `.env.local` file:**
   ```bash
   VERCEL_TOKEN=your_token_here
   ```

4. **Verify it works:**
   ```bash
   npx vercel whoami --token $VERCEL_TOKEN
   ```

## Option 2: Interactive Login (Browser-Based)

If you prefer interactive login:

1. **Run the login command:**
   ```bash
   npx vercel login
   ```

2. **It will:**
   - Open your browser automatically
   - Ask you to authorize the CLI
   - Complete authentication in the browser
   - Return to terminal when done

3. **If browser doesn't open, copy the URL it shows and paste in browser**

## Option 3: Use GitHub/GitLab/Bitbucket

```bash
npx vercel login --github
# or
npx vercel login --gitlab
# or
npx vercel login --bitbucket
```

## Verify Login

After logging in, verify with:
```bash
npx vercel whoami
```

You should see your Vercel username/email.

## Next Steps

Once logged in, you can:
1. Link your project: `npx vercel link`
2. List deployments: `npx vercel ls`
3. Run verification: `npm run verify-production -- https://your-app.vercel.app`

