-- LexReport Studio Initial Schema
-- Generated: 2025-11-13

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE section_type AS ENUM (
  'title_page',
  'executive_summary',
  'table_of_contents',
  'introduction',
  'background',
  'analysis',
  'findings',
  'discussion',
  'methodology',
  'recommendations',
  'conclusion',
  'appendix',
  'exhibit',
  'references',
  'glossary',
  'acknowledgments',
  'custom'
);

CREATE TYPE citation_type AS ENUM ('footnote', 'exhibit', 'figure');
CREATE TYPE citation_style AS ENUM ('footnote', 'apa', 'mla', 'bluebook', 'custom');
CREATE TYPE asset_type AS ENUM ('image', 'chart', 'table', 'video', 'interactive', 'file');
CREATE TYPE user_role AS ENUM ('owner', 'editor', 'viewer');

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role user_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Theme configurations
CREATE TABLE theme_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  fonts JSONB NOT NULL DEFAULT '{
    "heading": "Inter",
    "body": "Inter",
    "mono": "JetBrains Mono"
  }'::jsonb,
  colors JSONB NOT NULL DEFAULT '{
    "background": "#FFFFFF",
    "foreground": "#000000",
    "primary": "#1a1a1a",
    "secondary": "#6b7280",
    "accent": "#8b5cf6",
    "muted": "#f3f4f6",
    "border": "#e5e7eb"
  }'::jsonb,
  spacing_scale JSONB NOT NULL DEFAULT '[0, 4, 8, 12, 16, 24, 32, 48, 64]'::jsonb,
  border_radius_scale JSONB NOT NULL DEFAULT '[0, 2, 4, 6, 8, 12, 16]'::jsonb,
  typography JSONB NOT NULL DEFAULT '{
    "h1": {"size": "2.5rem", "weight": "700", "lineHeight": "1.2"},
    "h2": {"size": "2rem", "weight": "600", "lineHeight": "1.3"},
    "h3": {"size": "1.5rem", "weight": "600", "lineHeight": "1.4"},
    "h4": {"size": "1.25rem", "weight": "600", "lineHeight": "1.5"},
    "body": {"size": "1rem", "weight": "400", "lineHeight": "1.6"},
    "small": {"size": "0.875rem", "weight": "400", "lineHeight": "1.5"}
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  meta JSONB DEFAULT '{
    "audience": null,
    "purpose": null,
    "version": "1.0.0"
  }'::jsonb,
  theme_config_id UUID REFERENCES theme_configs(id),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  viewer_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  type section_type NOT NULL,
  title TEXT,
  order_index INTEGER NOT NULL,
  parent_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  style_overrides JSONB,
  interaction_hints JSONB,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sections_order_unique UNIQUE(report_id, order_index)
);

-- Citations table
CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  citation_type citation_type NOT NULL,
  style citation_style NOT NULL,
  label TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  normalized_text TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visual assets table
CREATE TABLE visual_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  asset_type asset_type NOT NULL,
  title TEXT,
  caption TEXT,
  alt_text TEXT,
  storage_path TEXT,
  embed_code TEXT,
  data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_slug ON reports(slug);
CREATE INDEX idx_reports_deleted ON reports(is_deleted, deleted_at);
CREATE INDEX idx_sections_report_id ON sections(report_id);
CREATE INDEX idx_sections_parent_id ON sections(parent_id);
CREATE INDEX idx_sections_order ON sections(report_id, order_index);
CREATE INDEX idx_citations_report_id ON citations(report_id);
CREATE INDEX idx_visual_assets_report_id ON visual_assets(report_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citations_updated_at BEFORE UPDATE ON citations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visual_assets_updated_at BEFORE UPDATE ON visual_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theme_configs_updated_at BEFORE UPDATE ON theme_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (created_by = auth.uid() OR published = TRUE);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their own reports" ON reports FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete their own reports" ON reports FOR DELETE USING (created_by = auth.uid());

-- Sections policies
CREATE POLICY "Users can view sections of accessible reports" ON sections FOR SELECT
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = sections.report_id AND (reports.created_by = auth.uid() OR reports.published = TRUE)));
CREATE POLICY "Users can create sections in their reports" ON sections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM reports WHERE reports.id = sections.report_id AND reports.created_by = auth.uid()));
CREATE POLICY "Users can update sections in their reports" ON sections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = sections.report_id AND reports.created_by = auth.uid()));
CREATE POLICY "Users can delete sections in their reports" ON sections FOR DELETE
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = sections.report_id AND reports.created_by = auth.uid()));

-- Citations policies
CREATE POLICY "Users can view citations of accessible reports" ON citations FOR SELECT
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = citations.report_id AND (reports.created_by = auth.uid() OR reports.published = TRUE)));
CREATE POLICY "Users can create citations in their reports" ON citations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM reports WHERE reports.id = citations.report_id AND reports.created_by = auth.uid()));
CREATE POLICY "Users can update citations in their reports" ON citations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = citations.report_id AND reports.created_by = auth.uid()));
CREATE POLICY "Users can delete citations in their reports" ON citations FOR DELETE
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = citations.report_id AND reports.created_by = auth.uid()));

-- Visual assets policies
CREATE POLICY "Users can view assets of accessible reports" ON visual_assets FOR SELECT
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = visual_assets.report_id AND (reports.created_by = auth.uid() OR reports.published = TRUE)));
CREATE POLICY "Users can create assets in their reports" ON visual_assets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM reports WHERE reports.id = visual_assets.report_id AND reports.created_by = auth.uid()));
CREATE POLICY "Users can update assets in their reports" ON visual_assets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = visual_assets.report_id AND reports.created_by = auth.uid()));
CREATE POLICY "Users can delete assets in their reports" ON visual_assets FOR DELETE
  USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = visual_assets.report_id AND reports.created_by = auth.uid()));

-- Theme configs policies
CREATE POLICY "Everyone can view theme configs" ON theme_configs FOR SELECT USING (TRUE);
CREATE POLICY "Only system can create theme configs" ON theme_configs FOR INSERT WITH CHECK (FALSE);
CREATE POLICY "Only system can update system themes" ON theme_configs FOR UPDATE USING (is_system = FALSE);

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'editor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed default theme configs
INSERT INTO theme_configs (name, is_system) VALUES
('Default Editor Theme', TRUE),
('Violet Viewer Theme', TRUE);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
