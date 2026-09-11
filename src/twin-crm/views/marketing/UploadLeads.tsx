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

      <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 max-w-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
            {message.type === 'success' ? <CheckCircle size={20} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />}
            <div>
              <h3 className="text-sm font-semibold">{message.type === 'success' ? 'Success' : 'Error'}</h3>
              <p className="text-xs mt-1 opacity-90">{message.text}</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Upload Excel or CSV (Columns: Name, Company, Email, Phone, Value)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700/80 border-dashed rounded-xl relative bg-slate-50/70 dark:bg-[#07090E]/60 hover:bg-slate-100/70 dark:hover:bg-[#07090E]/90 hover:border-indigo-500/60 transition-all">
              <div className="space-y-1 text-center">
                <File className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedFile ? selectedFile.name : 'XLSX, XLS, CSV up to 10MB'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Assign to Sales Team Leader
            </label>
            <select
              value={selectedLeader}
              onChange={(e) => setSelectedLeader(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/90 dark:bg-[#07090E]/90 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm dark:shadow-inner cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-[#0C1017] text-slate-400">-- Select Leader --</option>
              {leaders.map(l => (
                <option key={l.id} value={l.id} className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">{l.name} ({l.email})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!selectedFile || !selectedLeader}
              className="flex items-center gap-2 px-6 shadow-lg shadow-indigo-500/25"
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
