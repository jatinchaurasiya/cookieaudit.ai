-- CookieAudit AI: Production Supabase PostgreSQL Schema with RLS

-- 1. Scans Table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  overall_score INT NOT NULL,
  grade TEXT NOT NULL,
  pillar_owasp_score INT NOT NULL,
  pillar_tracking_score INT NOT NULL,
  pillar_legal_score INT NOT NULL,
  total_cookies INT NOT NULL,
  insecure_cookies INT NOT NULL,
  pre_consent_trackers INT NOT NULL,
  privacy_url TEXT,
  sha256_hash TEXT NOT NULL UNIQUE,
  ai_audit_json JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Discovered Cookies Table
CREATE TABLE IF NOT EXISTS scan_cookies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  is_secure BOOLEAN NOT NULL,
  is_http_only BOOLEAN NOT NULL,
  same_site TEXT NOT NULL,
  ttl_days INT,
  source TEXT NOT NULL,
  owasp_issues TEXT[] DEFAULT '{}'
);

-- 3. Tamper-evident seal columns (v2 certificate).
--    `audit_payload` holds the COMPLETE canonical audit content; sha256_hash
--    is its digest and signature_hmac is HMAC-SHA256(server secret, payload).
--    Verification RECOMPUTES both, so DB tampering is detectable.
ALTER TABLE scans ADD COLUMN IF NOT EXISTS signature_hmac TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS audit_payload JSONB;

-- 3. Monitored Domains (Weekly Drift SaaS)
CREATE TABLE IF NOT EXISTS monitored_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  target_url TEXT NOT NULL,
  frequency TEXT DEFAULT 'WEEKLY',
  slack_webhook_url TEXT,
  notification_email TEXT,
  last_scan_id UUID REFERENCES scans(id),
  last_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_cookies ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_domains ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Public scans are readable by anyone via scan UUID
CREATE POLICY "Public scans viewable by anyone" ON scans
  FOR SELECT USING (is_public = true);

-- Owners can view and manage their monitored domains
CREATE POLICY "Users can manage own monitored domains" ON monitored_domains
  FOR ALL USING (auth.uid() = user_id);
