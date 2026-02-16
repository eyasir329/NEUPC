-- ========================================
-- NEUPC Database Schema
-- Netrokona University Programming Club
-- ========================================

-- ========================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ========================================

-- Users table (authentication)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('guest', 'member', 'executive', 'admin', 'mentor', 'advisor')),
  description TEXT,
  priority INTEGER NOT NULL, -- Higher number = more privileges
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles (many-to-many)
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For temporary roles
  UNIQUE(user_id, role_id)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'content', 'user', 'system', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions (many-to-many)
CREATE TABLE role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- ========================================
-- 2. MEMBER PROFILE & ACADEMIC DATA
-- ========================================

-- Member profiles (for students)
CREATE TABLE member_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  batch TEXT NOT NULL, -- e.g., "2023"
  department TEXT NOT NULL,
  semester TEXT,
  cgpa DECIMAL(3,2),
  interests TEXT[], -- Programming interests
  linkedin TEXT,
  github TEXT,
  codeforces_handle TEXT,
  vjudge_handle TEXT,
  atcoder_handle TEXT,
  leetcode_handle TEXT,
  skills TEXT[], -- Technical skills
  bio TEXT,
  join_reason TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member statistics (competitive programming stats)
CREATE TABLE member_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL UNIQUE REFERENCES member_profiles(id) ON DELETE CASCADE,
  total_contests INTEGER DEFAULT 0,
  total_problems_solved INTEGER DEFAULT 0,
  codeforces_rating INTEGER,
  codeforces_max_rating INTEGER,
  vjudge_solved INTEGER,
  atcoder_rating INTEGER,
  leetcode_rating INTEGER,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. COMMITTEE & TEAM STRUCTURE
-- ========================================

-- Committee positions
CREATE TABLE committee_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, -- e.g., "President", "Vice President", "Developer Lead"
  category TEXT CHECK (category IN ('executive', 'mentor', 'advisor')),
  display_order INTEGER DEFAULT 0,
  responsibilities TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Committee members
CREATE TABLE committee_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES committee_positions(id),
  term_start DATE NOT NULL,
  term_end DATE,
  is_current BOOLEAN DEFAULT true,
  bio TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. EVENTS & ACTIVITIES
-- ========================================

-- Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Full event details/agenda
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT NOT NULL,
  venue_type TEXT CHECK (venue_type IN ('online', 'offline', 'hybrid')) DEFAULT 'offline',
  cover_image TEXT,
  banner_image TEXT,
  registration_url TEXT,
  external_url TEXT,
  category TEXT CHECK (category IN ('Workshop', 'Contest', 'Seminar', 'Bootcamp', 'Hackathon', 'Meetup', 'Other')),
  status TEXT CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'draft',
  max_participants INTEGER,
  registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event organizers (many-to-many)
CREATE TABLE event_organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT, -- 'lead', 'coordinator', 'volunteer', etc.
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Event registrations
CREATE TABLE event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_name TEXT, -- For team events
  team_members TEXT[], -- For team events
  registration_data JSONB, -- Additional fields (phone, t-shirt size, etc.)
  status TEXT CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended')) DEFAULT 'registered',
  attended BOOLEAN DEFAULT false,
  certificate_issued BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Event gallery
CREATE TABLE event_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video')) DEFAULT 'image',
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. CONTESTS & COMPETITIONS
-- ========================================

-- Contests
CREATE TABLE contests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT, -- 'Codeforces', 'Vjudge', 'Internal', etc.
  contest_url TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  type TEXT CHECK (type IN ('individual', 'team')) DEFAULT 'individual',
  division TEXT, -- 'Div 1', 'Div 2', 'Open', etc.
  status TEXT CHECK (status IN ('upcoming', 'running', 'finished')) DEFAULT 'upcoming',
  is_official BOOLEAN DEFAULT false, -- NEUPC official contest
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contest participants
CREATE TABLE contest_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER,
  score DECIMAL(10,2),
  problems_solved INTEGER,
  performance_data JSONB, -- Detailed performance metrics
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

-- Weekly tasks (for mentorship program)
CREATE TABLE weekly_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  problem_links TEXT[], -- Array of problem URLs
  deadline TIMESTAMPTZ NOT NULL,
  assigned_by UUID NOT NULL REFERENCES users(id),
  target_audience TEXT, -- 'all', 'beginners', 'intermediates', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task submissions
CREATE TABLE task_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES weekly_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_url TEXT,
  code TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'late', 'missed')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- ========================================
-- 6. ACHIEVEMENTS & CERTIFICATIONS
-- ========================================

-- Achievements
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  contest_name TEXT NOT NULL,
  contest_url TEXT,
  result TEXT NOT NULL, -- e.g., "1st Place", "Top 10"
  year INTEGER NOT NULL,
  category TEXT, -- 'ICPC', 'National', 'International', 'Online'
  description TEXT,
  achievement_date DATE,
  participants TEXT[], -- Names of participants
  is_team BOOLEAN DEFAULT false,
  team_name TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member achievements (link users to achievements)
CREATE TABLE member_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position TEXT, -- Individual position if team event
  UNIQUE(achievement_id, user_id)
);

-- Certificates
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id),
  contest_id UUID REFERENCES contests(id),
  achievement_id UUID REFERENCES achievements(id),
  title TEXT NOT NULL,
  description TEXT,
  certificate_type TEXT CHECK (certificate_type IN ('participation', 'completion', 'achievement', 'appreciation')) DEFAULT 'participation',
  certificate_url TEXT, -- PDF/Image URL
  issue_date DATE NOT NULL,
  issued_by UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 7. CONTENT MANAGEMENT
-- ========================================

-- Blog posts
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail TEXT,
  author_id UUID NOT NULL REFERENCES users(id),
  category TEXT CHECK (category IN ('CP', 'WebDev', 'AI-ML', 'Career', 'News', 'Tutorial', 'Other')),
  tags TEXT[],
  read_time INTEGER, -- in minutes
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog comments
CREATE TABLE blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE, -- For nested comments
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roadmaps
CREATE TABLE roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'CP', 'Web Development', 'Machine Learning', etc.
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  thumbnail TEXT,
  content JSONB, -- Roadmap structure (nodes, connections)
  estimated_duration TEXT, -- "3 months", "6 months"
  prerequisites TEXT[],
  created_by UUID REFERENCES users(id),
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('article', 'video', 'course', 'book', 'tool', 'documentation', 'other')) DEFAULT 'article',
  category TEXT NOT NULL, -- 'CP', 'Web Development', etc.
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  thumbnail TEXT,
  is_free BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notices/Announcements
CREATE TABLE notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  notice_type TEXT CHECK (notice_type IN ('general', 'urgent', 'event', 'deadline', 'achievement')) DEFAULT 'general',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  target_audience TEXT[], -- ['member', 'executive', 'all']
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  attachments TEXT[], -- URLs to attached files
  created_by UUID NOT NULL REFERENCES users(id),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery
CREATE TABLE gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video')) DEFAULT 'image',
  caption TEXT,
  event_id UUID REFERENCES events(id),
  category TEXT, -- 'events', 'team', 'achievements', 'misc'
  tags TEXT[],
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 8. MENTORSHIP PROGRAM
-- ========================================

-- Mentor-mentee relationships
CREATE TABLE mentorships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  focus_area TEXT, -- 'Competitive Programming', 'Web Dev', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_id)
);

-- Mentorship sessions
CREATE TABLE mentorship_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL,
  duration INTEGER, -- in minutes
  topic TEXT,
  notes TEXT,
  attended BOOLEAN DEFAULT false,
  feedback TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress tracking
CREATE TABLE member_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'weekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  problems_solved INTEGER DEFAULT 0,
  contests_participated INTEGER DEFAULT 0,
  rating_change INTEGER,
  mentor_notes TEXT,
  self_assessment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period, start_date)
);

-- ========================================
-- 9. DISCUSSIONS & COMMUNITY
-- ========================================

-- Discussion categories
CREATE TABLE discussion_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion threads
CREATE TABLE discussion_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES discussion_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_solved BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion replies
CREATE TABLE discussion_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE, -- For nested replies
  is_solution BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion votes
CREATE TABLE discussion_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, thread_id),
  UNIQUE(user_id, reply_id)
);

-- ========================================
-- 10. FORMS & SUBMISSIONS
-- ========================================

-- Contact submissions
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('new', 'read', 'replied', 'archived')) DEFAULT 'new',
  replied_by UUID REFERENCES users(id),
  replied_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join requests
CREATE TABLE join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  student_id TEXT NOT NULL,
  batch TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT,
  interests TEXT,
  codeforces_handle TEXT,
  github TEXT,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 11. SYSTEM & SETTINGS
-- ========================================

-- Website settings
CREATE TABLE website_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT, -- 'general', 'social', 'email', 'features'
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs (audit trail)
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  entity_type TEXT, -- 'event', 'blog', 'user', etc.
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'event', 'mention', 'achievement')),
  link TEXT, -- URL to related resource
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget tracking (for advisor oversight)
CREATE TABLE budget_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  entry_type TEXT CHECK (entry_type IN ('income', 'expense')) NOT NULL,
  category TEXT, -- 'event', 'equipment', 'prize', 'miscellaneous'
  event_id UUID REFERENCES events(id),
  transaction_date DATE NOT NULL,
  receipt_url TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- User roles indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- Member profiles indexes
CREATE INDEX idx_member_profiles_user ON member_profiles(user_id);
CREATE INDEX idx_member_profiles_batch ON member_profiles(batch);
CREATE INDEX idx_member_profiles_approved ON member_profiles(approved);

-- Events indexes
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_featured ON events(is_featured);

-- Event organizers indexes
CREATE INDEX idx_event_organizers_event ON event_organizers(event_id);
CREATE INDEX idx_event_organizers_user ON event_organizers(user_id);

-- Blog posts indexes
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);

-- Contests indexes
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_start_time ON contests(start_time);

-- Achievements indexes
CREATE INDEX idx_achievements_year ON achievements(year);

-- Notices indexes
CREATE INDEX idx_notices_created ON notices(created_at);
CREATE INDEX idx_notices_expires ON notices(expires_at);
CREATE INDEX idx_notices_pinned ON notices(is_pinned);

-- Discussions indexes
CREATE INDEX idx_discussion_threads_category ON discussion_threads(category_id);
CREATE INDEX idx_discussion_threads_author ON discussion_threads(author_id);
CREATE INDEX idx_discussion_replies_thread ON discussion_replies(thread_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Public read policies (no authentication required)
CREATE POLICY "Allow public read" ON events FOR SELECT USING (status = 'upcoming' OR status = 'ongoing' OR status = 'completed');
CREATE POLICY "Allow public read" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Allow public read" ON achievements FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON committee_members FOR SELECT USING (is_current = true);
CREATE POLICY "Allow public read" ON resources FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON gallery_items FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON roadmaps FOR SELECT USING (status = 'published');

-- Allow public submissions
CREATE POLICY "Allow public insert" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON join_requests FOR INSERT WITH CHECK (true);

-- Member policies (authenticated users)
CREATE POLICY "Members can read own profile" ON member_profiles FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('executive', 'admin')
  ));

CREATE POLICY "Members can update own profile" ON member_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- ========================================
-- TRIGGERS & FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update updated_at timestamp for users table
-- Skips updating updated_at when only last_login is changed
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if fields other than last_login have changed
  IF (NEW.email IS DISTINCT FROM OLD.email OR
      NEW.full_name IS DISTINCT FROM OLD.full_name OR
      NEW.phone IS DISTINCT FROM OLD.phone OR
      NEW.avatar IS DISTINCT FROM OLD.avatar OR
      NEW.email_verified IS DISTINCT FROM OLD.email_verified OR
      NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_users_updated_at_column();

CREATE TRIGGER update_member_profiles_updated_at BEFORE UPDATE ON member_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_threads_updated_at BEFORE UPDATE ON discussion_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync member statistics
CREATE OR REPLACE FUNCTION sync_member_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO member_statistics (member_id, last_sync_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (member_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_member_statistics AFTER INSERT ON member_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_member_statistics();

-- Function to log important activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    NEW.created_by, 
    TG_OP, 
    TG_TABLE_NAME, 
    NEW.id,
    jsonb_build_object('title', NEW.title)
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- SEED DATA
-- ========================================

-- Insert default roles
INSERT INTO roles (name, description, priority) VALUES
('guest', 'Guest visitor with limited access', 1),
('member', 'Regular club member with full member features', 2),
('executive', 'Club executive with management capabilities', 4),
('mentor', 'Mentor guiding club members', 3),
('advisor', 'Faculty advisor with oversight capabilities', 5),
('admin', 'System administrator with full access', 6);

-- Insert default permissions
INSERT INTO permissions (name, category, description) VALUES
-- Content permissions
('content.create', 'content', 'Create content (blogs, events, etc.)'),
('content.edit', 'content', 'Edit content'),
('content.delete', 'content', 'Delete content'),
('content.publish', 'content', 'Publish content'),

-- User permissions
('users.view', 'user', 'View user profiles'),
('users.edit', 'user', 'Edit user profiles'),
('users.delete', 'user', 'Delete users'),
('users.manage_roles', 'user', 'Manage user roles'),

-- System permissions
('system.settings', 'system', 'Access system settings'),
('system.logs', 'system', 'View system logs'),
('system.backup', 'system', 'Create backups');

-- Insert discussion categories
INSERT INTO discussion_categories (name, description, display_order) VALUES
('General', 'General discussions about programming', 1),
('Problem Solving', 'Discuss competitive programming problems', 2),
('Career Guidance', 'Career and internship discussions', 3),
('Technology', 'Latest tech news and trends', 4),
('Help & Support', 'Get help with technical issues', 5);

-- Insert website settings
INSERT INTO website_settings (key, value, category, description) VALUES
('site_name', '"NEUPC"', 'general', 'Website name'),
('site_description', '"Netrokona University Programming Club"', 'general', 'Site description'),
('registration_open', 'true', 'features', 'Allow new member registrations'),
('mentorship_program_active', 'true', 'features', 'Mentorship program status');

-- ========================================
-- VIEWS (for analytics)
-- ========================================

-- Active members view
CREATE VIEW active_members AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  mp.student_id,
  mp.batch,
  mp.department,
  ms.total_contests,
  ms.total_problems_solved,
  ms.codeforces_rating
FROM users u
JOIN member_profiles mp ON u.id = mp.user_id
LEFT JOIN member_statistics ms ON mp.id = ms.member_id
WHERE u.is_active = true AND mp.approved = true;

-- Event statistics view
CREATE VIEW event_statistics AS
SELECT 
  e.id,
  e.title,
  e.category,
  e.start_date,
  COUNT(DISTINCT er.id) as total_registrations,
  COUNT(DISTINCT CASE WHEN er.attended THEN er.id END) as total_attended
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id;

-- Member leaderboard view
CREATE VIEW member_leaderboard AS
SELECT 
  u.full_name,
  mp.batch,
  ms.codeforces_rating,
  ms.total_problems_solved,
  ms.total_contests,
  COUNT(DISTINCT cp.id) as neupc_contests_participated
FROM users u
JOIN member_profiles mp ON u.id = mp.user_id
LEFT JOIN member_statistics ms ON mp.id = ms.member_id
LEFT JOIN contest_participants cp ON u.id = cp.user_id
WHERE mp.approved = true
GROUP BY u.id, u.full_name, mp.batch, ms.codeforces_rating, ms.total_problems_solved, ms.total_contests
ORDER BY ms.codeforces_rating DESC NULLS LAST;
