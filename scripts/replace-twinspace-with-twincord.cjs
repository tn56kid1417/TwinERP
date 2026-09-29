const fs = require('fs');
const path = require('path');

// 1. Update api/index.ts
const apiPath = path.join(__dirname, '..', 'api', 'index.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(/TwinSpace/g, 'Twincord');
apiContent = apiContent.replace(/twinspace\.io/g, 'twincord.in');
apiContent = apiContent.replace(/twinspace\.in/g, 'twincord.in');
fs.writeFileSync(apiPath, apiContent, 'utf8');

// 2. Update PublicNavbar.tsx
const navbarPath = path.join(__dirname, '..', 'src', 'components', 'careers', 'PublicNavbar.tsx');
if (fs.existsSync(navbarPath)) {
  let nav = fs.readFileSync(navbarPath, 'utf8');
  nav = nav.replace(/TwinSpace/g, 'Twincord');
  fs.writeFileSync(navbarPath, nav, 'utf8');
}

// 3. Update PublicFooter.tsx
const footerPath = path.join(__dirname, '..', 'src', 'components', 'careers', 'PublicFooter.tsx');
if (fs.existsSync(footerPath)) {
  let foot = fs.readFileSync(footerPath, 'utf8');
  foot = foot.replace(/TwinSpace/g, 'Twincord');
  fs.writeFileSync(footerPath, foot, 'utf8');
}

// 4. Update CareersDetail.tsx & CareersList.tsx
const detailPath = path.join(__dirname, '..', 'src', 'pages', 'careers', 'CareersDetail.tsx');
if (fs.existsSync(detailPath)) {
  let detail = fs.readFileSync(detailPath, 'utf8');
  detail = detail.replace(/savedJobs_twinspace/g, 'savedJobs_twincord');
  detail = detail.replace(/TwinSpace/g, 'Twincord');
  fs.writeFileSync(detailPath, detail, 'utf8');
}

const listPath = path.join(__dirname, '..', 'src', 'pages', 'careers', 'CareersList.tsx');
if (fs.existsSync(listPath)) {
  let list = fs.readFileSync(listPath, 'utf8');
  list = list.replace(/savedJobs_twinspace/g, 'savedJobs_twincord');
  list = list.replace(/TwinSpace/g, 'Twincord');
  fs.writeFileSync(listPath, list, 'utf8');
}

console.log('Successfully replaced TwinSpace with Twincord across all files!');
