# GitHub Comments Setup Guide (Giscus)

This guide will help you set up GitHub Discussions-based comments for your blog using Giscus.

## Prerequisites

- GitHub repository with Discussions enabled
- Repository must be public

## Step-by-Step Setup

### 1. Enable GitHub Discussions

1. Go to your repository: <https://github.com/eyasir329/neupc>
2. Click on **Settings** tab
3. Scroll down to **Features** section
4. Check the box for **Discussions**
5. Click **Set up discussions** if prompted

### 2. Install Giscus App

1. Visit <https://github.com/apps/giscus>
2. Click **Install**
3. Select **eyasir329/neupc** repository
4. Click **Install & Authorize**

### 3. Configure Giscus

1. Go to <https://giscus.app>
2. Fill in your repository: `eyasir329/neupc`
3. Choose **Discussion Category**:
   - Recommended: Create a new category called "Blog Comments" or use "General"
4. Select **Discussion Mapping**:
   - Recommended: `pathname` (each blog post gets its own discussion)
5. Configure other settings:
   - **Enable reactions**: ✓ Yes
   - **Input position**: Top (so users see comment box first)
   - **Theme**: Dark (to match your site)
   - **Language**: English

### 4. Get Your Configuration IDs

After filling the form on giscus.app, you'll see a code snippet like:

```html
<script src="https://giscus.app/client.js"
        data-repo="eyasir329/neupc"
        data-repo-id="R_kgDOabcdef..."  <!-- Copy this -->
        data-category="Blog Comments"
        data-category-id="DIC_kwDOabcdef..."  <!-- Copy this -->
        ...>
</script>
```

### 5. Update Your Code

Open `app/_components/ui/GiscusComments.js` and replace:

```javascript
script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); 
// Replace with: 'R_kgDOabcdef...'

script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID'); 
// Replace with: 'DIC_kwDOabcdef...'

script.setAttribute('data-category', 'General');
// Replace with your category name, e.g., 'Blog Comments'
```

### 6. Verify Setup

1. Save your changes
2. Visit any blog post page on your site
3. You should see the GitHub comment widget
4. Try posting a test comment (you'll need to sign in with GitHub)

## Features

✅ **GitHub Authentication** - Users sign in with GitHub  
✅ **Reactions** - Like, celebrate, and react to comments  
✅ **Markdown Support** - Full GitHub-flavored markdown  
✅ **Dark Theme** - Matches your site design  
✅ **Moderation** - Manage comments via GitHub Discussions  
✅ **No Database** - Comments stored in GitHub  

## Managing Comments

- View all comments: <https://github.com/eyasir329/neupc/discussions>
- Each blog post creates a new discussion thread
- You can moderate, delete, or lock discussions from GitHub
- Users can edit/delete their own comments

## Customization

You can customize the appearance by modifying `GiscusComments.js`:

- **Theme**: Change `data-theme` to `light`, `dark`, `preferred_color_scheme`, etc.
- **Language**: Change `data-lang` to your preferred language code
- **Reactions**: Set `data-reactions-enabled` to `0` to disable

## Troubleshooting

**Comments not showing?**

- Check that Discussions are enabled in repository settings
- Verify `data-repo-id` and `data-category-id` are correct
- Ensure repository is public
- Check browser console for errors

**Can't post comments?**

- Users need a GitHub account
- Repository must allow discussions from anyone
- Check if discussions are locked

## Security & Privacy

- Comments are public and visible to everyone
- GitHub handles authentication and user data
- You retain full control via GitHub Discussions
- Users can delete their own comments

## Next Steps

1. ✅ Set up Giscus as described above
2. Create community guidelines for comments
3. Pin a welcome discussion in your repository
4. Monitor and engage with community discussions

Need help? Visit <https://giscus.app> for more information.
