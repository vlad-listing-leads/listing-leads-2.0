-- Leaderboard entries table
-- Links to either short_videos (Instagram) OR youtube_videos
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_video_id UUID REFERENCES short_videos(id) ON DELETE CASCADE,
  youtube_video_id UUID REFERENCES youtube_videos(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('monthly', 'staff_picks')),
  month_year TEXT, -- '2025-01' for monthly, NULL for staff_picks
  display_order INTEGER NOT NULL DEFAULT 0,
  cached_engagement JSONB DEFAULT '{}', -- {views, likes, comments, shares}
  metrics_updated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_video_required CHECK (
    (short_video_id IS NOT NULL AND youtube_video_id IS NULL) OR
    (short_video_id IS NULL AND youtube_video_id IS NOT NULL)
  )
);

-- Indexes for leaderboard_entries
CREATE INDEX idx_leaderboard_entries_type ON leaderboard_entries(leaderboard_type);
CREATE INDEX idx_leaderboard_entries_month ON leaderboard_entries(month_year);
CREATE INDEX idx_leaderboard_entries_order ON leaderboard_entries(leaderboard_type, display_order);
CREATE INDEX idx_leaderboard_entries_active ON leaderboard_entries(is_active);

-- Featured creators table
-- Links to either short_video_creators (Instagram) OR video_creators (YouTube)
CREATE TABLE featured_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_video_creator_id UUID REFERENCES short_video_creators(id) ON DELETE CASCADE,
  video_creator_id UUID REFERENCES video_creators(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_creator_required CHECK (
    (short_video_creator_id IS NOT NULL AND video_creator_id IS NULL) OR
    (short_video_creator_id IS NULL AND video_creator_id IS NOT NULL)
  )
);

-- Indexes for featured_creators
CREATE INDEX idx_featured_creators_order ON featured_creators(display_order);
CREATE INDEX idx_featured_creators_active ON featured_creators(is_active);

-- Enable RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_creators ENABLE ROW LEVEL SECURITY;

-- RLS policies for leaderboard_entries (public read, admin write)
CREATE POLICY "Public can view active leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage leaderboard entries"
  ON leaderboard_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS policies for featured_creators (public read, admin write)
CREATE POLICY "Public can view active featured creators"
  ON featured_creators FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage featured creators"
  ON featured_creators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
