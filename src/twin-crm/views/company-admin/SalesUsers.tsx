import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, Mail, Search, ShieldAlert, Award, PhoneCall, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import type { User } from '../../types'
import { generateEmployeeReport, generateEntireReport } from '../../utils/reports'

const salesUserSchema = z.object({
 name: z.string().min(2, 'Name must be at least 2 characters'),
 email: z.string().min(1, 'Email is required').email('Invalid email address'),
 designation: z.string().min(2, 'Designation is required'),
 mobile: z.string().min(6, 'Mobile number is required'),
 password: z.string().optional().or(z.literal('')),
 confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
 if (data.password && data.password !== data.confirmPassword) {
 return false
 }
 return true
}, {
 message: 'Passwords do not match',
 path: ['confirmPassword'],
})

type SalesUserFormValues = z.infer<typeof salesUserSchema>

export const SalesUsers: React.FC = () => {
 const { user } = useAuthStore()
 const [salesReps, setSalesReps] = useState<User[]>([])
 const [loading, setLoading] = useState(true)
 
 // UI states
 const [searchQuery, setSearchQuery] = useState('')
 const [currentPage, setCurrentPage] = useState(1)
 const itemsPerPage = 5
 
 const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
 const [selectedRep, setSelectedRep] = useState<User | null>(null)
 const [submitting, setSubmitting] = useState(false)

 const {
 register,
 handleSubmit,
 reset,
 formState: { errors },
 } = useForm<SalesUserFormValues>({
 resolver: zodResolver(salesUserSchema),
 defaultValues: {
 name: '',
 email: '',
 designation: '',
 mobile: '',
 password: '',
 confirmPassword: '',
 },
 })

 const companyId = user?.companyId

 const fetchSalesReps = async () => {
 if (!companyId) return
 setLoading(true)
 try {
 const response = await api.get('/users', {
 params: { companyId, role: 'SALES_USER' },
 })
 setSalesReps(response.data)
 } catch {
 toast.error('Failed to retrieve sales team roster.')
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 fetchSalesReps()
 }, [companyId])

 const openAddModal = () => {
 setSelectedRep(null)
 reset({
 name: '',
 email: '',
 designation: '',
 mobile: '',
 password: '',
 confirmPassword: '',
 })
 setIsAddEditModalOpen(true)
 }

 const openEditModal = (rep: User) => {
 setSelectedRep(rep)
 reset({
 name: rep.name,
 email: rep.email,
 designation: rep.designation || '',
 mobile: rep.mobile || '',
 password: '',
 confirmPassword: '',
 })
 setIsAddEditModalOpen(true)
 }

 const openDeleteModal = (rep: User) => {
 setSelectedRep(rep)
 setIsDeleteModalOpen(true)
 }

 const onSubmit = async (data: SalesUserFormValues) => {
 if (!companyId) return
 setSubmitting(true)
 try {
 if (selectedRep) {
 // Edit existing rep
 const payload: Record<string, string> = {
 name: data.name,
 email: data.email,
 designation: data.designation,
 mobile: data.mobile,
 }
 if (data.password) {
 payload.password = data.password
 }
 await api.put(`/users/${selectedRep.id}`, payload)
 toast.success('Sales user updated successfully.')
 } else {
 // Add new rep
 await api.post('/users', {
 name: data.name,
 email: data.email,
 role: 'SALES_USER',
 companyId,
 designation: data.designation,
 mobile: data.mobile,
 password: data.password || 'password', // Default fallback
 })
 toast.success('Successfully added new sales representative!')
 }
 setIsAddEditModalOpen(false)
 fetchSalesReps()
 } catch (err: any) {
 toast.error(err.data?.message || 'Failed to submit form.')
 } finally {
 setSubmitting(false)
 }
 }

 const handleDelete = async () => {
 if (!selectedRep) return
 setSubmitting(true)
 try {
 await api.delete(`/users/${selectedRep.id}`)
 toast.success('Sales representative removed from system.')
 setIsDeleteModalOpen(false)
 fetchSalesReps()
 } catch {
 toast.error('Failed to remove sales representative.')
 } finally {
 setSubmitting(false)
 }
 }

 // Filter & Paginate
 const filteredReps = salesReps.filter(
 (rep) =>
 rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 rep.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (rep.designation && rep.designation.toLowerCase().includes(searchQuery.toLowerCase()))
 )

 const totalPages = Math.ceil(filteredReps.length / itemsPerPage)
 const paginatedReps = filteredReps.slice(
 (currentPage - 1) * itemsPerPage,
 currentPage * itemsPerPage
 )

 useEffect(() => {
 // Reset page index if search query changes
 setCurrentPage(1)
 }, [searchQuery])

 const columns: Column<User>[] = [
 {
 header: 'Representative Details',
 accessor: (row) => (
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
 {row.name.charAt(0)}
 </div>
 <div className="text-left">
 <h4 className="font-semibold text-slate-800 leading-snug">{row.name}</h4>
 <span className="text-xs text-slate-400 flex items-center gap-1">
 <Mail size={12} /> {row.email}
 </span>
 </div>
 </div>
 ),
 },
 {
 header: 'Designation',
 accessor: (row) => (
 <span className="text-slate-650 font-medium flex items-center gap-1.5">
 <Award size={14} className="text-slate-400"/> {row.designation || 'Account Manager'}
 </span>
 ),
 },
 {
 header: 'Phone / Mobile',
 accessor: (row) => (
 <span className="text-slate-500 font-medium flex items-center gap-1.5">
 <PhoneCall size={14} className="text-slate-400"/> {row.mobile || '--'}
 </span>
 ),
 },
 {
 header: 'Actions',
 accessor: (row) => (
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={async () => {
 if (!companyId) return;
 try {
 toast.loading('Generating report...', { id: 'report' });
 await generateEmployeeReport(row, companyId);
 toast.success('Report downloaded', { id: 'report' });
 } catch {
 toast.error('Failed to generate report', { id: 'report' });
 }
 }}
 className="p-2 border rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200 cursor-pointer"
 title="Download Report"
 >
 <Download size={14} />
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => openEditModal(row)}
 className="p-2 border rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 cursor-pointer"
 title="Edit details"
 >
 <Edit2 size={14} />
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => openDeleteModal(row)}
 className="p-2 border border-danger/25 rounded-lg hover:bg-danger/10 text-danger hover:text-danger-foreground cursor-pointer"
 title="Remove account"
 >
 <Trash2 size={14} />
 </Button>
 </div>
 ),
 },
 ]

 return (
 <div className="space-y-6">
 {/* View Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
 <div>
 <h1 className="text-2xl font-bold tracking-tight">Sales Team Management</h1>
 <p className="text-sm font-medium text-slate-500">
 Configure profiles, mobile details, and login authorizations for your sales team.
 </p>
 </div>
 <div className="flex items-center gap-3 w-full sm:w-auto">
 {(user?.designation === 'CEO' || user?.designation === 'CTO') && (
 <Button 
 variant="outline"
 onClick={async () => {
 if (!companyId) return;
 try {
 toast.loading('Generating entire report...', { id: 'entire-report' });
 await generateEntireReport(companyId);
 toast.success('Entire report downloaded', { id: 'entire-report' });
 } catch {
 toast.error('Failed to generate report', { id: 'entire-report' });
 }
 }} 
 className="flex items-center gap-2 cursor-pointer w-full sm:w-auto shadow-sm bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
 >
 <Download size={16} /> Download Entire Report
 </Button>
 )}
 <Button onClick={openAddModal} className="flex items-center gap-2 cursor-pointer w-full sm:w-auto shadow-sm">
 <Plus size={16} /> Add Sales User
 </Button>
 </div>
 </div>

 {/* Search Input Filter */}
 <div className="flex items-center max-w-md bg-white border border-slate-200 rounded-xl shadow-sm px-3.5 gap-2.5">
 <Search size={18} className="text-slate-400 flex-shrink-0"/>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search by name, email or designation..."
 className="w-full text-sm py-2.5 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
 />
 </div>

 {/* Main Roster Table */}
 <Table
 columns={columns}
 data={paginatedReps}
 isLoading={loading}
 emptyMessage="No sales representatives enrolled."
 />

 {/* Pagination Footer */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
 <span>
 Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredReps.length} reps)
 </span>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 disabled={currentPage === 1}
 onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
 className="cursor-pointer"
 >
 Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 disabled={currentPage === totalPages}
 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
 className="cursor-pointer"
 >
 Next
 </Button>
 </div>
 </div>
 )}

 {/* Add / Edit Representative Modal */}
 <Modal
 isOpen={isAddEditModalOpen}
 onClose={() => setIsAddEditModalOpen(false)}
 title={selectedRep ? 'Configure Account Settings' : 'Enroll Sales Representative'}
 size="md"
 >
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
 <Input
 type="text"
 label="Full Name"
 placeholder="John Doe"
 error={errors.name?.message}
 {...register('name')}
 />

 <div className="grid grid-cols-2 gap-4">
 <Input
 type="text"
 label="Designation"
 placeholder="Senior Sales Rep"
 error={errors.designation?.message}
 {...register('designation')}
 />
 <Input
 type="text"
 label="Mobile Number"
 placeholder="+1 (555) 012-3344"
 error={errors.mobile?.message}
 {...register('mobile')}
 />
 </div>

 <Input
 type="email"
 label="Login Email Address"
 placeholder="john@acme.com"
 disabled={!!selectedRep}
 error={errors.email?.message}
 {...register('email')}
 />

 <div className="grid grid-cols-2 gap-4">
 <Input
 type="password"
 label={selectedRep ? 'Change Password (Optional)' : 'Password'}
 placeholder="••••••••"
 error={errors.password?.message}
 {...register('password')}
 />
 <Input
 type="password"
 label={selectedRep ? 'Confirm Change' : 'Confirm Password'}
 placeholder="••••••••"
 error={errors.confirmPassword?.message}
 {...register('confirmPassword')}
 />
 </div>

 <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-800/80">
 <Button
 type="button"
 variant="outline"
 onClick={() => setIsAddEditModalOpen(false)}
 >
 Cancel
 </Button>
 <Button type="submit"isLoading={submitting} variant="primary">
 {selectedRep ? 'Save Configuration' : 'Enroll Representative'}
 </Button>
 </div>
 </form>
 </Modal>

 {/* Delete Representative Confirmation Modal */}
 <Modal
 isOpen={isDeleteModalOpen}
 onClose={() => setIsDeleteModalOpen(false)}
 title="Revoke System Access"
 size="sm"
 >
 <div className="space-y-4 text-left">
 <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl">
 <ShieldAlert size={20} className="flex-shrink-0 mt-0.5 text-rose-400"/>
 <p className="text-xs leading-normal">
 Warning: Revoking access removes this representative from the active roster. Any prospects assigned to them will require manual reallocation.
 </p>
 </div>
 <p className="text-sm text-slate-300">
 Are you sure you want to remove <strong className="text-white">{selectedRep?.name}</strong> from the sales workspace?
 </p>

 <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-800/80">
 <Button
 type="button"
 variant="outline"
 onClick={() => setIsDeleteModalOpen(false)}
 >
 Cancel
 </Button>
 <Button
 variant="danger"
 onClick={handleDelete}
 isLoading={submitting}
 >
 Confirm Revocation
 </Button>
 </div>
 </div>
 </Modal>
 </div>
 )
}
export default SalesUsers
