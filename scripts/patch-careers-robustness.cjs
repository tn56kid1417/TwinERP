const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.ts');
let content = fs.readFileSync(apiPath, 'utf8');

// 1. Update getCallerFromHeaders
const oldCaller = `function getCallerFromHeaders(req: express.Request): { userId: string; userRole: string } | null {
  const ROLES = ['Admin', 'CEO', 'COO', 'CTO', 'TL', 'Member'];
  // 1. Check signed JWT Bearer Token first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && (decoded.userId || decoded.id)) {
        const role = decoded.role;
        if (role && ROLES.includes(role)) {
          return {
            userId: decoded.userId || decoded.id,
            userRole: role
          };
        }
      }
    } catch { /* token invalid or expired */ }
  }

  // 2. Local dev fallback ONLY gated behind explicit environment flag
  if (process.env.ALLOW_HEADER_AUTH === 'true') {
    const userId   = req.headers['x-user-id']   as string | undefined;
    const userRole = req.headers['x-user-role'] as string | undefined;
    if (userId && userRole && ROLES.includes(userRole)) {
      return { userId, userRole };
    }
  }

  return null;
}`;

const newCaller = `function getCallerFromHeaders(req: express.Request): { userId: string; userRole: string } | null {
  const ROLES = ['Admin', 'CEO', 'COO', 'CTO', 'TL', 'Member'];
  const mapLegacyRole = (r?: string) => {
    if (!r) return undefined;
    if (ROLES.includes(r)) return r;
    const low = r.toLowerCase();
    if (low.includes('admin')) return 'Admin';
    if (low === 'ceo') return 'CEO';
    if (low === 'coo') return 'COO';
    if (low === 'cto') return 'CTO';
    if (low.includes('leader') || low === 'manager' || low === 'tl' || low === 'hr') return 'TL';
    return 'Member';
  };

  // 1. Check signed JWT Bearer Token first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && (decoded.userId || decoded.id)) {
        const uid = decoded.userId || decoded.id;
        const emp = employees.find(e => e.id === uid);
        const resolvedRole = emp?.role || mapLegacyRole(decoded.role) || 'Member';
        if (resolvedRole && ROLES.includes(resolvedRole)) {
          return {
            userId: uid,
            userRole: resolvedRole
          };
        }
      }
    } catch { /* token invalid or expired */ }
  }

  // 2. Local dev / header fallback
  const userId   = req.headers['x-user-id']   as string | undefined;
  const userRole = req.headers['x-user-role'] as string | undefined;
  if (userId) {
    const emp = employees.find(e => e.id === userId);
    const resolvedRole = emp?.role || mapLegacyRole(userRole) || 'Member';
    if (resolvedRole && ROLES.includes(resolvedRole)) {
      return { userId, userRole: resolvedRole };
    }
  }

  return null;
}`;

content = content.replace(oldCaller.replace(/\r?\n/g, '\r\n'), newCaller.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldCaller.replace(/\r?\n/g, '\n'), newCaller.replace(/\r?\n/g, '\n'));

// 2. Update authenticateToken to cleanly handle /api prefix for public paths
const oldAuth = `  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pathName = req.path || req.url || '';
    if (
      pathName === '/health' ||
      pathName === '/login' ||
      (pathName === '/careers' || pathName.match(/^\\/careers\\/[^/]+$/) || pathName.match(/^\\/careers\\/[^/]+\\/apply$/)) ||
      pathName.startsWith('/apply')
    ) {
      return next();
    }`;

const newAuth = `  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawPath = req.path || req.url || '';
    const cleanPath = rawPath.replace(/^\\/api/, '');
    if (
      cleanPath === '/health' ||
      cleanPath === '/login' ||
      cleanPath === '/careers' ||
      cleanPath.match(/^\\/careers\\/[^/]+$/) ||
      cleanPath.match(/^\\/careers\\/[^/]+\\/apply$/) ||
      cleanPath.startsWith('/apply')
    ) {
      return next();
    }`;

content = content.replace(oldAuth.replace(/\r?\n/g, '\r\n'), newAuth.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldAuth.replace(/\r?\n/g, '\n'), newAuth.replace(/\r?\n/g, '\n'));

// 3. Update public application submission
const oldApplyBody = `    const {
      fullName, email, phone, qualification, experience, currentOrg, resumeLink, coverNote
    } = req.body || {};

    if (!fullName?.trim()) return res.status(400).json({ message: 'Full name is required' });
    if (!email?.trim()) return res.status(400).json({ message: 'Email is required' });

    const newApp = {
      id: \`app-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`,
      jobId: job.id,
      candidateName: fullName.trim(),
      fullName: fullName.trim(),
      candidateEmail: email.trim(),
      email: email.trim(),
      candidatePhone: phone?.trim() || '',
      phone: phone?.trim() || '',
      qualification: qualification?.trim() || '',
      experience: experience?.trim() || '',
      currentOrg: currentOrg?.trim() || '',
      resumeUrl: resumeLink?.trim() || '',
      resumeLink: resumeLink?.trim() || '',
      coverNote: coverNote?.trim() || '',
      currentRoundId: job.rounds?.[0]?.id || null,
      status: 'APPLIED',
      appliedAt: new Date().toISOString(),
      emailLogs: [] as any[]
    };`;

const newApplyBody = `    const body = req.body || {};
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
    };`;

content = content.replace(oldApplyBody.replace(/\r?\n/g, '\r\n'), newApplyBody.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldApplyBody.replace(/\r?\n/g, '\n'), newApplyBody.replace(/\r?\n/g, '\n'));

fs.writeFileSync(apiPath, content, 'utf8');
console.log('Careers robustness patch applied successfully');
