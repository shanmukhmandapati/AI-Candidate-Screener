# N8N Workflow Configuration Guide

## Overview

This guide shows how to set up an N8N workflow to integrate with the LinkedIn AI Screener application.

## Workflow Architecture

```
Webhook Trigger
    ↓
Parse Candidate Data
    ↓
Call AI Model (OpenAI/Claude/etc)
    ↓
Format Results
    ↓
Return Response
```

## Step-by-Step Setup

### 1. Create a New Workflow

1. Go to your N8N instance
2. Click "New Workflow"
3. Name it "Candidate Screener"

### 2. Add Webhook Trigger

1. Click the "+" button to add a node
2. Search for "Webhook"
3. Select "HTTP Request" or native "Webhook" node
4. Configure:
   - **Method**: POST
   - **Path**: `/webhook/candidate-screener` (or your path)
   - **Response mode**: Last Node Output
   - **Authentication**: Basic Auth (optional)

### 3. Add Expression Node (Parse Input)

1. Add an "Execute" or "Code" node
2. Name it "Parse Candidate Data"
3. Add this code:

```javascript
// Extract candidate data from webhook payload
return {
  name: $input.body.name,
  email: $input.body.email,
  phone: $input.body.phone,
  linkedin_url: $input.body.linkedin_url,
  resume_text: $input.body.resume_text,
  skills: $input.body.skills || [],
  experience_years: $input.body.experience_years || 0
};
```

### 4. Add OpenAI/Claude Node (AI Analysis)

1. Add an "OpenAI" or "Claude" node
2. Connect it to the Parse node
3. Create a prompt:

```
Analyze this candidate based on their profile and provide a screening assessment.

Candidate Name: {{ $prev.output.name }}
Email: {{ $prev.output.email }}
LinkedIn: {{ $prev.output.linkedin_url }}
Resume: {{ $prev.output.resume_text }}
Skills: {{ $prev.output.skills.join(', ') }}
Experience Years: {{ $prev.output.experience_years }}

Provide your response as JSON with the following structure:
{
  "score": <number 1-100>,
  "rating": "<green|yellow|red>",
  "summary": "<one sentence summary>",
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "recommendation": "<hiring recommendation>"
}

Rating guidelines:
- Green (80-100): Strong candidate, ready to move forward
- Yellow (50-79): Potential candidate, may need more evaluation
- Red (0-49): Weak candidate, not recommended to proceed
```

### 5. Add Response Formatter Node

1. Add a "Code" or "Function" node
2. Name it "Format Response"
3. Add this code:

```javascript
// Parse AI response if it's a string
let aiResponse = $prev.output.response || $prev.output;

if (typeof aiResponse === 'string') {
  try {
    // Extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResponse = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // If parsing fails, return default response
    aiResponse = {
      score: 50,
      rating: 'yellow',
      summary: 'Unable to properly evaluate candidate',
      strengths: [],
      weaknesses: [],
      recommendation: 'Manual review required'
    };
  }
}

// Ensure all required fields are present
return {
  score: aiResponse.score || 50,
  rating: aiResponse.rating || 'yellow',
  summary: aiResponse.summary || 'Evaluation complete',
  strengths: aiResponse.strengths || [],
  weaknesses: aiResponse.weaknesses || [],
  recommendation: aiResponse.recommendation || 'Review recommended'
};
```

### 6. Connect to Webhook Response

1. The last node's output will be returned to the frontend
2. Make sure the workflow returns valid JSON

## Testing the Webhook

### Using cURL

```bash
curl -X POST https://your-n8n-instance.com/webhook/candidate-screener \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "resume_text": "10 years of experience in software engineering",
    "skills": ["Python", "JavaScript", "React"],
    "experience_years": 10
  }'
```

### Using Python

```python
import requests
import json

webhook_url = "https://your-n8n-instance.com/webhook/candidate-screener"

candidate = {
    "candidate_id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "resume_text": "10 years of experience in software engineering",
    "skills": ["Python", "JavaScript", "React"],
    "experience_years": 10
}

response = requests.post(webhook_url, json=candidate)
print(response.json())
```

### Expected Response

```json
{
  "score": 85,
  "rating": "green",
  "summary": "Strong candidate with extensive experience in software engineering",
  "strengths": [
    "10 years of relevant experience",
    "Diverse tech stack",
    "Proven track record"
  ],
  "weaknesses": [
    "No mention of leadership experience"
  ],
  "recommendation": "Move to technical interview stage"
}
```

## Integration with LinkedIn AI Screener

1. Copy your webhook URL from N8N
2. Go to the LinkedIn AI Screener application
3. Create a new screening batch
4. Paste the webhook URL in the N8N Webhook URL field
5. Upload candidates
6. Start screening

The application will:
1. Send each candidate to your N8N webhook
2. Receive AI analysis
3. Store results in Supabase
4. Display results with color-coded ratings

## Troubleshooting

### Webhook not responding
- Check N8N workflow is active (play button)
- Verify webhook URL is correct
- Check N8N logs for errors

### Invalid JSON response
- Ensure AI response is valid JSON
- Check the response formatter handles edge cases
- Test with cURL first

### Connection errors
- Verify N8N instance is accessible
- Check firewall/security rules
- Ensure authentication is configured if required

## Advanced Features

### Adding Database Storage in N8N

You can optionally store results in a database within N8N:

1. Add a "Postgres" or "MySQL" node
2. Query: `INSERT INTO screening_results (...) VALUES (...)`
3. This creates a backup of results in your N8N database

### Adding Notifications

Send results via email/Slack:

1. Add "Send Email" or "Slack" node
2. Format message with score and summary
3. Send notifications when screening completes

### Rate Limiting

Add a delay between API calls:

1. Add "Wait" node between webhook and AI node
2. Set delay to prevent rate limiting
