const fs = require('fs')
const file = 'src/twin-crm/views/marketing/UploadLeads.tsx'
let content = fs.readFileSync(file, 'utf8')

// use regex for replacing to avoid exact spacing matches
content = content.replace(/for \(let i = startIdx; i < lines\.length; i\+\+\) \{[\s\S]*?setMessage\(\{ type: 'success'/m, `const newLeadsData = []
      
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
      
      setMessage({ type: 'success'`)

fs.writeFileSync(file, content)
