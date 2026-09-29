const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.ts');
let content = fs.readFileSync(apiPath, 'utf8');

// 1. Guard /attendance/:employeeId so it doesn't intercept /attendance/shifts
const oldAttRoute = `  router.get('/attendance/:employeeId', (req, res) => {
    const empAtt = attendances.filter(a => a.employeeId === req.params.employeeId);
    res.json(empAtt);
  });`;

const newAttRoute = `  router.get('/attendance/shifts', (req, res) => {
    res.json([
      { id: 's1', name: 'Morning', startTime: '09:00', endTime: '18:00' },
      { id: 's2', name: 'Evening', startTime: '13:00', endTime: '22:00' },
      { id: 's3', name: 'Night', startTime: '21:00', endTime: '06:00' }
    ]);
  });

  router.get('/attendance/:employeeId', (req, res, next) => {
    if (req.params.employeeId === 'shifts') return next();
    const empAtt = attendances.filter(a => a.employeeId === req.params.employeeId);
    res.json(empAtt);
  });`;

content = content.replace(oldAttRoute.replace(/\r?\n/g, '\r\n'), newAttRoute.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldAttRoute.replace(/\r?\n/g, '\n'), newAttRoute.replace(/\r?\n/g, '\n'));

// Remove duplicate attendance/shifts from later in file if exists
const dupShifts = `  router.get('/attendance/shifts', (req, res) => {
    res.json([
      { id: 's1', name: 'Morning', startTime: '09:00', endTime: '18:00' },
      { id: 's2', name: 'Evening', startTime: '13:00', endTime: '22:00' },
      { id: 's3', name: 'Night', startTime: '21:00', endTime: '06:00' }
    ]);
  });`;

// 2. Fix /careers/:slug shadowing /careers/admin
const oldCareersSlug = `  router.get('/careers/:slug', (req, res) => {
    const slugOrId = req.params.slug;
    const job = jobPostings.find(j => (j.slug === slugOrId || j.id === slugOrId) && j.status === 'PUBLISHED');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  });`;

const newCareersSlug = `  router.get('/careers/:slug', (req, res, next) => {
    const slugOrId = req.params.slug;
    if (slugOrId === 'admin') return next();
    const job = jobPostings.find(j => (j.slug === slugOrId || j.id === slugOrId) && j.status === 'PUBLISHED');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  });`;

content = content.replace(oldCareersSlug.replace(/\r?\n/g, '\r\n'), newCareersSlug.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldCareersSlug.replace(/\r?\n/g, '\n'), newCareersSlug.replace(/\r?\n/g, '\n'));

fs.writeFileSync(apiPath, content, 'utf8');
console.log('Route order fix applied successfully');
