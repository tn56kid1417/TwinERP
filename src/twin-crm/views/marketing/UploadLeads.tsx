import React, { useState, useEffect } from 'react'
import { UploadCloud, CheckCircle, AlertCircle, FileText, File } from 'lucide-react'
import * as XLSX from 'xlsx'
import { api } from '../../services/api'
import { useLeadStore } from '../../store/leadStore'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { User } from '../../types'

export const UploadLeads: React.FC = () => {
  const { user } = useAuthStore()
  const { createLead } = useLeadStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [leaders, setLeaders] = useState<User[]>([])
  const [selectedLeader, setSelectedLeader] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await api.get('/users', { params: { companyId: user?.companyId } })
        // For demonstration, map anyone with role SALES_LEADER or simply SALES_USER if no leaders exist
        const allUsers = res.data as User[];
        const availableLeaders = allUsers.filter(u => u.role === 'SALES_LEADER');
        setLeaders(availableLeaders)
      } catch (err) {
        console.error("Failed to fetch leaders", err)
      }
    }
    fetchLeaders()
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select an Excel or CSV file.' })
      return
    }
    if (!selectedLeader) {
      setMessage({ type: 'error', text: 'Please select a Sales Team Leader to assign these leads.' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      
      let successCount = 0
      
      // Skip header if it contains 'name'
      const firstRowStr = (json[0] || []).join(',').toLowerCase()
      const startIdx = firstRowStr.includes('name') ? 1 : 0

      const newLeadsData = []
      
      for (let i = startIdx; i < json.length; i++) {
        const row = json[i]
        if (!row || row.length === 0) continue

        const name = row[0]?.toString().trim()
        const companyName = row[1]?.toString().trim()
        const email = row[2]?.toString().trim()
        const phone = row[3]?.toString().trim()
        const valueStr = row[4]?.toString().trim()

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
      
      setMessage({ type: 'success', text: `Successfully uploaded and assigned ${successCount} leads.` })
      setSelectedFile(null)
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      setSelectedLeader('')
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'An error occurred while uploading leads.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Upload Leads
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload a CSV of leads and assign them to a Sales Team Leader.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm max-w-3xl">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>
            {message.type === 'success' ? <CheckCircle size={20} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />}
            <div>
              <h3 className="text-sm font-semibold">{message.type === 'success' ? 'Success' : 'Error'}</h3>
              <p className="text-xs mt-1 opacity-90">{message.text}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Upload Excel or CSV (Columns: Name, Company, Email, Phone, Value)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="space-y-1 text-center">
                <File className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedFile ? selectedFile.name : 'XLSX, XLS, CSV up to 10MB'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Assign to Sales Team Leader
            </label>
            <select
              value={selectedLeader}
              onChange={(e) => setSelectedLeader(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            >
              <option value="">-- Select Leader --</option>
              {leaders.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!selectedFile || !selectedLeader}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6"
            >
              <UploadCloud size={18} />
              Upload and Assign
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadLeads
