# How to Use the CMS (Content Management System)

Your website has a built-in CMS that runs **locally on your computer**. This means you can easily add and edit poems, articles, and life stories without touching code files directly.

## How to Access the CMS

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **In a NEW terminal window, start the CMS backend:**
   ```bash
   npm run cms
   ```

3. **Open your browser and go to:**
   ```
   http://localhost:4321/admin
   ```

4. **You'll see the CMS interface where you can:**
   - Add new poems
   - Add new engineering articles
   - Add new life stories
   - Edit existing content
   - Upload images

## How to Publish Your Changes

After adding/editing content in the CMS:

1. **Stop the servers** (Ctrl+C in both terminal windows)

2. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add new poem: [poem title]"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin master
   ```

4. **Wait 1-2 minutes** - GitHub Actions will automatically deploy your changes to https://amitkyadav.com

## Important Notes

- ✅ **100% Free** - No additional services needed
- ✅ **Secure** - Only accessible on your local machine
- ✅ **Automatic Deployment** - Push to GitHub and it deploys to Hostinger automatically
- ✅ **No hosting changes** - Your site stays on Hostinger

## Example Workflow

1. You want to add a new Hindi poem
2. Run `npm run dev` and `npm run cms`
3. Go to http://localhost:4321/admin
4. Click "Poet" → "New Poet"
5. Fill in title, date, excerpt, and your poem
6. Click "Save"
7. Stop servers, commit, and push to GitHub
8. Your new poem appears on https://amitkyadav.com/poet in 1-2 minutes!

## Need Help?

If you have any issues, the content files are stored in:
- `src/content/poet/` - Poems
- `src/content/engineer/` - Technical articles
- `src/content/life/` - Life stories

You can also edit these Markdown files directly if needed.
