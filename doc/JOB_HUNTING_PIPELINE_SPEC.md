# Job Hunting Pipeline Specification

## Overview

Comprehensive job hunting system for tracking leads, managing outreach, optimizing CVs, and monitoring application pipeline progress.

## Core Components

### 1. Lead Tracking System

- Company database with notes
- Role opportunities with requirements
- Contact tracking (recruiters, hiring managers)
- Status pipeline (researched → applied → interviewed → offer)

### 2. Outreach Automation

- Daily outreach goals
- Template library (cold emails, LinkedIn messages)
- Tracking sent/replied/ignored
- Follow-up scheduling

### 3. CV Optimization

- LLM extraction of job requirements
- Match scoring against your CV
- Tailored CV generation per role
- ATS optimization suggestions

### 4. Application Pipeline

- Application status tracking
- Interview preparation notes
- Follow-up reminders
- Offer comparison matrix

## Data Schema

### Lead (Company)

```yaml
---
type: job_lead
id: lead-{timestamp}-{slug}
company: string
website: string
industry: string
size: "startup" | "scale-up" | "enterprise"
location: string
remote_policy: "remote" | "hybrid" | "onsite"
stage: "research" | "outreach" | "applied" | "interview" | "offer" | "rejected" | "declined"
tags: []
contacts: []
notes: string
---
```

### Role/Opportunity

```yaml
---
type: job_role
id: role-{timestamp}-{slug}
title: string
company_id: string  # Links to lead
posted_date: string
application_deadline: string
salary_range: { min: number, max: number, currency: string }
remote: boolean
requirements:
  skills: []
  experience_years: number
  education: []
status: "found" | "interested" | "applied" | "interviewing" | "offered" | "accepted" | "rejected"
match_score: number  # 0-100, LLM generated
application:
  applied_date: string
  method: "website" | "linkedin" | "email" | "recruiter"
  cv_version: string
  cover_letter: boolean
interviews: []
notes: string
---
```

### Contact

```yaml
---
type: job_contact
id: contact-{timestamp}-{slug}
name: string
role: "recruiter" | "hiring_manager" | "employee" | "founder"
company_id: string
email: string
linkedin: string
phone: string
last_contact: string
relationship: "cold" | "warm" | "referral"
notes: string
---
```

### Outreach

```yaml
---
type: job_outreach
id: outreach-{timestamp}-{slug}
contact_id: string
company_id: string
role_id: string  # Optional
sent_date: string
method: "email" | "linkedin" | "phone" | "in_person"
template_used: string
status: "sent" | "replied" | "ignored" | "bounced"
reply_date: string
follow_up_date: string
notes: string
---
```

## MCP Tools

### Lead Management

1. **create_job_lead** - Create new company lead
2. **update_job_lead** - Update lead status/info
3. **list_job_leads** - List leads by status/tags
4. **find_job_leads** - Search leads by criteria

### Role Management

5. **create_job_role** - Create role opportunity
6. **update_job_role** - Update role status
7. **match_job_role** - LLM match score against CV
8. **list_job_roles** - List roles by status
9. **get_role_requirements** - Extract requirements with LLM

### Contact Management

10. **create_job_contact** - Add new contact
11. **update_job_contact** - Update contact info
12. **list_job_contacts** - List contacts by company
13. **log_interaction** - Record interaction with contact

### Outreach Management

14. **create_outreach** - Log outreach activity
15. **daily_outreach_goal** - Set/track daily goals
16. **outreach_templates** - Get message templates
17. **schedule_follow_up** - Schedule follow-up reminder
18. **outreach_analytics** - Response rate stats

### CV Optimization

19. **extract_job_requirements** - LLM parse job description
20. **match_cv_to_role** - Score CV against requirements
21. **tailor_cv_sections** - Suggest CV modifications
22. **optimize_for_ats** - ATS keyword optimization

### Pipeline Analytics

23. **application_pipeline** - Current pipeline status
24. **conversion_funnel** - Applied → Interview → Offer rates
25. **average_time_metrics** - Time in each stage
26. **weekly_activity_report** - Summary of week's activities

## Storage Structure

```
job-hunting/
├── leads/
│   ├── company-google.md
│   ├── company-stripe.md
│   └── ...
├── roles/
│   ├── role-senior-engineer-google.md
│   ├── role-staff-engineer-stripe.md
│   └── ...
├── contacts/
│   ├── contact-recruiter-jane-smith.md
│   └── ...
├── outreach/
│   ├── 2026-01/
│   │   ├── outreach-jane-smith-jan15.md
│   │   └── ...
│   └── ...
├── applications/
│   ├── cv-versions/
│   │   ├── cv-google-senior-2026-01.pdf
│   │   └── ...
│   └── cover-letters/
│       └── ...
└── templates/
    ├── cold-email-engineer.md
    ├── linkedin-message-referral.md
    └── ...
```

## Workflows

### Daily Outreach Routine

```
1. Check outreach goal (e.g., 5 contacts/day)
2. List warm leads without recent contact
3. Select template based on relationship
4. Send outreach (log in system)
5. Schedule follow-up reminder (7 days)
```

### Application Process

```
1. Find role → create_job_role()
2. Extract requirements → extract_job_requirements()
3. Match against CV → match_cv_to_role()
4. If match > 70% → tailor CV
5. Apply → update status to "applied"
6. Schedule follow-up (2 weeks)
```

### Interview Prep

```
1. Role enters "interviewing" status
2. Review company lead notes
3. Review role requirements
4. Prepare questions
5. After interview → log notes
6. Update status & schedule follow-up
```

## Integration Points

### With Avatar System

- Successful applications → XP + money rewards
- Interview completed → energy cost, XP gain
- Offer received → major XP + money boost
- Rejection → stress increase, resilience XP

### With COD Planning

- Outreach tasks → daily session planning
- Application prep → focused work blocks
- Interview prep → high-focus tasks
- CV tailoring → medium-effort tasks

### With Productivity Patterns

- Best time for outreach (high energy)
- CV writing optimal hours
- Interview scheduling preferences

## LLM Integration

### Job Description Parsing

```
Extract from job posting:
- Required skills
- Preferred skills
- Experience level
- Responsibilities
- Team structure
- Company culture signals
```

### CV Matching

```
Compare:
- Your skills vs required
- Your experience vs needed
- Your achievements vs responsibilities
- Cultural fit indicators
Generate: 0-100 match score + gaps
```

### CV Tailoring

```
Suggest:
- Which projects to highlight
- How to reframe experience
- Keywords to add (ATS)
- Achievements to emphasize
```

## Analytics & Reports

### Weekly Report

- Leads added: X
- Roles applied: X
- Outreach sent: X
- Responses received: X
- Interviews scheduled: X
- Conversion rates

### Pipeline Health

- Funnel visualization
- Stage duration averages
- Bottleneck identification
- Success rate by company size/type

### Outreach Effectiveness

- Response rate by template
- Best performing channels
- Optimal outreach times
- Follow-up timing impact

## Gamification

### Achievements

- 🎯 First Application
- 📧 10 Outreaches in a Day
- 🎤 First Interview
- 💰 First Offer
- 🔥 5-Day Outreach Streak
- 📈 70%+ Match Score Role

### Progress Tracking

- Applications sent (milestone: 10, 25, 50, 100)
- Interview conversion rate
- Offer acceptance rate
- Average time to offer

## Best Practices

1. **Daily Routine**: 30min/day minimum
   - 5 new outreaches
   - Follow up on 3 pending
   - Update 1-2 applications

2. **Quality over Quantity**
   - Only apply to 70%+ match roles
   - Personalize every outreach
   - Research company before applying

3. **Relationship Building**
   - Log every interaction
   - Send thank-you notes
   - Keep contacts warm (quarterly check-in)

4. **CV Optimization**
   - Tailor for each role
   - ATS-optimize keywords
   - Quantify achievements
   - Keep versions organized

5. **Pipeline Management**
   - Update status immediately
   - Set follow-up reminders
   - Review weekly
   - Learn from rejections

## Implementation Phases

### Phase 1: Core Tracking (Week 1)

- Lead/Role/Contact schemas
- CRUD tools for each type
- Basic list/search functionality

### Phase 2: Outreach System (Week 2)

- Template library
- Daily goal tracking
- Follow-up scheduling
- Analytics dashboard

### Phase 3: LLM Integration (Week 3)

- Job description parsing
- CV matching scoring
- Tailoring suggestions
- ATS optimization

### Phase 4: Automation (Week 4)

- Auto-follow-up reminders
- Pipeline health alerts
- Weekly report generation
- Integration with Avatar/COD
