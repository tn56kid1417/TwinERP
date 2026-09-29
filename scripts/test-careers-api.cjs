const http = require('http');
const jwt = require('jsonwebtoken');

// Import server app
const { createApp } = require('../dist/server.cjs');

async function runTests() {
  console.log('--- Starting Careers Integration Tests ---');
  const app = createApp();
  const server = http.createServer(app);
  
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  const adminToken = jwt.sign({ userId: 'e3', email: 'admin@example.com', role: 'Admin' }, JWT_SECRET, { expiresIn: '1d' });
  const memberToken = jwt.sign({ userId: 'e1', email: 'alice@example.com', role: 'Member' }, JWT_SECRET, { expiresIn: '1d' });

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
    // 1. Public GET /api/careers
    console.log('1. Testing GET /api/careers (public)...');
    const pubRes = await req('/api/careers');
    console.log(`Status: ${pubRes.status}, count: ${Array.isArray(pubRes.body) ? pubRes.body.length : 'not array'}`);
    if (pubRes.status !== 200) throw new Error('GET /api/careers failed');

    // 2. Admin POST /api/careers/admin (create job)
    console.log('2. Testing POST /api/careers/admin (create job)...');
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

    // 3. Public GET /api/careers/:slug
    console.log(`3. Testing GET /api/careers/${createdJob.slug} (public)...`);
    const getSlugRes = await req(`/api/careers/${createdJob.slug}`);
    console.log(`Status: ${getSlugRes.status}, title: ${getSlugRes.body?.title}`);
    if (getSlugRes.status !== 200 || getSlugRes.body?.title !== newJobPayload.title) {
      throw new Error(`GET /api/careers/${createdJob.slug} failed`);
    }

    // 4. Public POST /api/careers/:slug/apply (candidate apply)
    console.log(`4. Testing POST /api/careers/${createdJob.slug}/apply (public candidate apply)...`);
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
    console.log(`Status: ${applyRes.status}, response: ${JSON.stringify(applyRes.body)}`);
    if (applyRes.status !== 201) throw new Error(`POST /api/careers/${createdJob.slug}/apply failed: ${JSON.stringify(applyRes.body)}`);

    // 5. Admin GET /api/careers/:jobId/applications
    console.log(`5. Testing GET /api/careers/${createdJob.id}/applications...`);
    const appsRes = await req(`/api/careers/${createdJob.id}/applications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${appsRes.status}, apps count: ${Array.isArray(appsRes.body) ? appsRes.body.length : 0}`);
    if (appsRes.status !== 200 || appsRes.body.length === 0) throw new Error('GET applications failed');

    // 6. Clean up: Delete created job
    console.log(`6. Testing DELETE /api/careers/admin/${createdJob.id}...`);
    const delRes = await req(`/api/careers/admin/${createdJob.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${delRes.status}`);
    if (delRes.status !== 204) throw new Error(`DELETE /api/careers/admin/${createdJob.id} failed`);

    console.log('\n>>> ALL CAREERS POSTING AND APPLICATION TESTS PASSED 100%! <<<');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
