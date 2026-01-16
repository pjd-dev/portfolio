# Job Hunting - Vault Native Approach

## Philosophy

**No hardcoded services.** Use the vault's flexible note + frontmatter architecture with existing tools.

## Setup

### 1. Create Folder Structure

```
job-hunting/
├── leads/          # Job opportunities
├── outreach/       # Networking contacts
└── applications/   # Active applications
```

### 2. Templates Available

- `job-lead-template.md` - Track job opportunities
- `outreach-template.md` - Track networking outreach

## Workflow Examples

### Create a New Job Lead

```typescript
// Use existing template tool
create_from_template({
  templateId: 'job-lead-template',
  variables: {
    id: 'lead-acme-corp-swe',
    company: 'Acme Corp',
    role: 'Senior Software Engineer',
    location: 'Remote',
    remote: true,
    salary_range: '$150k-$180k',
    source: 'LinkedIn',
    fit_score: 8,
    interest_level: 9,
  },
  targetPath: 'job-hunting/leads/acme-corp-swe.md',
});
```

### Find All Active Leads

```typescript
// Use existing frontmatter query
find_by_frontmatter({
  type: 'job_lead',
  status: 'researching',
});
```

### Find Leads Ready to Apply

```typescript
find_by_frontmatter({
  type: 'job_lead',
  status: 'ready_to_apply',
});
```

### Track Daily Outreach

```typescript
// Create outreach note
create_from_template({
  templateId: 'outreach-template',
  variables: {
    id: 'outreach-john-doe',
    contact_name: 'John Doe',
    contact_role: 'Engineering Manager',
    company: 'Acme Corp',
    platform: 'LinkedIn',
  },
  targetPath: 'job-hunting/outreach/john-doe-acme.md',
});

// Check progress toward goal
check_outreach_goal({ dailyGoal: 3 });
```

### View Dashboard

```typescript
// Get overview of all job hunting activity
job_hunting_dashboard();
```

## Existing Tools That Work

All standard vault tools work with job hunting notes:

- `list_notes` - Browse job leads/outreach
- `read_note` - View details
- `update_frontmatter` - Update status, dates, etc.
- `find_by_frontmatter` - Query by any field
- `graph_search` - Find related companies/roles
- `find_related` - Discover connections

## Status Tracking

### Job Lead Statuses

- `researching` - Initial discovery
- `preparing` - Tailoring CV/cover letter
- `ready_to_apply` - Ready to submit
- `applied` - Application submitted
- `interviewing` - In interview process
- `offered` - Received offer
- `accepted` - Offer accepted
- `rejected` - Not selected
- `withdrawn` - Decided not to proceed

### Outreach Statuses

- `planned` - Outreach planned
- `sent` - Message sent
- `responded` - Received response
- `meeting_scheduled` - Call/meeting set up
- `no_response` - No reply received
- `dead_end` - Conversation ended

## Queries & Analytics

### Application Funnel

```typescript
// Count by status
const statuses = ['researching', 'applied', 'interviewing', 'offered'];
for (const status of statuses) {
  const results = await find_by_frontmatter({
    type: 'job_lead',
    status,
  });
  console.log(`${status}: ${results.length}`);
}
```

### Response Rate

```typescript
// Outreach sent vs responded
const sent = await find_by_frontmatter({
  type: 'outreach',
  status: 'sent',
});

const responded = await find_by_frontmatter({
  type: 'outreach',
  status: 'responded',
});

const rate = (responded.length / sent.length) * 100;
console.log(`Response rate: ${rate}%`);
```

### High-Fit Leads Not Applied

```typescript
find_by_frontmatter({
  type: 'job_lead',
  fit_score: { $gte: 7 },
  status: { $ne: 'applied' },
});
```

## Linking Strategy

Link related notes for context:

```markdown
## Related

- Company Research: [[companies/acme-corp]]
- Similar Role: [[job-leads/beta-corp-swe]]
- Contact: [[outreach/jane-smith-acme]]
- Application Task: [[tasks/apply-to-acme]]
```

## Task Integration

Convert leads to tasks for tracking:

```yaml
---
type: task
title: "Apply to Acme Corp - Senior SWE"
status: todo
effort: 3
related_lead: "[[job-leads/acme-corp-swe]]"
checklist:
  - [ ] Tailor CV
  - [ ] Write cover letter
  - [ ] Submit application
  - [ ] Update lead status
---
```

## Daily Routine

1. **Morning**: Check daily outreach goal
2. **Research**: Create lead notes for new opportunities
3. **Outreach**: Create outreach notes, send messages
4. **Track**: Update statuses as you progress
5. **Evening**: Review dashboard, plan tomorrow

## Benefits of Vault-Native Approach

✅ **Flexible** - No hardcoded paths or rigid structure
✅ **Composable** - Use any existing vault tool
✅ **Searchable** - Full-text + frontmatter queries
✅ **Linked** - Natural connections between notes
✅ **Future-Proof** - Add fields as needed, no migrations
✅ **Portable** - Just markdown + frontmatter, works anywhere
✅ **Extensible** - Add custom queries, no code changes needed

## Example: Full Application Flow

```bash
# 1. Discover lead
create_from_template(job-lead-template, "acme-corp-swe")

# 2. Research company
create_note("companies/acme-corp.md")
# Link from lead: [[companies/acme-corp]]

# 3. Find contact
create_from_template(outreach-template, "john-doe-acme")
# Link: [[outreach/john-doe-acme]]

# 4. Send outreach
# Update outreach note: status=sent, sent_date=today

# 5. Prepare application
create_task("Apply to Acme Corp")
# Link back to lead

# 6. Submit
# Update lead: status=applied, applied_date=today

# 7. Track progress
job_hunting_dashboard()
# See: 1 applied, 1 outreach sent
```

No hardcoded services. Just notes, templates, and queries. 🎯
