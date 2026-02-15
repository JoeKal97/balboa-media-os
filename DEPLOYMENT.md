# Balboa Media OS - Deployment Guide

## Step-by-Step Setup

### Phase 1: Supabase Schema Setup

1. Go to your Supabase project: https://app.supabase.com/
2. Click "SQL Editor" in the left sidebar
3. Click "+ New Query"
4. Copy the entire contents of `supabase/schema.sql` into the editor
5. Click "Run" to execute the migration
6. Verify tables were created in the "Tables" section

### Phase 2: GitHub Repository

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name: `balboa-media-os`
   - Description: "Newsletter Issue Operations Command Center"
   - Public
   - **Do NOT initialize with README** (we already have one)
   - Click "Create repository"

2. Add remote and push code:
   ```bash
   cd C:\Users\Administrator\.openclaw\workspace\balboa-media-os
   git remote add origin https://github.com/JoeKal97/balboa-media-os.git
   git branch -M main
   git push -u origin main
   ```

3. Verify files appear on GitHub

### Phase 3: Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cbjjskzwcufpjceygimf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzc2NDIsImV4cCI6MjA4Njc1MzY0Mn0.ogHa14xD2jjDIMVRDeQ586pYuAmW688Hw8tIHDIIP5s
   ```

3. **Do NOT commit `.env.local`** to GitHub (it's in `.gitignore`)

### Phase 4: Local Development Test

```bash
cd C:\Users\Administrator\.openclaw\workspace\balboa-media-os

# Install dependencies
npm install

# Run development server
npm run dev
```

**Test checklist:**
- [ ] Open http://localhost:3000
- [ ] See "Balboa Media OS" header
- [ ] Publication dropdown shows 4 publications
- [ ] Countdown timer displays and updates every second
- [ ] Click refresh button - no errors
- [ ] Add article title to a slot
- [ ] Change slot status
- [ ] Toggle a checklist item
- [ ] Verify risk score updates
- [ ] Navigate to /planning
- [ ] See all 4 publications in table
- [ ] No console errors (F12 → Console)

If all pass, local setup is working!

### Phase 5: Vercel Deployment

**Option A: Via Dashboard (Recommended)**

1. Go to https://vercel.com/new
2. Click "Continue with GitHub"
3. Authorize Vercel
4. Search for `balboa-media-os` repo
5. Click "Import"
6. In "Environment Variables" section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: (paste from `.env.local`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (paste from `.env.local`)
7. Click "Deploy"
8. Wait for build to complete
9. You'll get a URL like: `https://balboa-media-os-xxxxx.vercel.app`

**Option B: Via Vercel CLI**

```bash
npm install -g vercel
cd C:\Users\Administrator\.openclaw\workspace\balboa-media-os
vercel
```

Follow prompts:
- Link to existing project? → No
- Project name? → balboa-media-os
- Framework? → Next.js
- Build command? → (press enter for default)
- Install command? → (press enter for default)
- Build output directory? → (press enter for default)
- Environment variables? → Yes, add the two Supabase vars

### Phase 6: Production Testing

1. Open your deployed URL
2. Test all features again (same checklist as Phase 4)
3. Verify countdown timer still works
4. Mark an issue ready
5. Mark it sent
6. Check issue history updated
7. Switch to /planning view
8. Verify all publications visible

### Phase 7: Automatic Redeployment

Any push to `main` branch on GitHub will automatically trigger a Vercel redeploy:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Watch Vercel dashboard for deployment status.

---

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Check `.env.local` exists and has correct values
- For local dev: restart `npm run dev` after env changes
- For Vercel: check Environment Variables in project settings
- Make sure variable names are **exactly** spelled correctly

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install
npm install @supabase/supabase-js
```

### "Table does not exist"
- Check Supabase SQL migration ran successfully
- Verify in Supabase SQL Editor that tables exist
- Check table names (publications, issues, issue_article_slots, issue_checklists)

### Countdown shows NaN
- Ensure issue.send_datetime_local is a valid ISO timestamp
- Check browser console for errors

### "Mark Ready" button always disabled
- Ensure all checklist items are checked
- Ensure no article slots are "missing"
- Risk score should be 0-1 for ready button to work

### Vercel build fails
- Check build logs in Vercel dashboard
- Usually due to missing env vars or TypeScript errors
- Run `npm run build` locally to debug

---

## Next Steps After Deployment

1. **Set up GitHub Actions (Optional):**
   - Add automated testing on push
   - Documentation in `.github/workflows/`

2. **Monitor Production:**
   - Check Vercel Analytics dashboard
   - Monitor Supabase usage in project settings
   - Set up error alerts (Vercel → Integrations)

3. **Phase 2 Features (When Ready):**
   - Browser notifications 24h before send
   - GCC integration for Facebook ad spend
   - Email reminders
   - SEO auto-checking

4. **Share with Team:**
   - Deployed URL: `https://balboa-media-os-[PROJECT].vercel.app`
   - No authentication needed (assumes internal tool)
   - Bookmark for daily use

---

## Key URLs to Keep Handy

- **GitHub Repo**: https://github.com/JoeKal97/balboa-media-os
- **Vercel Project**: https://vercel.com/dashboard
- **Supabase Project**: https://app.supabase.com/
- **Deployed App**: (will be provided after Vercel deployment)

---

## Cost Estimate (Free Tier)

- **Vercel**: Free tier covers 100GB bandwidth/month
- **Supabase**: Free tier covers 500MB storage, 2GB bandwidth/month
- **Estimated monthly spend**: $0 (well under free limits)

---

## Support

If you hit issues:

1. Check this DEPLOYMENT.md first
2. Review README.md for feature documentation
3. Check Supabase SQL for schema errors
4. Check Vercel logs for build/runtime errors
5. Browser console (F12) for client-side errors
