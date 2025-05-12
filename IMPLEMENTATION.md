# Biotech Companies Job Portal - Implementation Document

## Project Overview

A Next.js application for tracking biotech companies and job opportunities, designed to help new college graduates find and apply for positions in the biotech industry. The platform focuses on Western USA biotech hubs and provides comprehensive company information, job opportunities, and networking connections.

## Project Structure

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── companies/
│   │   │       └── route.ts
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── CompanyForm.tsx
│   │   └── CompanyList.tsx
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   └── types/
│       └── index.ts
├── scripts/
│   ├── seedCompanies.js
│   └── llmDataCollector.js
├── public/
├── .env.local
└── [config files]
```

## Technology Stack

- **Frontend**:

  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - React Query for data fetching
  - React Hook Form for form handling
  - Zod for validation

- **Backend**:

  - Next.js API Routes
  - Drizzle ORM
  - Neon PostgreSQL
  - OpenAI/Claude API integration

- **Development**:
  - ESLint
  - TypeScript
  - Prettier
  - Husky for git hooks
  - Jest for testing

## Database Schema

```typescript
// src/db/schema.ts
export const biotechCompanies = pgTable("biotech_companies", {
  id: serial("id").primaryKey(),
  name: text("name"),
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  location: text("location"),
  description: text("description"),
  jobDescription: text("job_description"),
  contactInfo: text("contact_info"),
  products: text("products"),
  companySize: text("company_size"),
  achievements: text("achievements"),
  funding: text("funding"),
  lastFundingRound: text("last_funding_round"),
  fundingAmount: text("funding_amount"),
  keyPeople: jsonb("key_people").$type<
    {
      name: string;
      title: string;
      linkedinUrl: string;
      email?: string;
      notes?: string;
      contactDate?: string;
      lastContactDate?: string;
      preferredContactMethod?: string;
      relationship?: string;
      department?: string;
      location?: string;
      isActive?: boolean;
    }[]
  >(),
  technologies: text("technologies").array(),
  therapeuticAreas: text("therapeutic_areas").array(),
  jobOpenings: jsonb("job_openings").$type<
    {
      title: string;
      url: string;
      location: string;
      type: string;
      postedDate: string;
    }[]
  >(),
  contactDate: timestamp("contact_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

## API Endpoints

- `GET /api/companies` - Fetch all companies

  - Query parameters:
    - `location`: Filter by city/region
    - `size`: Filter by company size
    - `technology`: Filter by technology
    - `therapeuticArea`: Filter by therapeutic area
    - `hasOpenings`: Filter for companies with job openings

- `POST /api/companies` - Create new company

  - Validates all required fields
  - Handles nested JSON data
  - Returns created company

- `PUT /api/companies` - Update company

  - Requires company ID
  - Partial updates supported
  - Returns updated company

- `DELETE /api/companies?id=<id>` - Delete company
  - Requires company ID
  - Returns success status

## UI Components

1. **CompanyForm**

   - Input fields for all company details
   - Form validation with Zod
   - Real-time validation feedback
   - Rich text editor for descriptions
   - File upload for company logos
   - Dynamic fields for key people
   - Dynamic fields for job openings
   - Submit handling with loading states
   - Error handling and display

2. **CompanyList**
   - Sortable table display
   - Filtering capabilities
   - Pagination
   - Search functionality
   - Edit/Delete actions
   - Responsive design
   - Export to CSV/Excel
   - Bulk actions
   - Custom column visibility

## Automated Job Application Processing

### User Flow

```mermaid
graph TD
    A[User] --> B[Add Job Posting]
    B --> C{Input Type}
    C -->|URL| D[Scrape Job Details]
    C -->|Text| E[Parse Job Description]
    D --> F[Process Job Data]
    E --> F
    F --> G[Update Database]
    F --> H[Generate Application Materials]
    H --> I[Customize Resume]
    H --> J[Generate Cover Letter]
    H --> K[Prepare Email]
    I --> L[Email Client]
    J --> L
    K --> L
    L --> M[Track Application]
```

### Implementation Details

#### 1. Job Input Processing

```typescript
interface JobInput {
  type: "url" | "text";
  content: string;
  companyId?: number;
  source?: string;
}

interface ProcessedJob {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  type: string;
  postedDate: string;
  applicationUrl?: string;
  companyId: number;
  contactEmails: {
    primary: string;
    cc: string[];
    bcc: string[];
  };
}
```

#### 2. Email Address Generation

```typescript
const emailPatterns = {
  // Common email patterns for biotech companies
  patterns: [
    "{firstName}.{lastName}@company.com",
    "{firstName}{lastName}@company.com",
    "{firstName}@company.com",
    "careers@company.com",
    "jobs@company.com",
    "recruiting@company.com",
    "hr@company.com",
    "{department}@company.com",
  ],

  // Department-specific patterns
  departments: ["recruiting", "talent", "careers", "jobs", "hr", "hiring"],
};

// Generate possible email addresses
function generateEmailAddresses(company: Company, job: ProcessedJob): string[] {
  const domain = new URL(company.website).hostname;
  const emails = new Set<string>();

  // Add known contacts from company data
  company.keyPeople?.forEach((person) => {
    if (person.email) emails.add(person.email);
  });

  // Generate possible addresses
  emailPatterns.patterns.forEach((pattern) => {
    const email = pattern
      .replace("{firstName}", "first")
      .replace("{lastName}", "last")
      .replace("company.com", domain);
    emails.add(email);
  });

  return Array.from(emails);
}
```

#### 3. Application Material Generation

```typescript
interface ApplicationMaterials {
  resume: {
    content: string;
    format: "pdf" | "docx";
    customizations: {
      skills: string[];
      experience: string[];
      education: string[];
    };
  };
  coverLetter: {
    content: string;
    format: "pdf" | "docx";
    customizations: {
      company: string;
      position: string;
      keyPoints: string[];
    };
  };
  email: {
    subject: string;
    body: string;
    attachments: string[];
    to: string[];
    cc: string[];
    bcc: string[];
  };
}

// LLM Prompt for Material Generation
const materialGenerationPrompt = `Generate application materials for a biotech job application. Consider:

1. Resume Customization:
   - Highlight relevant skills from job description
   - Emphasize matching experience
   - Format for ATS compatibility
   - Include keywords from job posting

2. Cover Letter:
   - Company-specific introduction
   - Match experience to requirements
   - Show enthusiasm for company's mission
   - Reference specific projects/products

3. Email:
   - Professional subject line
   - Concise introduction
   - Clear next steps
   - Professional signature

Format the response as a JSON object matching the ApplicationMaterials interface.`;
```

#### 4. Email Client Integration

```typescript
interface EmailClient {
  openEmail: (email: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    attachments: string[];
  }) => void;
}

// Implementation for common email clients
const emailClients = {
  gmail: {
    openEmail: (email) => {
      const url = new URL("https://mail.google.com/mail/?view=cm");
      url.searchParams.append("to", email.to.join(","));
      url.searchParams.append("cc", email.cc.join(","));
      url.searchParams.append("bcc", email.bcc.join(","));
      url.searchParams.append("su", email.subject);
      url.searchParams.append("body", email.body);
      window.open(url.toString());
    },
  },
  outlook: {
    openEmail: (email) => {
      const url = new URL("mailto:");
      url.searchParams.append("to", email.to.join(","));
      url.searchParams.append("cc", email.cc.join(","));
      url.searchParams.append("bcc", email.bcc.join(","));
      url.searchParams.append("subject", email.subject);
      url.searchParams.append("body", email.body);
      window.open(url.toString());
    },
  },
};
```

#### 5. Application Tracking

```typescript
interface ApplicationStatus {
  id: number;
  jobId: number;
  companyId: number;
  status:
    | "draft"
    | "sent"
    | "received"
    | "interviewing"
    | "offered"
    | "rejected";
  sentDate: Date;
  lastUpdated: Date;
  nextSteps: string[];
  notes: string;
  followUpDate?: Date;
}

// Add to database schema
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id),
  companyId: integer("company_id").references(() => biotechCompanies.id),
  status: text("status"),
  sentDate: timestamp("sent_date"),
  lastUpdated: timestamp("last_updated"),
  nextSteps: text("next_steps").array(),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### User Interface Components

#### 1. Job Input Form

```typescript
interface JobInputForm {
  // URL input
  urlInput: {
    label: string;
    placeholder: string;
    validation: (url: string) => boolean;
  };

  // Text input
  textInput: {
    label: string;
    placeholder: string;
    maxLength: number;
  };

  // Company selection
  companySelect: {
    label: string;
    placeholder: string;
    options: Company[];
  };
}
```

#### 2. Application Preview

```typescript
interface ApplicationPreview {
  // Resume preview
  resume: {
    content: string;
    format: "pdf" | "docx";
    download: () => void;
    edit: () => void;
  };

  // Cover letter preview
  coverLetter: {
    content: string;
    format: "pdf" | "docx";
    download: () => void;
    edit: () => void;
  };

  // Email preview
  email: {
    subject: string;
    body: string;
    to: string[];
    cc: string[];
    bcc: string[];
    edit: () => void;
  };
}
```

## Implementation History

### Initial Setup

1. Created Next.js project with TypeScript

   - Configured app directory
   - Set up TypeScript paths
   - Added ESLint and Prettier

2. Set up Tailwind CSS

   - Configured PostCSS
   - Added custom theme
   - Set up responsive breakpoints

3. Configured ESLint

   - Added TypeScript rules
   - Set up import sorting
   - Added accessibility rules

4. Created basic homepage
   - Added responsive layout
   - Implemented navigation
   - Added loading states

### Database Integration

1. Set up Neon PostgreSQL

   - Created database
   - Set up connection pooling
   - Configured SSL

2. Configured Drizzle ORM

   - Set up migrations
   - Added type generation
   - Configured connection

3. Created database schema

   - Defined tables
   - Added relationships
   - Set up indexes

4. Implemented migrations
   - Created initial migration
   - Added rollback support
   - Set up CI/CD pipeline

### API Development

1. Created CRUD endpoints

   - Implemented validation
   - Added error handling
   - Set up rate limiting

2. Added error handling

   - Custom error types
   - Error logging
   - User-friendly messages

3. Implemented data validation

   - Schema validation
   - Type checking
   - Input sanitization

4. Added timestamp handling
   - Created/Updated tracking
   - Timezone support
   - Date formatting

### UI Development

1. Created form component

   - Added validation
   - Implemented error handling
   - Added loading states

2. Implemented company list

   - Added sorting
   - Implemented filtering
   - Added pagination

3. Added sorting functionality

   - Multi-column sort
   - Custom sort functions
   - Sort persistence

4. Styled with Tailwind CSS
   - Responsive design
   - Dark mode support
   - Custom components

## Data Collection Strategies

### 1. LLM Integration for Data Collection

#### System Prompt Template

```typescript
const systemPrompt = `You are a biotech industry expert specializing in company research and talent acquisition. Your task is to provide detailed, accurate information about biotech companies in the Western United States. Focus on companies that:
- Are actively hiring entry-level positions
- Have strong mentorship programs
- Are well-funded or established
- Have innovative technologies
- Are known for good workplace culture

For each company, provide:
1. Basic Information:
   - Company name
   - Website URL
   - LinkedIn URL
   - Location (city, state)
   - Company size and stage
   - Funding status and amounts

2. Technology & Products:
   - Main technology platforms
   - Products in development
   - Therapeutic areas
   - Key partnerships

3. Job Opportunities:
   - Entry-level positions
   - Internship programs
   - Career development programs
   - Application process details

4. Key People:
   - CEO/Founders (with LinkedIn URLs)
   - Hiring managers
   - Department heads
   - Notable employees

5. Company Culture:
   - Workplace environment
   - Benefits and perks
   - Career growth opportunities
   - Employee reviews

Format the response as a JSON object matching the database schema. Ensure all URLs are valid and information is current.`;
```

#### User Prompt Examples

```typescript
const userPrompts = [
  // San Diego Biotech Hub
  `Please provide information about 5 biotech companies in San Diego that are actively hiring entry-level positions in 2024. Focus on companies working in gene therapy or cell therapy. Include:
   - Companies with strong mentorship programs
   - Recent funding rounds
   - Key people to connect with on LinkedIn
   - Specific entry-level positions
   - Application deadlines`,

  // Bay Area Startups
  `List 3 early-stage biotech startups in the Bay Area that are known for their strong mentorship programs for recent graduates. Include:
   - Companies working in AI/ML applications in drug discovery
   - Founders' backgrounds and LinkedIn profiles
   - Current funding status
   - Available positions
   - Company culture details`,

  // Seattle Biotech Scene
  `Identify 4 mid-size biotech companies in Seattle that have received significant funding in the last 2 years and are expanding their teams. Include:
   - Companies in the diagnostics or medical devices space
   - Key decision makers' contact information
   - Current job openings
   - Company growth trajectory
   - Employee testimonials`,

  // Portland Emerging Companies
  `Find 3 emerging biotech companies in Portland that are hiring recent graduates. Focus on:
   - Companies in the synthetic biology space
   - Founders' previous experience
   - Current team size and structure
   - Available positions
   - Company culture and values`,
];
```

### 2. Alternative Data Collection Methods

#### Web Scraping

- LinkedIn company pages
- Company websites
- Job boards
- News articles
- Funding databases

#### API Integration

- LinkedIn API
- Crunchbase API
- Glassdoor API
- Indeed API
- AngelList API

#### Manual Research

- Industry conferences
- Networking events
- University career centers
- Industry publications
- Professional associations

#### Social Media Monitoring

- Twitter/X
- LinkedIn
- Company blogs
- Industry forums
- Reddit communities

## Future Cursor IDE Prompts

1. "Create a script to process LLM responses and add them to the database"

   - Implement validation
   - Add error handling
   - Set up rate limiting
   - Add logging

2. "Implement job application tracking functionality"

   - Create application table
   - Add status tracking
   - Implement reminders
   - Add calendar integration

3. "Add company categorization and filtering"

   - Implement tags system
   - Add search functionality
   - Create filter components
   - Add sorting options

4. "Create an automated cover letter generation system"

   - Integrate with LLM
   - Add template system
   - Implement customization
   - Add version control

5. "Implement job alert notifications"

   - Set up email system
   - Add push notifications
   - Create alert preferences
   - Implement scheduling

6. "Add user authentication and profiles"

   - Implement OAuth
   - Add profile management
   - Create preferences
   - Add activity tracking

7. "Create a dashboard for application statistics"

   - Add data visualization
   - Implement filters
   - Create reports
   - Add export functionality

8. "Implement company culture metrics and reviews"

   - Add review system
   - Create rating components
   - Implement moderation
   - Add analytics

9. "Implement automated job application processing"

   - Create job input form
   - Add URL/text parsing
   - Implement email generation
   - Add application tracking

10. "Add email client integration"

    - Implement Gmail integration
    - Add Outlook support
    - Create email templates
    - Add attachment handling

11. "Create application material generator"

    - Implement resume customization
    - Add cover letter generation
    - Create email templates
    - Add ATS optimization

12. "Build application tracking system"

    - Create status tracking
    - Add follow-up reminders
    - Implement analytics
    - Add reporting features

13. "Implement AI-powered job matching"

    - Create ML model
    - Add skill matching
    - Implement gap analysis
    - Generate recommendations

14. "Add networking enhancement features"

    - Create connection tracking
    - Implement follow-up system
    - Add message generation
    - Track engagement metrics

15. "Build interview preparation system"

    - Generate questions
    - Create answer templates
    - Add feedback system
    - Track performance

16. "Implement career path planning"
    - Create trajectory mapping
    - Add skill tracking
    - Generate development plans
    - Track progress

## UX Diagrams

### Current Flow

```mermaid
graph TD
    A[User] --> B[Homepage]
    B --> C[Company List]
    B --> D[Add Company Form]
    C --> E[Edit Company]
    C --> F[Delete Company]
    D --> G[API]
    E --> G
    F --> G
    G --> H[Database]
```

### Proposed Enhanced Flow

```mermaid
graph TD
    A[User] --> B[Homepage]
    B --> C[Company List]
    B --> D[Add Company Form]
    B --> I[Job Applications]
    B --> J[Alerts]
    C --> E[Edit Company]
    C --> F[Delete Company]
    D --> G[API]
    E --> G
    F --> G
    G --> H[Database]
    I --> K[Application Tracker]
    J --> L[Notification System]
    K --> G
    L --> G
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# API Keys
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
LINKEDIN_API_KEY=your_linkedin_key
CRUNCHBASE_API_KEY=your_crunchbase_key

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
```

## Development Setup

1. Clone repository

   ```bash
   git clone https://github.com/yourusername/biotech-jobs.git
   cd biotech-jobs
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. Run migrations

   ```bash
   npm run db:migrate
   ```

5. Start development server
   ```bash
   npm run dev
   ```

## Deployment

1. Build application

   ```bash
   npm run build
   ```

2. Start production server

   ```bash
   npm start
   ```

## Real-World Examples

### Company Profile: Boston Scientific

```json
{
  "name": "Boston Scientific",
  "website": "https://www.bostonscientific.com",
  "linkedinUrl": "https://www.linkedin.com/company/boston-scientific",
  "location": "Marlborough, MA",
  "description": "Boston Scientific is a global medical device company that develops and manufactures innovative medical solutions used to diagnose or treat a wide range of medical conditions, including heart, digestive, pulmonary, vascular, urological, women's health, and chronic pain conditions.",
  "companySize": "30,000+ employees",
  "technologies": [
    "Medical Devices",
    "Cardiovascular",
    "Neuromodulation",
    "Endoscopy",
    "Urology"
  ],
  "therapeuticAreas": [
    "Cardiology",
    "Neurology",
    "Gastroenterology",
    "Urology",
    "Oncology"
  ],
  "keyPeople": [
    {
      "name": "Michael F. Mahoney",
      "title": "Chairman and CEO",
      "linkedinUrl": "https://www.linkedin.com/in/michael-mahoney-123456",
      "notes": "Strong focus on innovation and patient outcomes",
      "contactDate": "2024-05-01",
      "preferredContactMethod": "LinkedIn",
      "department": "Executive",
      "isActive": true
    }
  ],
  "jobOpenings": [
    {
      "title": "R&D Engineer I",
      "url": "https://www.indeed.com/viewjob?jk=ef33a6e9db5b73c4",
      "location": "Marlborough, MA",
      "type": "Full-time",
      "postedDate": "2024-05-10"
    }
  ]
}
```

### Sample Job Analysis

```json
{
  "jobId": "ef33a6e9db5b73c4",
  "title": "R&D Engineer I",
  "company": "Boston Scientific",
  "location": "Marlborough, MA",
  "description": "Entry-level position in medical device R&D. Responsibilities include product development, testing, and documentation.",
  "requirements": [
    "BS in Biomedical Engineering or related field",
    "0-2 years experience",
    "Knowledge of medical device regulations",
    "Strong problem-solving skills"
  ],
  "applicationAnalysis": {
    "strengths": [
      "Educational background matches requirements",
      "Relevant internship experience in medical devices",
      "Strong technical skills in CAD and prototyping",
      "Understanding of FDA regulations",
      "Published research in relevant field"
    ],
    "weaknesses": [
      "Limited industry experience (0-2 years requirement)",
      "No direct experience with Boston Scientific products",
      "Could strengthen knowledge of specific medical device standards",
      "Limited experience with clinical trials"
    ],
    "actionItems": [
      "Highlight relevant coursework and projects",
      "Emphasize transferable skills from academic research",
      "Demonstrate knowledge of company's product portfolio",
      "Show enthusiasm for medical device innovation"
    ]
  }
}
```

## Additional Project Enhancements

### 1. AI-Powered Job Matching

- Implement ML model to match candidate skills with job requirements
- Generate personalized application strategies
- Provide skill gap analysis
- Suggest relevant training/certifications

### 2. Networking Enhancement

- Track professional connections
- Set up automated follow-up reminders
- Generate personalized outreach messages
- Track response rates and engagement

### 3. Interview Preparation

- Generate company-specific interview questions
- Provide sample answers based on job requirements
- Create personalized interview preparation guides
- Track interview performance and feedback

### 4. Career Path Planning

- Map potential career trajectories
- Identify required skills and certifications
- Track progress towards career goals
- Generate personalized development plans

### 5. Company Research Automation

- Automated news monitoring
- Funding round tracking
- Product launch alerts
- Competitor analysis

### 6. Application Analytics

- Track application success rates
- Analyze response patterns
- Identify optimal application timing
- Generate application strategy insights

### 7. Document Management

- Version control for resumes and cover letters
- ATS optimization checking
- Document formatting validation
- Automated backup and sync

### 8. Integration Enhancements

- Calendar integration for interviews
- Email client integration
- LinkedIn profile sync
- Job board aggregation

### 9. Mobile Experience

- Responsive design optimization
- Push notifications
- Offline access
- Mobile document editing

### 10. Security & Privacy

- End-to-end encryption
- GDPR compliance
- Data retention policies
- Access control management
