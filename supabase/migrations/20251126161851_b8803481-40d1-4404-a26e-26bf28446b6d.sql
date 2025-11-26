-- Phase 1: Refonte Multi-Tenants

-- Drop old enum and recreate with new values
DROP TYPE IF EXISTS app_role CASCADE;
CREATE TYPE app_role AS ENUM ('super_admin', 'user');

-- Create org-level role enum
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'student');

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#d97706',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (platform-level roles)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create organization_members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to courses
ALTER TABLE courses ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Drop old role column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Security Definer function to check platform role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security Definer function to check org role
CREATE OR REPLACE FUNCTION has_org_role(_user_id UUID, _org_id UUID, _role org_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = _user_id 
      AND organization_id = _org_id 
      AND role = _role
  )
$$;

-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION get_user_org_role(_user_id UUID, _org_id UUID)
RETURNS org_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;

-- Trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at 
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for organizations
CREATE POLICY "Super admins can manage all organizations"
  ON organizations FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Organization members can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view organizations by slug"
  ON organizations FOR SELECT
  USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Super admins can manage all roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for organization_members
CREATE POLICY "Super admins can manage all memberships"
  ON organization_members FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org owners and admins can manage members"
  ON organization_members FOR ALL
  USING (
    has_org_role(auth.uid(), organization_id, 'owner') OR
    has_org_role(auth.uid(), organization_id, 'admin')
  );

CREATE POLICY "Members can view their own memberships"
  ON organization_members FOR SELECT
  USING (auth.uid() = user_id);

-- Update courses RLS policies for multi-tenant isolation
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON courses;

CREATE POLICY "Super admins can manage all courses"
  ON courses FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org owners and admins can manage their courses"
  ON courses FOR ALL
  USING (
    organization_id IS NOT NULL AND (
      has_org_role(auth.uid(), organization_id, 'owner') OR
      has_org_role(auth.uid(), organization_id, 'admin')
    )
  );

CREATE POLICY "Published courses are viewable by everyone"
  ON courses FOR SELECT
  USING (is_published = true);

-- Update modules RLS policies
DROP POLICY IF EXISTS "Admins can manage all modules" ON modules;
DROP POLICY IF EXISTS "Modules are viewable for published courses" ON modules;

CREATE POLICY "Super admins can manage all modules"
  ON modules FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org owners and admins can manage their modules"
  ON modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
        AND courses.organization_id IS NOT NULL
        AND (
          has_org_role(auth.uid(), courses.organization_id, 'owner') OR
          has_org_role(auth.uid(), courses.organization_id, 'admin')
        )
    )
  );

CREATE POLICY "Modules are viewable for published courses"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id AND courses.is_published = true
    )
  );

-- Update lessons RLS policies
DROP POLICY IF EXISTS "Admins can manage all lessons" ON lessons;
DROP POLICY IF EXISTS "Lessons are viewable for published courses" ON lessons;

CREATE POLICY "Super admins can manage all lessons"
  ON lessons FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org owners and admins can manage their lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
        AND courses.organization_id IS NOT NULL
        AND (
          has_org_role(auth.uid(), courses.organization_id, 'owner') OR
          has_org_role(auth.uid(), courses.organization_id, 'admin')
        )
    )
  );

CREATE POLICY "Lessons are viewable for published courses"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id AND courses.is_published = true
    )
  );

-- Update purchases RLS policies
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;

CREATE POLICY "Super admins can view all purchases"
  ON purchases FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org owners and admins can view their org purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = purchases.course_id
        AND courses.organization_id IS NOT NULL
        AND (
          has_org_role(auth.uid(), courses.organization_id, 'owner') OR
          has_org_role(auth.uid(), courses.organization_id, 'admin')
        )
    )
  );

CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Update user_progress RLS policies
DROP POLICY IF EXISTS "Admins can view all progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

CREATE POLICY "Super admins can view all progress"
  ON user_progress FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org owners and admins can view their org progress"
  ON user_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE lessons.id = user_progress.lesson_id
        AND courses.organization_id IS NOT NULL
        AND (
          has_org_role(auth.uid(), courses.organization_id, 'owner') OR
          has_org_role(auth.uid(), courses.organization_id, 'admin')
        )
    )
  );

CREATE POLICY "Users can manage their own progress"
  ON user_progress FOR ALL
  USING (auth.uid() = user_id);

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org owners and admins can view their members profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.user_id = profiles.id
        AND (
          has_org_role(auth.uid(), organization_members.organization_id, 'owner') OR
          has_org_role(auth.uid(), organization_members.organization_id, 'admin')
        )
    )
  );

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);