# LinkedIn AI Screener - Setup Guide

## Overview

LinkedIn AI Screener is an AI-powered candidate screening application that integrates with N8N workflows to automatically analyze and score candidates from CSV/Excel files.

## Architecture

- **Frontend**: Next.js 16 with React components for file upload, mapping, and results display
- **Backend**: Next.js API Routes for data management
- **Database**: Supabase PostgreSQL for storing batches, candidates, and screening results
- **AI Analysis**: N8N webhook integration for candidate screening

## Prerequisites

1. **Supabase Project**: Database for storing data
   - Create at https://supabase.com
   - Note your project URL and service role key

2. **N8N Instance**: Workflow automation
   - Self-hosted or cloud instance
   - Create a screening workflow with a webhook trigger
   - The workflow should accept candidate data and return screening results

## Environment Variables

Add these to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Setup

You need to create three tables in Supabase. Go to the SQL Editor and run:

```sql
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
  status TEXT DEFAULT 'pending'
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
  skills TEXT[],
  experience_years DECIMAL,
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create screening_results table
CREATE TABLE IF NOT EXISTS screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES screening_batches(id) ON DELETE CASCADE,
  score INTEGER,
  rating TEXT,
  summary TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  recommendation TEXT,
  n8n_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidates_batch_id ON candidates(batch_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_batch_id ON screening_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_candidate_id ON screening_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_screening_batches_created_at ON screening_batches(created_at);

-- Enable RLS
ALTER TABLE screening_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now)
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
```

## N8N Workflow Setup

Create a new workflow in N8N with:

1. **Webhook Trigger**
   - Method: POST
   - Response mode: Last Node Output
   - Enable "Use simple authentication"

2. **Candidate Analysis Node**
   - Process the incoming candidate data
   - Call your AI model (OpenAI, Claude, etc.)
   - Generate score (1-100), rating (green/yellow/red), and feedback

3. **Response Format**
   - Return JSON with:
   ```json
   {
     "score": 85,
     "rating": "green",
     "summary": "Strong candidate with relevant experience",
     "strengths": ["10+ years experience", "Leadership skills"],
     "weaknesses": ["Limited AI ML experience"],
     "recommendation": "Schedule technical interview"
   }
   ```

## Running the Application

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run development server:
   ```bash
   pnpm dev
   ```

3. Open http://localhost:3000

## Usage Flow

1. **Upload**: Select CSV or Excel file with candidate data
2. **Configure**: Set batch name and N8N webhook URL
3. **Map Fields**: Map CSV columns to candidate fields
4. **Preview**: Review candidates before processing
5. **Screen**: Send candidates to N8N for analysis
6. **Results**: View screening results with scores and recommendations

## File Format

CSV/Excel files should include columns for:
- Name (required)
- Email
- Phone
- LinkedIn URL
- Resume Text
- Skills (semicolon-separated)
- Experience Years

Example CSV:
```
Name,Email,Phone,LinkedIn URL,Resume Text,Skills,Experience Years
John Doe,john@example.com,555-1234,linkedin.com/in/john,5 years at...,Python;JavaScript,5
Jane Smith,jane@example.com,555-5678,linkedin.com/in/jane,Led team of...,Leadership;Product,8
```

## API Endpoints

- `POST /api/batches` - Create a new screening batch
- `GET /api/batches` - List all batches
- `GET /api/batches/[id]` - Get batch details
- `PATCH /api/batches/[id]` - Update batch status
- `POST /api/candidates` - Add candidates to a batch
- `GET /api/candidates?batch_id=` - Get candidates for a batch
- `POST /api/screening-results` - Save screening result
- `GET /api/screening-results?batch_id=` - Get results for a batch
