const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.ts');
let content = fs.readFileSync(apiPath, 'utf8');

const marker1 = "// --- Public Careers Portal Endpoints (No Auth Required) ---";
const marker2 = "  // --- Documents & Contracts Endpoints";

const careersSectionStart = content.indexOf(marker1);
const careersSectionEnd = content.indexOf(marker2);

if (careersSectionStart !== -1 && careersSectionEnd !== -1) {
  const newCareersSection = `// --- Careers & Job Postings Endpoints ---
  // 1. Admin endpoints MUST be registered before parameterized /careers/:slug routes
  router.get('/careers/admin', (_req, res) => {
    res.json(jobPostings);
  });

  router.get('/careers/admin/:id', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job posting not found' });
    res.json(job);
  });

  router.post('/careers/admin', (req, res) => {
    const body = req.body || {};
    const baseSlug = body.slug || (body.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug || \`job-\${Date.now()}\`;
    let suffix = 0;
    while (jobPostings.some(j => j.slug === slug)) {
      suffix++;
      slug = \`\${baseSlug}-\${suffix}\`;
    }

    const newJob = {
      id: \`job-\${Date.now()}\`,
      createdAt: new Date().toISOString(),
      status: body.status || 'DRAFT',
      fields: Array.isArray(body.fields) ? body.fields : [],
      rounds: Array.isArray(body.rounds) ? body.rounds : [],
      applicationConfirmationTemplate: body.applicationConfirmationTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.applicationConfirmationTemplate,
      roundAdvanceTemplate: body.roundAdvanceTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.roundAdvanceTemplate,
      rejectionTemplate: body.rejectionTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.rejectionTemplate,
      hireTemplate: body.hireTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.hireTemplate,
      ...body,
      slug,
    };
    jobPostings.unshift(newJob);
    saveJobPostings();
    res.status(201).json(newJob);
  });

  router.patch('/careers/admin/:id', (req, res) => {
    const index = jobPostings.findIndex(j => j.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Job not found' });
    jobPostings[index] = { ...jobPostings[index], ...req.body };
    saveJobPostings();
    res.json(jobPostings[index]);
  });

  router.patch('/careers/admin/:id/publish', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.status = 'PUBLISHED';
    job.publishedAt = new Date().toISOString();
    saveJobPostings();
    res.json(job);
  });

  router.patch('/careers/admin/:id/close', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.status = 'CLOSED';
    job.closedAt = new Date().toISOString();
    saveJobPostings();
    res.json(job);
  });

  router.delete('/careers/admin/:id', (req, res) => {
    jobPostings = jobPostings.filter(j => j.id !== req.params.id);
    jobApplications = jobApplications.filter(a => a.jobId !== req.params.id);
    saveJobPostings();
    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.status(204).end();
  });

  // --- Fields Management ---
  router.post('/careers/admin/:id/fields', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const newField = { id: 'f-' + Date.now(), ...req.body };
    if (!job.fields) job.fields = [];
    job.fields.push(newField);
    saveJobPostings();
    res.status(201).json(newField);
  });

  router.patch('/careers/admin/:id/fields/reorder', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const { fields } = req.body;
    if (Array.isArray(fields)) {
      job.fields = fields;
      saveJobPostings();
    }
    res.json(job.fields);
  });

  router.patch('/careers/admin/:id/fields/:fieldId', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const fieldIndex = job.fields.findIndex((f: any) => f.id === req.params.fieldId);
    if (fieldIndex === -1) return res.status(404).json({ message: 'Field not found' });
    job.fields[fieldIndex] = { ...job.fields[fieldIndex], ...req.body };
    saveJobPostings();
    res.json(job.fields[fieldIndex]);
  });

  router.delete('/careers/admin/:id/fields/:fieldId', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.fields = job.fields.filter((f: any) => f.id !== req.params.fieldId);
    saveJobPostings();
    res.status(204).end();
  });

  // --- Rounds Management ---
  router.post('/careers/admin/:id/rounds', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const newRound = { id: 'r-' + Date.now(), ...req.body };
    if (!job.rounds) job.rounds = [];
    job.rounds.push(newRound);
    saveJobPostings();
    res.status(201).json(newRound);
  });

  router.patch('/careers/admin/:id/rounds/reorder', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const { rounds } = req.body;
    if (Array.isArray(rounds)) {
      job.rounds = rounds;
      saveJobPostings();
    }
    res.json(job.rounds);
  });

  router.patch('/careers/admin/:id/rounds/:roundId', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const roundIndex = job.rounds.findIndex((r: any) => r.id === req.params.roundId);
    if (roundIndex === -1) return res.status(404).json({ message: 'Round not found' });
    job.rounds[roundIndex] = { ...job.rounds[roundIndex], ...req.body };
    saveJobPostings();
    res.json(job.rounds[roundIndex]);
  });

  router.delete('/careers/admin/:id/rounds/:roundId', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.rounds = job.rounds.filter((r: any) => r.id !== req.params.roundId);
    saveJobPostings();
    res.status(204).end();
  });

  // --- Applications & Candidate Pipeline ---
  router.get('/careers/:jobId/applications', (req, res) => {
    const apps = jobApplications.filter(a => a.jobId === req.params.jobId);
    res.json(apps);
  });

  router.post('/careers/:jobId/applications', (req, res) => {
    const newApp = {
      id: \`app-\${Date.now()}\`,
      jobId: req.params.jobId,
      status: 'APPLIED',
      appliedAt: new Date().toISOString(),
      emailLogs: [],
      ...req.body,
    };
    jobApplications.unshift(newApp);
    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.status(201).json(newApp);
  });

  // Advance Candidate Round + Real Mailer Integration (Tier 2)
  router.patch('/applications/:id/round', async (req, res) => {
    const app = jobApplications.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const { roundId, status = 'INTERVIEWING' } = req.body;
    app.currentRoundId = roundId;
    app.status = status;

    const job = jobPostings.find(j => j.id === app.jobId);
    const round = job?.rounds?.find((r: any) => r.id === roundId);

    try {
      const template = round?.emailTemplate || job?.roundAdvanceTemplate || DEFAULT_CAREER_TEMPLATES.roundAdvanceTemplate;
      const mergeCtx = buildMergeContext(app, job, round);
      const renderedHtml = renderTemplate(template, mergeCtx);
      const recipient = app.email || app.candidateEmail;
      const mailResult = await sendEmail({
        to: recipient,
        subject: \`Update on your application: \${round?.title || 'Next Round'} - \${job?.title}\`,
        html: renderedHtml,
      });

      if (!app.emailLogs) app.emailLogs = [];
      app.emailLogs.push({
        sentAt: new Date().toISOString(),
        to: recipient,
        subject: \`Update on your application: \${round?.title || 'Next Round'} - \${job?.title}\`,
        templateType: 'round_advance',
        html: renderedHtml,
        status: mailResult.status,
        error: mailResult.error
      });
    } catch (e) {
      console.error('[Careers Email] Failed to process round advance email:', e);
    }

    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.json(app);
  });

  // --- Decide Application ---
  router.patch('/careers/admin/applications/:id/decide', async (req, res) => {
    const app = jobApplications.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    
    if (app.status === 'REJECTED' || app.status === 'HIRED') {
      return res.status(400).json({ message: 'Application is already finalized' });
    }

    const { decision } = req.body;
    const job = jobPostings.find(j => j.id === app.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const rounds = job.rounds || [];
    const currentIndex = rounds.findIndex((r: any) => r.id === app.currentRoundId);
    const recipient = app.email || app.candidateEmail;
    
    try {
      if (!app.emailLogs) app.emailLogs = [];
      
      if (decision === 'REJECT') {
        app.status = 'REJECTED';
        const template = job.rejectionTemplate || DEFAULT_CAREER_TEMPLATES.rejectionTemplate;
        const mergeCtx = buildMergeContext(app, job, null);
        const renderedHtml = renderTemplate(template, mergeCtx);
        const mailResult = await sendEmail({
          to: recipient,
          subject: \`Update on your application for \${job.title} at TwinSpace\`,
          html: renderedHtml,
        });
        app.emailLogs.push({
          sentAt: new Date().toISOString(),
          to: recipient,
          subject: \`Update on your application for \${job.title} at TwinSpace\`,
          templateType: 'rejection',
          status: mailResult.status
        });
      } else if (decision === 'ACCEPT') {
        const nextRound = currentIndex === -1 ? rounds[0] : rounds[currentIndex + 1];
        if (nextRound) {
          app.status = 'IN_PROGRESS';
          app.currentRoundId = nextRound.id;
          const template = nextRound.emailTemplate || job.roundAdvanceTemplate || DEFAULT_CAREER_TEMPLATES.roundAdvanceTemplate;
          const mergeCtx = buildMergeContext(app, job, nextRound);
          const renderedHtml = renderTemplate(template, mergeCtx);
          const mailResult = await sendEmail({
            to: recipient,
            subject: \`Update on your application: \${nextRound.title} - \${job.title}\`,
            html: renderedHtml,
          });
          app.emailLogs.push({
            sentAt: new Date().toISOString(),
            to: recipient,
            subject: \`Update on your application: \${nextRound.title} - \${job.title}\`,
            templateType: 'round_advance',
            status: mailResult.status
          });
        } else {
          app.status = 'HIRED';
          const convertedId = provisionEmployeeFromHire(app, job);
          if (convertedId) {
            app.convertedEmployeeId = convertedId;
          }
          
          let employee = employees.find(e => e.email === recipient);
          if (!employee) {
            const nameParts = (app.candidateName || '').split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.slice(1).join(' ') || '';
            const rawDept = job?.department;
            const validDept = ['HRM', 'CRM', 'PM'].includes(rawDept) ? rawDept : null;
            employee = {
              id: \`emp_\${Date.now()}\`,
              firstName,
              lastName,
              email: recipient,
              phone: app.phone || '',
              department: validDept,
              role: 'Member',
              designation: job.title || '',
              hireDate: new Date().toISOString().split('T')[0],
              isActive: false,
              status: 'Onboarding'
            };
            employees.push(employee);
            saveEmployees();
          }
          app.convertedEmployeeId = employee.id;

          const template = job.hireTemplate || DEFAULT_CAREER_TEMPLATES.hireTemplate;
          const mergeCtx = buildMergeContext(app, job, null);
          const renderedHtml = renderTemplate(template, mergeCtx);
          const mailResult = await sendEmail({
            to: recipient,
            subject: \`Offer of Employment: \${job.title} at TwinSpace\`,
            html: renderedHtml,
          });
          app.emailLogs.push({
            sentAt: new Date().toISOString(),
            to: recipient,
            subject: \`Offer of Employment: \${job.title} at TwinSpace\`,
            templateType: 'hire',
            status: mailResult.status
          });
        }
      }
    } catch (e) {
      console.error('[Careers Email] Failed to process decision email:', e);
    }

    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.json(app);
  });

  // Change Candidate Status (HIRED / REJECTED) + Real Mailer Integration (Tier 2)
  router.patch('/applications/:id/status', async (req, res) => {
    const app = jobApplications.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const { status, notes } = req.body;
    app.status = status;
    if (notes) app.notes = notes;

    const job = jobPostings.find(j => j.id === app.jobId);
    const recipient = app.email || app.candidateEmail;

    try {
      if (!app.emailLogs) app.emailLogs = [];

      if (status === 'REJECTED') {
        const template = job?.rejectionTemplate || DEFAULT_CAREER_TEMPLATES.rejectionTemplate;
        const mergeCtx = buildMergeContext(app, job, null);
        const renderedHtml = renderTemplate(template, mergeCtx);
        const mailResult = await sendEmail({
          to: recipient,
          subject: \`Update on your application for \${job?.title || 'Position'} at TwinSpace\`,
          html: renderedHtml,
        });
        app.emailLogs.push({
          sentAt: new Date().toISOString(),
          to: recipient,
          subject: \`Update on your application for \${job?.title || 'Position'} at TwinSpace\`,
          templateType: 'rejection',
          html: renderedHtml,
          status: mailResult.status,
          error: mailResult.error
        });
      } else if (status === 'HIRED') {
        const template = job?.hireTemplate || DEFAULT_CAREER_TEMPLATES.hireTemplate;
        const mergeCtx = buildMergeContext(app, job, null);
        const renderedHtml = renderTemplate(template, mergeCtx);
        const mailResult = await sendEmail({
          to: recipient,
          subject: \`Offer of Employment: \${job?.title || 'Position'} at TwinSpace\`,
          html: renderedHtml,
        });
        app.emailLogs.push({
          sentAt: new Date().toISOString(),
          to: recipient,
          subject: \`Offer of Employment: \${job?.title || 'Position'} at TwinSpace\`,
          templateType: 'hire',
          html: renderedHtml,
          status: mailResult.status,
          error: mailResult.error
        });
      }
    } catch (e) {
      console.error('[Careers Email] Failed to send status email:', e);
    }

    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.json(app);
  });

  router.delete('/applications/:id', (req, res) => {
    jobApplications = jobApplications.filter(a => a.id !== req.params.id);
    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.status(204).end();
  });

  // --- Public Careers Portal Endpoints (Registered AFTER admin endpoints) ---
  router.get('/careers', (_req, res) => {
    const published = jobPostings.filter(j => j.status === 'PUBLISHED');
    res.json(published);
  });

  // Public candidate application submission + Automatic Confirmation Email (Tier 2)
  router.post('/careers/:slug/apply', async (req, res) => {
    const slugOrId = req.params.slug;
    const job = jobPostings.find(j => (j.slug === slugOrId || j.id === slugOrId) && j.status === 'PUBLISHED');
    if (!job) return res.status(404).json({ message: 'Job posting not found or not published' });

    const body = req.body || {};
    const fullName = (body.fullName || body.candidateName || body.name || '').trim();
    const email = (body.email || body.candidateEmail || '').trim();
    const phone = (body.phone || body.candidatePhone || '').trim();
    const qualification = (body.qualification || body.highestQualification || '').trim();
    const experience = (body.experience || '').trim();
    const currentOrg = (body.currentOrg || body.currentCompany || '').trim();
    const resumeLink = (body.resumeLink || body.resumeUrl || '').trim();
    const coverNote = (body.coverNote || body.note || '').trim();

    if (!fullName) return res.status(400).json({ message: 'Full name is required' });
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const newApp = {
      id: \`app-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`,
      jobId: job.id,
      candidateName: fullName,
      fullName: fullName,
      candidateEmail: email,
      email: email,
      candidatePhone: phone,
      phone: phone,
      qualification,
      experience,
      currentOrg,
      resumeUrl: resumeLink,
      resumeLink: resumeLink,
      coverNote,
      currentRoundId: job.rounds?.[0]?.id || null,
      status: 'APPLIED',
      appliedAt: new Date().toISOString(),
      emailLogs: [] as any[]
    };

    try {
      const template = job.applicationConfirmationTemplate || DEFAULT_CAREER_TEMPLATES.applicationConfirmationTemplate;
      const mergeCtx = buildMergeContext(newApp, job, job.rounds?.[0] || null);
      const renderedHtml = renderTemplate(template, mergeCtx);
      const mailResult = await sendEmail({
        to: newApp.email,
        subject: \`Application Received - \${job.title} at TwinSpace\`,
        html: renderedHtml,
      });
      const emailLog = {
        sentAt: new Date().toISOString(),
        to: newApp.email,
        subject: \`Application Received - \${job.title} at TwinSpace\`,
        templateType: 'application_confirmation',
        html: renderedHtml,
        status: mailResult.status,
        error: mailResult.error
      };
      newApp.emailLogs.push(emailLog);
    } catch (err) {
      console.error('[Careers Email] Failed to render/send confirmation email:', err);
    }

    jobApplications.unshift(newApp);
    saveChatFile(APPLICATIONS_FILE, jobApplications);

    try {
      addNotification({
        title: \`New Job Application: \${job.title}\`,
        message: \`\${newApp.fullName} applied for \${job.title}. Candidate profile available in recruitment pipeline.\`,
        type: 'approval',
        targetRole: 'HR,Manager'
      });
    } catch (err) {
      console.error('Failed to dispatch in-app notification for new application:', err);
    }

    res.status(201).json({ message: 'Application submitted successfully', application: newApp });
  });

  // Public GET /careers/:slug MUST be the final careers route
  router.get('/careers/:slug', (req, res, next) => {
    const slugOrId = req.params.slug;
    if (slugOrId === 'admin') return next();
    const job = jobPostings.find(j => (j.slug === slugOrId || j.id === slugOrId) && j.status === 'PUBLISHED');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  });

  `;

  content = content.substring(0, careersSectionStart) + newCareersSection + content.substring(careersSectionEnd);
  fs.writeFileSync(apiPath, content, 'utf8');
  console.log('Successfully reorganized careers routes!');
} else {
  console.error('Could not locate markers in api/index.ts. Found marker1:', careersSectionStart, 'marker2:', careersSectionEnd);
  process.exit(1);
}
