const http = require('http');
const jwt = require('jsonwebtoken');

// 1. Rebuild server.cjs
const { execSync } = require('child_process');
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
        { id: 'r1', title: 'Round 1: Screening', shortDescription: 'Profile review', order: 1 }
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
        resumeLink: 'https://example.com/resumes/devops.pdf'
      })
    });
    console.log(`Status: ${applyRes.status}`);
    if (applyRes.status !== 201) throw new Error(`POST /api/careers/${createdJob.slug}/apply failed`);

    // 7. Testing Attendance shifts route
    console.log('7. Testing GET /api/attendance/shifts...');
    const shiftsRes = await req('/api/attendance/shifts', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${shiftsRes.status}, shifts: ${shiftsRes.body.length}`);
    if (shiftsRes.status !== 200 || !Array.isArray(shiftsRes.body)) throw new Error('GET /api/attendance/shifts failed');

    // 8. Clean up: Delete created job
    console.log(`8. Testing DELETE /api/careers/admin/${createdJob.id}...`);
    const delRes = await req(`/api/careers/admin/${createdJob.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${delRes.status}`);
    if (delRes.status !== 204) throw new Error(`DELETE /api/careers/admin/${createdJob.id} failed`);

    console.log('\n====================================================');
    console.log('>>> ALL VERIFICATIONS & TESTS PASSED 100%! <<<');
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
