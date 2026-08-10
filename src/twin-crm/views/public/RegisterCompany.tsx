import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, BarChart3, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, 'Company Name must be at least 2 characters'),
  email: z.string().min(1, 'Company Email is required').email('Invalid email format'),
  phone: z.string().min(6, 'Company Phone number is required'),
  industry: z.string().min(2, 'Industry is required'),
  address: z.string().min(4, 'Company Address is required'),
  country: z.string().min(2, 'Country is required'),
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  website: z.string().optional().or(z.literal('')),
  workspaceName: z.string()
    .min(2, 'Workspace name must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Workspace name must be lowercase letters, numbers, and dashes only'),
  companySize: z.enum([
    '1–10 Employees',
    '11–50 Employees',
    '51–100 Employees',
    '101–500 Employees',
    '500+ Employees',
  ]),
  adminName: z.string().min(2, 'Full Name is required'),
  adminDesignation: z.string().min(2, 'Designation is required'),
  adminEmail: z.string().min(1, 'Official Email is required').email('Invalid email format'),
  adminMobile: z.string().min(6, 'Mobile Number is required'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  adminConfirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters'),
}).refine((data) => data.adminPassword === data.adminConfirmPassword, {
  message: 'Passwords do not match',
  path: ['adminConfirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export const RegisterCompany: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // Step 4 is the success screen
  const [submitting, setSubmitting] = useState(false)
  const [registeredWorkspace, setRegisteredWorkspace] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      industry: '',
      address: '',
      country: '',
      state: '',
      city: '',
      website: '',
      workspaceName: '',
      companySize: '11–50 Employees',
      adminName: '',
      adminDesignation: '',
      adminEmail: '',
      adminMobile: '',
      adminPassword: '',
      adminConfirmPassword: '',
    },
  })

  // Watch variables to display previews
  const watchedWorkspaceName = watch('workspaceName')
  const watchedCompanyName = watch('name')

  // Helper to validate and advance step
  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = []
    
    if (step === 1) {
      fieldsToValidate = ['name', 'email', 'phone', 'industry', 'address', 'country', 'state', 'city', 'website']
    } else if (step === 2) {
      fieldsToValidate = ['workspaceName', 'companySize']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep((prev) => (prev + 1) as any)
    }
  }

  const prevStep = () => {
    setStep((prev) => (prev - 1) as any)
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitting(true)
    try {
      await api.post('/companies/register', data)
      setRegisteredWorkspace(data.workspaceName.toLowerCase())
      toast.success('Workspace created successfully!')
      setStep(4) // Move to success page
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to register company workspace.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />

      <div className="w-full max-w-xl z-10 space-y-6">
        
        {/* Branding header */}
        <div className="flex flex-col items-center justify-center gap-1.5 text-center">
          <div className="p-3 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BarChart3 size={24} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mt-1">
            Twincord Onboarding
          </span>
        </div>

        <Card className="border border-border shadow-lg bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-xl font-extrabold text-slate-800">
              {step === 1 && 'Company Profile'}
              {step === 2 && 'Workspace Configuration'}
              {step === 3 && 'Administrative Profile'}
              {step === 4 && 'Workspace Provisioned!'}
            </CardTitle>
            
            {/* Progress Bar */}
            {step < 4 && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 relative overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* STEP 1: Company Profile Info */}
            {step === 1 && (
              <div className="space-y-4 text-left">
                <Input
                  type="text"
                  label="Company Name"
                  placeholder="Acme Corporation"
                  error={errors.name?.message}
                  {...register('name')}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="email"
                    label="Company Email"
                    placeholder="contact@acme.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    type="text"
                    label="Phone Number"
                    placeholder="+1 (555) 019-9922"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Industry"
                    placeholder="Manufacturing / SaaS"
                    error={errors.industry?.message}
                    {...register('industry')}
                  />
                  <Input
                    type="text"
                    label="Website (Optional)"
                    placeholder="acme.com"
                    error={errors.website?.message}
                    {...register('website')}
                  />
                </div>

                <Input
                  type="text"
                  label="Company Address"
                  placeholder="123 Corporate Parkway"
                  error={errors.address?.message}
                  {...register('address')}
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="text"
                    label="Country"
                    placeholder="United States"
                    error={errors.country?.message}
                    {...register('country')}
                  />
                  <Input
                    type="text"
                    label="State"
                    placeholder="California"
                    error={errors.state?.message}
                    {...register('state')}
                  />
                  <Input
                    type="text"
                    label="City"
                    placeholder="Los Angeles"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={nextStep} className="cursor-pointer flex items-center gap-1.5">
                    Next Section <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Workspace details */}
            {step === 2 && (
              <div className="space-y-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <Input
                    type="text"
                    label="Workspace Name"
                    placeholder="acme"
                    helperText="Lowercase letters, numbers, and dashes only."
                    error={errors.workspaceName?.message}
                    {...register('workspaceName')}
                  />
                  
                  {/* Realtime subdomain preview URL mapping */}
                  <div className="bg-slate-50 border border-border rounded-xl p-3.5 mt-1 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                      Your Workspace Subdomain URL
                    </span>
                    <span className="text-sm font-bold text-primary block mt-1 tracking-tight select-all">
                      {watchedWorkspaceName ? watchedWorkspaceName.toLowerCase() : 'workspace'}.twincord.com
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Company Size
                  </label>
                  <select
                    className="w-full text-sm py-2 px-3.5 bg-card border border-border text-slate-800 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    {...register('companySize')}
                  >
                    <option value="1–10 Employees">1–10 Employees</option>
                    <option value="11–50 Employees">11–50 Employees</option>
                    <option value="51–100 Employees">51–100 Employees</option>
                    <option value="101–500 Employees">101–500 Employees</option>
                    <option value="500+ Employees">500+ Employees</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button type="button" variant="outline" onClick={prevStep} className="cursor-pointer flex items-center gap-1.5">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="cursor-pointer flex items-center gap-1.5">
                    Next Section <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Admin profile account details */}
            {step === 3 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Full Name"
                    placeholder="Sarah Connor"
                    error={errors.adminName?.message}
                    {...register('adminName')}
                  />
                  <Input
                    type="text"
                    label="Designation"
                    placeholder="Operations Director"
                    error={errors.adminDesignation?.message}
                    {...register('adminDesignation')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="email"
                    label="Official Email"
                    placeholder="admin@acme.com"
                    error={errors.adminEmail?.message}
                    {...register('adminEmail')}
                  />
                  <Input
                    type="text"
                    label="Mobile Number"
                    placeholder="+1 (555) 019-2233"
                    error={errors.adminMobile?.message}
                    {...register('adminMobile')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="password"
                    label="Access Password"
                    placeholder="••••••••"
                    error={errors.adminPassword?.message}
                    {...register('adminPassword')}
                  />
                  <Input
                    type="password"
                    label="Confirm Password"
                    placeholder="••••••••"
                    error={errors.adminConfirmPassword?.message}
                    {...register('adminConfirmPassword')}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button type="button" variant="outline" onClick={prevStep} className="cursor-pointer flex items-center gap-1.5">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button type="submit" isLoading={submitting} className="cursor-pointer">
                    Provision Workspace
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 4: Success Provisioning details */}
            {step === 4 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto shadow-md">
                  <ShieldCheck size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">Workspace Created Successfully!</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Your multi-tenant workspace profile for <strong>{watchedCompanyName}</strong> has been successfully provisioned.
                  </p>
                </div>

                <div className="bg-slate-50 border border-border rounded-xl p-4 max-w-md mx-auto space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Your Custom Workspace URL</span>
                  <span className="text-base font-extrabold text-primary block select-all tracking-tight">
                    {registeredWorkspace}.twincord.com
                  </span>
                </div>

                <div className="space-y-3 pt-4 border-t border-border max-w-md mx-auto text-left">
                  <span className="text-xs font-bold text-slate-850 uppercase tracking-wider block">Recommended Next Steps:</span>
                  <ul className="text-xs text-slate-500 space-y-2 leading-relaxed">
                    <li className="flex items-center gap-2">✓ Log in to your tenant dashboard using the custom workspace URL.</li>
                    <li className="flex items-center gap-2">✓ Navigate to the Sales settings panel and add representatives.</li>
                    <li className="flex items-center gap-2">✓ Add prospects or sync existing customers to start tracking pipelines.</li>
                  </ul>
                </div>

                <Link
                  to="/login"
                  state={{ prefilledWorkspace: registeredWorkspace }}
                  className="block pt-2"
                >
                  <Button className="w-full cursor-pointer">
                    Go to Workspace Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {step < 4 && (
          <p className="text-xs text-slate-500 text-center">
            Already registered?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In to Workspace
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
export default RegisterCompany
