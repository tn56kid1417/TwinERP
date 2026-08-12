const fs = require('fs')
const file = 'src/twin-crm/views/marketing/UploadLeads.tsx'
let content = fs.readFileSync(file, 'utf8')
const target = `    try {
      const lines = csvData.split(/\\\\n|\\n|\\r\\n/).filter(l => l.trim())
      let successCount = 0
      
      // Skip header if it contains 'name'
      const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0
      for (let i = startIdx; i < lines.length; i++) {
        const [name, companyName, email, phone, valueStr] = lines[i].split(',').map(s => s.trim())
        if (name && email) {
          await createLead({
            name,
            companyName: companyName || 'Unknown Company',
            email,
            phone: phone || '',
            status: 'New',
            assignedUserId: selectedLeader,
            companyId: user?.companyId || 'company-1',
            value: parseInt(valueStr) || 0,
          })
          successCount++
        }
      }
      
      setMessage({ type: 'success', text: \`Successfully uploaded and assigned \${successCount} leads.\` })`

const replacement = `    try {
      const lines = csvData.split(/\\\\n|\\n|\\r\\n/).filter(l => l.trim())
      let successCount = 0
      
      // Skip header if it contains 'name'
      const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0
      
      const newLeadsData = []
      
      for (let i = startIdx; i < lines.length; i++) {
        const [name, companyName, email, phone, valueStr] = lines[i].split(',').map(s => s.trim())
        if (name && email) {
          newLeadsData.push({
            name,
            companyName: companyName || 'Unknown Company',
            email,
            phone: phone || '',
            status: 'New',
            assignedUserId: selectedLeader,
            companyId: user?.companyId || 'company-1',
            value: parseInt(valueStr) || 0,
          })
          successCount++
        }
      }
      
      if (newLeadsData.length > 0) {
        await api.post('/leads/batch', newLeadsData)
      }
      
      setMessage({ type: 'success', text: \`Successfully uploaded and assigned \${successCount} leads.\` })`

content = content.replace(target, replacement)
fs.writeFileSync(file, content)
