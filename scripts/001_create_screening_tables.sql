-- Create screening_batches table
CREATE TABLE IF NOT EXISTS screening_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_candidates INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  n8n_webhook_url TEXT,
  status TEXT DEFAULT 'pending' -- pending, processing, completed
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES screening_batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  resume_text TEXT,
  skills TEXT[], -- Array of skills
  experience_years DECIMAL,
  custom_fields JSONB, -- For extra fields from CSV/Excel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create screening_results table
CREATE TABLE IF NOT EXISTS screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES screening_batches(id) ON DELETE CASCADE,
  score INTEGER, -- 1-100
  rating TEXT, -- 'green', 'yellow', 'red'
  summary TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  recommendation TEXT,
  n8n_response JSONB, -- Store raw n8n response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidates_batch_id ON candidates(batch_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_batch_id ON screening_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_candidate_id ON screening_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_screening_batches_created_at ON screening_batches(created_at);

-- Enable Row Level Security
ALTER TABLE screening_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - adjust based on auth)
CREATE POLICY "screening_batches_select_policy" ON screening_batches FOR SELECT USING (true);
CREATE POLICY "screening_batches_insert_policy" ON screening_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "screening_batches_update_policy" ON screening_batches FOR UPDATE USING (true);
CREATE POLICY "screening_batches_delete_policy" ON screening_batches FOR DELETE USING (true);

CREATE POLICY "candidates_select_policy" ON candidates FOR SELECT USING (true);
CREATE POLICY "candidates_insert_policy" ON candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "candidates_update_policy" ON candidates FOR UPDATE USING (true);
CREATE POLICY "candidates_delete_policy" ON candidates FOR DELETE USING (true);

CREATE POLICY "screening_results_select_policy" ON screening_results FOR SELECT USING (true);
CREATE POLICY "screening_results_insert_policy" ON screening_results FOR INSERT WITH CHECK (true);
CREATE POLICY "screening_results_update_policy" ON screening_results FOR UPDATE USING (true);
CREATE POLICY "screening_results_delete_policy" ON screening_results FOR DELETE USING (true);
