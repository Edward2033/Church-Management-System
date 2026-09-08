-- Migration: 011_documents_system.sql
-- Recommendation Letters, CV Builder, Academic Writing
-- ALL three tools are ADMIN-ONLY

-- ── RECOMMENDATION LETTERS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendation_letters (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id           UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  -- Applicant
  applicant_name      VARCHAR(200) NOT NULL,
  applicant_status    VARCHAR(200),
  date_joined         VARCHAR(100),
  additional_info     TEXT,
  -- Destination
  org_name            VARCHAR(300),
  org_website         VARCHAR(300),
  org_type            VARCHAR(100),
  org_description     TEXT,
  purpose             TEXT,
  extra_info          TEXT,
  -- Letter
  letter_type         VARCHAR(20) NOT NULL CHECK (letter_type IN ('church','choir')),
  letter_content      TEXT,
  -- Signatories (fetched from leadership at generation time)
  signatory_name      VARCHAR(200),
  signatory_title     VARCHAR(200),
  -- Meta
  generated_by        UUID REFERENCES users(id),
  generated_at        TIMESTAMPTZ DEFAULT NOW(),
  status              VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','generated')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rec_letters_church ON recommendation_letters(church_id);
CREATE INDEX IF NOT EXISTS idx_rec_letters_created ON recommendation_letters(created_at DESC);

-- ── CV DOCUMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cv_documents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               VARCHAR(200) DEFAULT 'My CV',
  -- Personal
  full_name           VARCHAR(200),
  professional_title  VARCHAR(200),
  email               VARCHAR(150),
  phone               VARCHAR(50),
  location            VARCHAR(200),
  website             VARCHAR(300),
  linkedin            VARCHAR(300),
  photo_url           TEXT,
  summary             TEXT,
  -- Structured sections stored as JSONB
  work_experience     JSONB DEFAULT '[]',
  education           JSONB DEFAULT '[]',
  skills              JSONB DEFAULT '{"technical":[],"soft":[],"languages":[]}',
  certifications      JSONB DEFAULT '[]',
  projects            JSONB DEFAULT '[]',
  cv_references       JSONB DEFAULT '[]',
  -- Meta
  template            VARCHAR(30) DEFAULT 'classic',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cv_user ON cv_documents(user_id);

-- ── ACADEMIC DOCUMENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type        VARCHAR(50) DEFAULT 'essay'
                  CHECK (doc_type IN ('essay','research_paper','report','assignment','project_paper','other')),
  title           VARCHAR(400),
  author          VARCHAR(200),
  institution     VARCHAR(300),
  department      VARCHAR(200),
  course          VARCHAR(200),
  instructor      VARCHAR(200),
  doc_date        VARCHAR(50),
  abstract        TEXT,
  introduction    TEXT,
  sections        JSONB DEFAULT '[]',
  methodology     TEXT,
  results         TEXT,
  discussion      TEXT,
  conclusion      TEXT,
  references_list TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academic_user ON academic_documents(user_id);

-- ── SAFE ALTER: add missing columns if tables already exist ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recommendation_letters' AND column_name='updated_at') THEN
    ALTER TABLE recommendation_letters ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recommendation_letters' AND column_name='generated_at') THEN
    ALTER TABLE recommendation_letters ADD COLUMN generated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
