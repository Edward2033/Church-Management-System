-- ═══════════════════════════════════════════════════════════════
-- Migration: 009 - Daily Bible Verses & Prayer Verses
-- Description: Tables for Verse of the Day and Prayer Verse features
-- Date: 2026-08-05
-- ═══════════════════════════════════════════════════════════════

-- Daily Bible Verses
CREATE TABLE IF NOT EXISTS daily_verses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  verse_text  TEXT NOT NULL,
  reference   VARCHAR(100) NOT NULL,  -- e.g., "Psalm 65:4"
  book        VARCHAR(50),
  chapter     INTEGER,
  verse_number INTEGER,
  encouragement TEXT,  -- Short encouragement message
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, date)
);

-- Prayer Verses
CREATE TABLE IF NOT EXISTS prayer_verses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id       UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  verse_text      TEXT NOT NULL,
  reference       VARCHAR(100) NOT NULL,
  book            VARCHAR(50),
  chapter         INTEGER,
  verse_number    INTEGER,
  explanation     TEXT,  -- What the verse teaches
  prayer_text     TEXT,  -- Suggested prayer based on the verse
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_verses_church_date ON daily_verses(church_id, date);
CREATE INDEX IF NOT EXISTS idx_prayer_verses_church_date ON prayer_verses(church_id, date);

-- Seed sample verses for testing
INSERT INTO daily_verses (church_id, verse_text, reference, book, chapter, verse_number, encouragement, date) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Blessed is the man whom thou choosest, and causest to approach unto thee, that he may dwell in thy courts: we shall be satisfied with the goodness of thy house, even of thy holy temple.',
    'Psalm 65:4',
    'Psalms',
    65,
    4,
    'A reminder to stay connected with God and walk faithfully. Let His presence be your daily strength and joy.',
    CURRENT_DATE
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
    'Proverbs 3:5-6',
    'Proverbs',
    3,
    5,
    'When facing decisions, remember that God''s wisdom surpasses our own. Trust Him completely and He will guide your steps.',
    CURRENT_DATE + INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'I can do all things through Christ which strengtheneth me.',
    'Philippians 4:13',
    'Philippians',
    4,
    13,
    'Whatever challenges you face today, remember that Christ''s strength empowers you. You are never alone in your struggles.',
    CURRENT_DATE + INTERVAL '2 days'
  )
ON CONFLICT (church_id, date) DO NOTHING;

INSERT INTO prayer_verses (church_id, verse_text, reference, book, chapter, verse_number, explanation, prayer_text, date) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
    'Philippians 4:6',
    'Philippians',
    4,
    6,
    'This verse teaches us to bring all our worries and concerns to God in prayer, with a heart of thanksgiving. Instead of being anxious, we are called to trust God with every situation.',
    'Lord, help me bring my worries before You and trust Your plan. Strengthen my faith and guide my decisions today. Fill my heart with peace that surpasses understanding. Help me to be grateful in all circumstances and to rest in Your loving care. In Jesus'' name, Amen.',
    CURRENT_DATE
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'The LORD is my shepherd; I shall not want.',
    'Psalm 23:1',
    'Psalms',
    23,
    1,
    'God is our shepherd who provides for all our needs. We can trust Him completely to care for us, guide us, and protect us in every season of life.',
    'Heavenly Father, thank You for being my shepherd. I trust that You will provide everything I need today. Lead me in Your paths of righteousness and help me to follow You faithfully. May I never lack anything as I rest in Your care. Amen.',
    CURRENT_DATE + INTERVAL '1 day'
  )
ON CONFLICT (church_id, date) DO NOTHING;

COMMENT ON TABLE daily_verses IS 'Daily Bible verses displayed on user dashboards';
COMMENT ON TABLE prayer_verses IS 'Daily prayer verses with explanations and suggested prayers';
