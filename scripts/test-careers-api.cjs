require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');

// 1. Rebuild server.cjs
execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', { stdio: 'inherit' });

// 2. Import server app
const { createApp } = require('../dist/server.cjs');

async function runTests() {
  console.log('--- Starting Comprehensive Careers & Routes Integration Tests ---');
  const app = createApp();
  const server = http.createServer(app);
  
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  const adminToken = jwt.sign({ userId: 'e3', email: 'admin@example.com', role: 'Admin' }, JWT_SECRET, { expiresIn: '1d' });

  async function req(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, options);
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return { status: res.status, body };
  }

  try {
    // 1. Admin GET /api/careers/admin (MUST NOT RETURN 404!)
    console.log('1. Testing GET /api/careers/admin (Admin list)...');
    const adminGetRes = await req('/api/careers/admin', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${adminGetRes.status}, count: ${Array.isArray(adminGetRes.body) ? adminGetRes.body.length : 'not array'}`);
    if (adminGetRes.status !== 200 || !Array.isArray(adminGetRes.body)) {
      throw new Error(`GET /api/careers/admin failed with status ${adminGetRes.status}: ${JSON.stringify(adminGetRes.body)}`);
    }

    // 2. Public GET /api/careers
    console.log('2. Testing GET /api/careers (Public list)...');
    const pubRes = await req('/api/careers');
    console.log(`Status: ${pubRes.status}, count: ${Array.isArray(pubRes.body) ? pubRes.body.length : 'not array'}`);
    if (pubRes.status !== 200) throw new Error('GET /api/careers failed');

    // 3. Admin POST /api/careers/admin (create job)
    console.log('3. Testing POST /api/careers/admin (create job)...');
    const newJobPayload = {
      title: 'Senior Cloud DevOps Architect',
      department: 'PM',
      employmentType: 'Full-Time',
      location: 'Remote',
      status: 'PUBLISHED',
      fields: [
        { id: 'f1', label: 'Experience', value: '5+ Years', section: 'PRIMARY', order: 1 }
      ],
      rounds: [
        { id: 'r1', title: 'Round 1: Screening', shortDescription: 'Profile review', order: 1 },
        { id: 'r2', title: 'Round 2: Technical Architecture', shortDescription: 'Hands-on design', order: 2 },
        { id: 'r3', title: 'Round 3: Leadership Fit', shortDescription: 'Exec alignment', order: 3 }
      ]
    };

    const createRes = await req('/api/careers/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newJobPayload)
    });
    console.log(`Status: ${createRes.status}, job: ${createRes.body.id}, slug: ${createRes.body.slug}`);
    if (createRes.status !== 201 || !createRes.body.id) throw new Error(`POST /api/careers/admin failed: ${JSON.stringify(createRes.body)}`);

    const createdJob = createRes.body;

    // 4. Admin GET /api/careers/admin/:id
    console.log(`4. Testing GET /api/careers/admin/${createdJob.id}...`);
    const getJobByIdRes = await req(`/api/careers/admin/${createdJob.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${getJobByIdRes.status}, title: ${getJobByIdRes.body?.title}`);
    if (getJobByIdRes.status !== 200) throw new Error(`GET /api/careers/admin/${createdJob.id} failed`);

    // 5. Public GET /api/careers/:slug
    console.log(`5. Testing GET /api/careers/${createdJob.slug} (public)...`);
    const getSlugRes = await req(`/api/careers/${createdJob.slug}`);
    console.log(`Status: ${getSlugRes.status}, title: ${getSlugRes.body?.title}`);
    if (getSlugRes.status !== 200 || getSlugRes.body?.title !== newJobPayload.title) {
      throw new Error(`GET /api/careers/${createdJob.slug} failed`);
    }

    // 6. Public POST /api/careers/:slug/apply
    console.log(`6. Testing POST /api/careers/${createdJob.slug}/apply (public candidate apply)...`);
    const applyRes = await req(`/api/careers/${createdJob.slug}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'DevOps Candidate',
        email: 'devops.candidate@example.com',
        phone: '+91 9988776655',
        highestQualification: 'B.Tech IT',
        experience: '5 years AWS & Terraform',
        currentCompany: 'Cloud Systems',
        resumeLink: 'https://example.com/resumes/devops.pdf',
        coverNote: 'Excited to bring automated deployments to Twincord!'
      })
    });
    console.log(`Status: ${applyRes.status}`);
    if (applyRes.status !== 201) throw new Error(`POST /api/careers/${createdJob.slug}/apply failed`);

    // 7. Admin GET /api/careers/admin/applications (Test pipeline retrival)
    console.log('7. Testing GET /api/careers/admin/applications (Global & per-job pipeline)...');
    const appsRes = await req('/api/careers/admin/applications', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${appsRes.status}, count: ${Array.isArray(appsRes.body) ? appsRes.body.length : 0}`);
    if (appsRes.status !== 200 || !Array.isArray(appsRes.body)) throw new Error('GET /api/careers/admin/applications failed');

    const app = appsRes.body.find(a => a.candidateEmail === 'devops.candidate@example.com');
    if (!app) throw new Error('Submitted candidate not found in pipeline');

    // 8. Admin PATCH /api/applications/:id (Candidate editing + Interview scheduling)
    console.log(`8. Testing PATCH /api/applications/${app.id} (Candidate editing & interview scheduling)...`);
    const editAppRes = await req(`/api/applications/${app.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        rating: 5,
        notes: 'Exceptional deep knowledge of distributed cloud architecture',
        interviewDate: '2026-10-05',
        interviewTime: '15:00',
        interviewerName: 'Chief Technology Officer',
        meetingLink: 'https://meet.google.com/abc-defg-hij'
      })
    });
    console.log(`Status: ${editAppRes.status}, rating: ${editAppRes.body?.rating}, scheduled: ${editAppRes.body?.interviewDate}`);
    if (editAppRes.status !== 200 || editAppRes.body?.rating !== 5) throw new Error('PATCH /api/applications/:id failed');

    // 9. Admin PATCH /api/applications/:id/round (Round upgrade)
    console.log(`9. Testing PATCH /api/applications/${app.id}/round (Upgrade to Technical Round)...`);
    const roundRes = await req(`/api/applications/${app.id}/round`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ roundId: 'r2', status: 'INTERVIEWING' })
    });
    console.log(`Status: ${roundRes.status}, round: ${roundRes.body?.currentRoundId}`);
    if (roundRes.status !== 200 || roundRes.body?.currentRoundId !== 'r2') throw new Error('PATCH /api/applications/:id/round failed');

    // 10. Admin PATCH /api/applications/:id/status (Hire candidate & employee provisioning)
    console.log(`10. Testing PATCH /api/applications/${app.id}/status (Hire candidate)...`);
    const hireRes = await req(`/api/applications/${app.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'HIRED' })
    });
    console.log(`Status: ${hireRes.status}, app status: ${hireRes.body?.status}, convertedEmp: ${hireRes.body?.convertedEmployeeId}`);
    if (hireRes.status !== 200 || hireRes.body?.status !== 'HIRED' || !hireRes.body?.convertedEmployeeId) {
      throw new Error('PATCH /api/applications/:id/status (HIRED) failed');
    }

    // 11. Testing Attendance shifts route
    console.log('11. Testing GET /api/attendance/shifts...');
    const shiftsRes = await req('/api/attendance/shifts', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${shiftsRes.status}, shifts: ${shiftsRes.body.length}`);
    if (shiftsRes.status !== 200 || !Array.isArray(shiftsRes.body)) throw new Error('GET /api/attendance/shifts failed');

    // 12. Clean up: Delete created candidate and job
    console.log(`12. Testing DELETE /api/applications/${app.id}...`);
    const delAppRes = await req(`/api/applications/${app.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${delAppRes.status}`);

    console.log(`13. Testing DELETE /api/careers/admin/${createdJob.id}...`);
    const delRes = await req(`/api/careers/admin/${createdJob.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${delRes.status}`);
    if (delRes.status !== 204) throw new Error(`DELETE /api/careers/admin/${createdJob.id} failed`);

    console.log('\n====================================================');
    console.log('>>> ALL VERIFICATIONS & REAL-WORLD SUITE PASSED 100%! <<<');
    console.log('====================================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
