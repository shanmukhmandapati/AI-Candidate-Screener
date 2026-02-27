# LinkedIn AI Screener

A modern AI-powered candidate screening application that leverages N8N workflows to automatically analyze and score candidates from CSV/Excel files using Supabase as the backend.

## Features

- **File Upload**: Drag-and-drop CSV and Excel file support
- **Smart Field Mapping**: Automatically detect and map candidate fields
- **AI Screening**: Integration with N8N for intelligent candidate analysis
- **Batch Processing**: Process multiple candidates in a single screening session
- **Results Dashboard**: Color-coded scoring (Green/Yellow/Red) with detailed feedback
- **History Tracking**: Keep record of all screening batches
- **Data Persistence**: All data stored securely in Supabase

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account and project
- N8N instance (self-hosted or cloud)
- OpenAI or Claude API key (for AI analysis in N8N)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repo-url>
   cd linkedin-ai-screener
   pnpm install
   ```

2. **Set up environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Set up Supabase database**:
   - Follow the instructions in `SETUP.md` to create the required tables
   - Run the SQL schema provided in the database section

4. **Configure N8N workflow**:
   - Follow the detailed guide in `N8N_SETUP.md`
   - Create a webhook-based workflow for candidate screening
   - Get your webhook URL

5. **Run development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Workflow

```
1. Upload CSV/Excel file with candidate data
   ↓
2. Configure batch name and N8N webhook URL
   ↓
3. Map CSV columns to candidate fields
   ↓
4. Preview candidates before processing
   ↓
5. Send candidates to N8N for AI screening
   ↓
6. View results with scores and recommendations
   ↓
7. Access screening history anytime
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── batches/          # Batch management endpoints
│   │   ├── candidates/       # Candidate management endpoints
│   │   └── screening-results/# Results storage endpoints
│   ├── page.tsx              # Main application page
│   └── layout.tsx            # Root layout
├── components/
│   ├── file-upload.tsx       # File upload component
│   ├── field-mapping.tsx     # CSV field mapping
│   ├── batch-config.tsx      # Batch configuration
│   ├── candidate-preview.tsx # Candidate preview table
│   ├── screening-result.tsx  # Individual result card
│   ├── screening-workflow.tsx# Screening progress
│   └── batch-results-dashboard.tsx # Results summary
├── hooks/
│   └── use-n8n-screening.ts # N8N integration hook
├── lib/
│   └── file-parser.ts       # CSV parsing utilities
├── SETUP.md                 # Database setup guide
├── N8N_SETUP.md            # N8N workflow configuration
└── README.md               # This file
```

## API Endpoints

### Batches
- `POST /api/batches` - Create screening batch
- `GET /api/batches` - List all batches
- `GET /api/batches/[id]` - Get batch details
- `PATCH /api/batches/[id]` - Update batch status

### Candidates
- `POST /api/candidates` - Add candidates to batch
- `GET /api/candidates?batch_id=` - Get batch candidates

### Results
- `POST /api/screening-results` - Save screening result
- `GET /api/screening-results?batch_id=` - Get batch results

## Input File Format

### CSV Format
```csv
Name,Email,Phone,LinkedIn URL,Resume Text,Skills,Experience Years
John Doe,john@example.com,555-1234,linkedin.com/in/johndoe,5 years at...,Python;JavaScript;React,5
Jane Smith,jane@example.com,555-5678,linkedin.com/in/janesmith,Led team of...,Leadership;Product;Strategy,8
```

### Excel Format
Same structure as CSV, with columns for Name, Email, Phone, LinkedIn URL, Resume Text, Skills, and Experience Years.

## Result Format

Results from N8N workflows should return:

```json
{
  "score": 85,
  "rating": "green",
  "summary": "Strong candidate with relevant experience",
  "strengths": ["10+ years experience", "Technical expertise"],
  "weaknesses": ["Limited management experience"],
  "recommendation": "Schedule technical interview"
}
```

Rating scale:
- **Green (80-100)**: Strong candidate
- **Yellow (50-79)**: Potential candidate
- **Red (0-49)**: Weak candidate

## Database Schema

### screening_batches
- `id`: UUID (primary key)
- `name`: Text - Batch name
- `description`: Text - Optional description
- `n8n_webhook_url`: Text - N8N webhook URL
- `status`: Text - pending/processing/completed
- `total_candidates`: Integer - Total candidates in batch
- `processed_count`: Integer - Candidates processed
- `created_at`: Timestamp
- `updated_at`: Timestamp

### candidates
- `id`: UUID (primary key)
- `batch_id`: UUID (foreign key)
- `name`: Text - Candidate name
- `email`: Text - Email address
- `phone`: Text - Phone number
- `linkedin_url`: Text - LinkedIn profile
- `resume_text`: Text - Resume content
- `skills`: Text[] - Array of skills
- `experience_years`: Decimal - Years of experience
- `custom_fields`: JSONB - Additional fields from file
- `created_at`: Timestamp
- `updated_at`: Timestamp

### screening_results
- `id`: UUID (primary key)
- `candidate_id`: UUID (foreign key)
- `batch_id`: UUID (foreign key)
- `score`: Integer - 1-100 score
- `rating`: Text - green/yellow/red
- `summary`: Text - Summary text
- `strengths`: Text[] - Array of strengths
- `weaknesses`: Text[] - Array of weaknesses
- `recommendation`: Text - Hiring recommendation
- `n8n_response`: JSONB - Raw N8N response
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Technologies Used

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: Supabase PostgreSQL
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Parsing**: Native CSV parsing
- **API Integration**: Next.js API Routes

## Common Tasks

### Adding a new screening batch
1. Upload CSV file
2. Enter batch name and N8N webhook URL
3. Map fields
4. Review candidates
5. Start screening

### Viewing past results
1. Go to "History" tab
2. Click on a batch
3. View all screening results

### Updating N8N workflow
1. Modify your N8N workflow
2. Test with cURL or Postman
3. Update webhook URL in app if needed

## Troubleshooting

### "Failed to create batch"
- Check Supabase connection
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check network tab for API errors

### "Failed to parse file"
- Ensure CSV has correct headers
- File should be UTF-8 encoded
- Try Excel format if CSV fails

### N8N webhook not responding
- Verify webhook URL is correct
- Check N8N workflow is published and active
- Test webhook with cURL

### No results appearing
- Check N8N workflow output format
- Verify response JSON is valid
- Check browser console for errors

## Performance Tips

- Batch size: Recommended 100-500 candidates per batch
- N8N delays: Add wait nodes to avoid rate limiting
- Database: Create indexes on batch_id and created_at

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- API keys are restricted to service role only
- Consider adding authentication before production use
- Webhook URLs should be kept private

## Future Enhancements

- User authentication and multi-tenant support
- Advanced filtering and sorting
- Batch export to CSV/PDF
- Webhook retry logic
- Result caching
- Real-time updates with WebSockets
- Custom scoring models
- Integration with ATS systems

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review SETUP.md and N8N_SETUP.md
3. Check browser console for error messages
4. Open an issue on GitHub

## Contact

For support and inquiries, please open an issue on the GitHub repository.
