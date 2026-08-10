import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Building, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useCompanyStore } from '../../store/companyStore'
import { api } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { cn } from '../../utils/cn'

// Schema for Profile Settings
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  mobile: z.string().min(6, 'Mobile is required'),
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

// Schema for Company Settings
const companySchema = z.object({
  name: z.string().min(2, 'Company Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  phone: z.string().min(6, 'Phone is required'),
  address: z.string().min(4, 'Address is required'),
  website: z.string().optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>
type CompanyFormValues = z.infer<typeof companySchema>

export const SettingsView: React.FC = () => {
  const { user } = useAuthStore()
  const { currentCompany, fetchCompanyById, updateCompany } = useCompanyStore()

  const [activeTab, setActiveTab] = useState<'profile' | 'company'>('profile')
  const [submittingProfile, setSubmittingProfile] = useState(false)
  const [submittingCompany, setSubmittingCompany] = useState(false)

  // Profile Form Hook
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Company Form Hook
  const {
    register: registerCompany,
    handleSubmit: handleSubmitCompany,
    reset: resetCompany,
    formState: { errors: companyErrors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
    },
  })

  useEffect(() => {
    if (user) {
      // Initialize profile details
      resetProfile({
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        password: '',
        confirmPassword: '',
      })

      // Fetch company metadata
      if (user.companyId) {
        fetchCompanyById(user.companyId).then((comp) => {
          resetCompany({
            name: comp.name,
            email: comp.email,
            phone: comp.phone,
            address: comp.address,
            website: comp.website || '',
          })
        })
      }
    }
  }, [user])

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return
    setSubmittingProfile(true)
    try {
      const payload: Record<string, string> = {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
      }
      if (data.password) {
        payload.password = data.password
      }
      await api.put(`/users/${user.id}`, payload)
      
      // Update store user locally
      const updatedUser = { ...user, ...payload }
      localStorage.setItem('crm_user', JSON.stringify(updatedUser))
      
      toast.success('Profile credentials updated successfully!')
    } catch {
      toast.error('Failed to save profile changes.')
    } finally {
      setSubmittingProfile(false)
    }
  }

  const onCompanySubmit = async (data: CompanyFormValues) => {
    if (!currentCompany) return
    setSubmittingCompany(true)
    try {
      await updateCompany(currentCompany.id, data)
      toast.success('Corporate workspace details updated!')
    } catch {
      toast.error('Failed to save company configuration.')
    } finally {
      setSubmittingCompany(false)
    }
  }

  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN'

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-sm font-medium text-slate-500">
          Manage your personal login credentials and corporate settings.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      {isCompanyAdmin && (
        <div className="flex border-b border-slate-200 gap-2 pb-1 text-left">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <User size={16} /> Personal Profile
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'company'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Building size={16} /> Company Settings
          </button>
        </div>
      )}

      {/* Tab Panels */}
      <div className="max-w-2xl text-left">
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
                
                {/* Mock photo upload */}
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center rounded-xl font-bold text-lg uppercase shadow-sm">
                    {user?.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Profile Avatar Image</span>
                    <button
                      type="button"
                      onClick={() => alert('Demo: Choose a local image to update profile avatar.')}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Upload size={12} /> Upload Photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Full Name"
                    placeholder="John Doe"
                    error={profileErrors.name?.message}
                    {...registerProfile('name')}
                  />
                  <Input
                    type="text"
                    label="Mobile Number"
                    placeholder="+1 (555) 019-2233"
                    error={profileErrors.mobile?.message}
                    {...registerProfile('mobile')}
                  />
                </div>

                <Input
                  type="email"
                  label="Official Email Address"
                  placeholder="user@acme.com"
                  error={profileErrors.email?.message}
                  {...registerProfile('email')}
                />

                <div className="border-t border-slate-200 pt-4 mt-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="password"
                      label="New Password"
                      placeholder="••••••••"
                      error={profileErrors.password?.message}
                      {...registerProfile('password')}
                    />
                    <Input
                      type="password"
                      label="Confirm Password"
                      placeholder="••••••••"
                      error={profileErrors.confirmPassword?.message}
                      {...registerProfile('confirmPassword')}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" isLoading={submittingProfile} className="cursor-pointer">
                    Save Profile Settings
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'company' && isCompanyAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitCompany(onCompanySubmit)} className="space-y-4">
                
                {/* Corporate Logo mock */}
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-14 h-14 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-extrabold shadow-sm border border-primary/20">
                    <Building size={24} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Corporate Logo</span>
                    <button
                      type="button"
                      onClick={() => alert('Demo: Choose a png/jpg company logo asset.')}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Upload size={12} /> Upload Logo
                    </button>
                  </div>
                </div>

                <Input
                  type="text"
                  label="Company Name"
                  placeholder="Acme Corporation"
                  error={companyErrors.name?.message}
                  {...registerCompany('name')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="email"
                    label="Corporate Email Address"
                    placeholder="info@acme.com"
                    error={companyErrors.email?.message}
                    {...registerCompany('email')}
                  />
                  <Input
                    type="text"
                    label="Corporate Phone"
                    placeholder="+1 (555) 019-9922"
                    error={companyErrors.phone?.message}
                    {...registerCompany('phone')}
                  />
                </div>

                <Input
                  type="text"
                  label="Headquarters Address"
                  placeholder="123 Corporate Road, Los Angeles"
                  error={companyErrors.address?.message}
                  {...registerCompany('address')}
                />

                <Input
                  type="text"
                  label="Corporate Website URL"
                  placeholder="acme.com"
                  error={companyErrors.website?.message}
                  {...registerCompany('website')}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" isLoading={submittingCompany} className="cursor-pointer">
                    Save Company Profile
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
export default SettingsView
