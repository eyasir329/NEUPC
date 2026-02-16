# Database Quick Reference

Quick reference guide for NEUPC database operations.

## 🚀 Quick Start

### Setup Database

```bash
# 1. Copy .env.example to .env.local
cp .env.example .env.local

# 2. Add your Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 3. Run schema in Supabase SQL Editor
# Copy and paste contents of docs/database-schema.sql
```

## 📋 Common Queries

### User Management

```javascript
// Get user by email
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'user@example.com')
  .single();

// Get user with roles
const { data: user } = await supabase
  .from('users')
  .select(`
    *,
    user_roles(
      roles(name, description)
    )
  `)
  .eq('id', userId)
  .single();

// Check if user has role
const { data } = await supabase
  .from('user_roles')
  .select('roles(name)')
  .eq('user_id', userId)
  .eq('roles.name', 'admin');
```

### Member Profiles

```javascript
// Get member profile with statistics
const { data: member } = await supabase
  .from('member_profiles')
  .select(`
    *,
    member_statistics(*),
    users(full_name, email, avatar)
  `)
  .eq('user_id', userId)
  .single();

// Get all approved members with stats
const { data: members } = await supabase
  .from('member_profiles')
  .select(`
    *,
    member_statistics(*),
    users(full_name, avatar)
  `)
  .eq('approved', true)
  .order('created_at', { ascending: false });

// Update member statistics
const { data, error } = await supabase
  .from('member_statistics')
  .update({
    codeforces_rating: 1500,
    total_problems_solved: 250,
    last_sync_at: new Date().toISOString()
  })
  .eq('member_id', memberId);
```

### Events

```javascript
// Get upcoming events
const { data: events } = await supabase
  .from('events')
  .select(`
    *,
    event_registrations(count)
  `)
  .eq('status', 'upcoming')
  .order('start_date', { ascending: true });

// Register for event
const { data, error } = await supabase
  .from('event_registrations')
  .insert({
    event_id: eventId,
    user_id: userId,
    registration_data: {
      phone: '+1234567890',
      tshirt_size: 'L'
    }
  });

// Get event with registrations and organizers
const { data: event } = await supabase
  .from('events')
  .select(`
    *,
    event_organizers(
      role,
      users(full_name, email, avatar)
    ),
    event_registrations(
      *,
      users(full_name, email)
    ),
    event_gallery(*)
  `)
  .eq('slug', eventSlug)
  .single();

// Add organizer to event
const { data, error } = await supabase
  .from('event_organizers')
  .insert({
    event_id: eventId,
    user_id: userId,
    role: 'coordinator'
  });

// Check if user registered
const { data } = await supabase
  .from('event_registrations')
  .select('*')
  .eq('event_id', eventId)
  .eq('user_id', userId)
  .single();
```

### Blog Posts

```javascript
// Get published blog posts with author
const { data: posts } = await supabase
  .from('blog_posts')
  .select(`
    *,
    users:author_id(full_name, avatar)
  `)
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(10);

// Get single post with comments
const { data: post } = await supabase
  .from('blog_posts')
  .select(`
    *,
    users:author_id(full_name, avatar),
    blog_comments(
      *,
      users(full_name, avatar)
    )
  `)
  .eq('slug', postSlug)
  .single();

// Increment view count
const { data, error } = await supabase
  .rpc('increment_views', { post_id: postId });

// Or manually:
const { data, error } = await supabase
  .from('blog_posts')
  .update({ views: supabase.sql`views + 1` })
  .eq('id', postId);
```

### Contests

```javascript
// Get upcoming contests
const { data: contests } = await supabase
  .from('contests')
  .select('*')
  .gte('start_time', new Date().toISOString())
  .order('start_time', { ascending: true });

// Register for contest
const { data, error } = await supabase
  .from('contest_participants')
  .insert({
    contest_id: contestId,
    user_id: userId
  });

// Get contest leaderboard
const { data: leaderboard } = await supabase
  .from('contest_participants')
  .select(`
    *,
    users(full_name, avatar),
    member_profiles(batch)
  `)
  .eq('contest_id', contestId)
  .order('rank', { ascending: true });
```

### Achievements

```javascript
// Get recent achievements
const { data: achievements } = await supabase
  .from('achievements')
  .select(`
    *,
    member_achievements(
      users(full_name, avatar)
    )
  `)
  .order('year', { ascending: false })
  .limit(10);

// Get user achievements
const { data: userAchievements } = await supabase
  .from('member_achievements')
  .select(`
    *,
    achievements(*)
  `)
  .eq('user_id', userId);

// Add achievement
const { data: achievement, error } = await supabase
  .from('achievements')
  .insert({
    title: 'ICPC Regional 2024',
    contest_name: 'ICPC Asia Dhaka Regional',
    result: '15th Place',
    year: 2024,
    category: 'ICPC',
    is_team: true,
    team_name: 'NEUPC Alpha'
  })
  .select()
  .single();

// Link members to achievement
const { data, error } = await supabase
  .from('member_achievements')
  .insert([
    { achievement_id: achievement.id, user_id: user1Id },
    { achievement_id: achievement.id, user_id: user2Id },
    { achievement_id: achievement.id, user_id: user3Id }
  ]);
```

### Mentorship

```javascript
// Get mentor's mentees
const { data: mentorships } = await supabase
  .from('mentorships')
  .select(`
    *,
    mentee:mentee_id(
      full_name,
      avatar,
      member_profiles(batch, department)
    )
  `)
  .eq('mentor_id', mentorId)
  .eq('status', 'active');

// Get mentorship sessions
const { data: sessions } = await supabase
  .from('mentorship_sessions')
  .select('*')
  .eq('mentorship_id', mentorshipId)
  .order('session_date', { ascending: false });

// Track weekly progress
const { data, error } = await supabase
  .from('member_progress')
  .insert({
    user_id: userId,
    period: 'weekly',
    start_date: '2024-02-12',
    end_date: '2024-02-18',
    problems_solved: 15,
    contests_participated: 2,
    rating_change: 50
  });
```

### Discussions

```javascript
// Get discussion threads by category
const { data: threads } = await supabase
  .from('discussion_threads')
  .select(`
    *,
    author:author_id(full_name, avatar),
    discussion_replies(count)
  `)
  .eq('category_id', categoryId)
  .order('is_pinned', { ascending: false })
  .order('created_at', { ascending: false });

// Get thread with replies
const { data: thread } = await supabase
  .from('discussion_threads')
  .select(`
    *,
    author:author_id(full_name, avatar),
    discussion_replies(
      *,
      author:author_id(full_name, avatar)
    )
  `)
  .eq('id', threadId)
  .single();

// Create thread
const { data, error } = await supabase
  .from('discussion_threads')
  .insert({
    category_id: categoryId,
    title: 'How to solve DP problems?',
    content: 'I am struggling with dynamic programming...',
    author_id: userId,
    tags: ['dp', 'help', 'algorithms']
  });
```

### Notifications

```javascript
// Get unread notifications
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false })
  .limit(20);

// Mark as read
const { data, error } = await supabase
  .from('notifications')
  .update({ 
    is_read: true,
    read_at: new Date().toISOString()
  })
  .eq('id', notificationId);

// Create notification
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: targetUserId,
    title: 'New Event',
    message: 'Workshop on Graph Algorithms starting tomorrow!',
    notification_type: 'event',
    link: '/events/graph-workshop'
  });
```

## 🔐 Authentication

### Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});
```

### Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
});
```

### Get Current User

```javascript
const { data: { user } } = await supabase.auth.getUser();
```

### Sign Out

```javascript
const { error } = await supabase.auth.signOut();
```

## 🔍 Advanced Queries

### Full-Text Search

```javascript
// Search blog posts
const { data: posts } = await supabase
  .from('blog_posts')
  .select('*')
  .textSearch('title', 'algorithm', {
    type: 'websearch',
    config: 'english'
  });
```

### Aggregations

```javascript
// Count registrations per event
const { data, count } = await supabase
  .from('event_registrations')
  .select('event_id', { count: 'exact' })
  .eq('status', 'confirmed');

// Get statistics
const { data } = await supabase
  .from('member_statistics')
  .select('codeforces_rating.avg(), total_problems_solved.sum()');
```

### Joins & Relations

```javascript
// Complex join with multiple tables
const { data } = await supabase
  .from('events')
  .select(`
    *,
    created_by:users!events_created_by_fkey(full_name),
    event_registrations(
      count,
      users(full_name)
    ),
    event_gallery(url)
  `)
  .eq('status', 'upcoming');
```

### Filters

```javascript
// Multiple filters
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('category', 'Workshop')
  .gte('start_date', '2024-01-01')
  .lte('start_date', '2024-12-31')
  .contains('tags', ['beginner']);

// OR conditions
const { data } = await supabase
  .from('events')
  .select('*')
  .or('status.eq.upcoming,status.eq.ongoing');
```

## 🛠️ Utility Functions

### Create Custom RPC

```sql
-- Add to Supabase SQL Editor

-- Increment view count
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts 
  SET views = views + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Get member leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  batch TEXT,
  codeforces_rating INTEGER,
  total_problems_solved INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    mp.batch,
    ms.codeforces_rating,
    ms.total_problems_solved
  FROM users u
  JOIN member_profiles mp ON u.id = mp.user_id
  LEFT JOIN member_statistics ms ON mp.id = ms.member_id
  WHERE mp.approved = true
  ORDER BY ms.codeforces_rating DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

### Use in JavaScript

```javascript
// Call RPC function
const { data, error } = await supabase
  .rpc('get_leaderboard', { limit_count: 50 });
```

## 📊 Common Patterns

### Pagination

```javascript
const PAGE_SIZE = 20;
const page = 0;

const { data, error, count } = await supabase
  .from('blog_posts')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

### Real-time Subscriptions

```javascript
// Subscribe to new blog posts
const subscription = supabase
  .channel('blog_posts')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'blog_posts' 
    }, 
    (payload) => {
      console.log('New post:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

### Error Handling

```javascript
async function getEvent(slug) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    throw new Error('Event not found');
  }

  return data;
}
```

## 🔗 Related Documentation

- [Database Schema](./database-schema.sql) - Complete SQL schema
- [Database Documentation](./database-documentation.md) - Detailed documentation
- [Next.js Setup Guide](./nextjs-project-setup.md) - Project setup instructions
- [Supabase Docs](https://supabase.com/docs) - Official Supabase documentation

## 💡 Tips

1. **Always use parameterized queries** to prevent SQL injection
2. **Use select('*')** sparingly - specify needed columns for better performance
3. **Use RLS policies** to secure data access
4. **Index frequently queried columns** for faster queries
5. **Use transactions** for operations that modify multiple tables
6. **Cache query results** when appropriate (React Query, SWR)
7. **Use foreign key constraints** to maintain data integrity
8. **Regular backups** - automate with Supabase or cron jobs
