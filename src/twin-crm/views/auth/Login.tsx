import React, { useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Globe, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

// Login validation schema
const loginSchema = z.object({
  workspaceName: z.string().min(1, 'Workspace is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      workspaceName: '',
      email: '',
      password: '',
    },
  })

  // Prefill workspace if redirected from registration
  useEffect(() => {
    const state = location.state as { prefilledWorkspace?: string } | null
    if (state?.prefilledWorkspace) {
      setValue('workspaceName', state.prefilledWorkspace)
    }
  }, [location, setValue])

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const user = await login(data.workspaceName, data.email, data.password)
      toast.success(`Welcome back, ${user.name}!`)
      
      // Redirect to the unified dashboard dispatcher
      navigate('/crm')
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.')
    }
  }

  // Quick login helper for demo purposes
  const handleQuickLogin = (role: 'admin' | 'sales' | 'stark' | 'leader1' | 'leader2') => {
    if (role === 'admin') {
      setValue('workspaceName', 'acme')
      setValue('email', 'admin@acme.com')
      setValue('password', 'password')
    } else if (role === 'sales') {
      setValue('workspaceName', 'acme')
      setValue('email', 'john@acme.com')
      setValue('password', 'password')
    } else if (role === 'stark') {
      setValue('workspaceName', 'stark')
      setValue('email', 'pepper@stark.com')
      setValue('password', 'password')
    } else if (role === 'leader1') {
      setValue('workspaceName', 'acme')
      setValue('email', 'michael@acme.com')
      setValue('password', 'password')
    } else if (role === 'leader2') {
      setValue('workspaceName', 'acme')
      setValue('email', 'jim@acme.com')
      setValue('password', 'password')
    }
  }

  return (
    <Card className="w-full bg-white border border-slate-200 shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100">
          Workspace Login
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          
          <Input
            type="text"
            label="Workspace Name"
            placeholder="acme"
            error={errors.workspaceName?.message}
            leftIcon={<Globe size={16} />}
            {...register('workspaceName')}
          />

          <Input
            type="email"
            label="Email Address"
            placeholder="admin@acme.com"
            error={errors.email?.message}
            leftIcon={<Mail size={16} />}
            {...register('email')}
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Lock size={16} />}
            {...register('password')}
          />

          <Button type="submit" fullWidth isLoading={isLoading} className="mt-2 cursor-pointer shadow-sm">
            Sign In
          </Button>
        </form>

        {/* Quick Demo Pre-fill Links */}
        <div className="border-t border-slate-100 pt-4 text-left">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-2.5 uppercase tracking-wider">
            <ShieldCheck size={12} /> Pre-fill testing credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('admin')}
              className="text-[10px] px-1 font-bold h-8 cursor-pointer border-slate-200"
            >
              Acme Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('sales')}
              className="text-[10px] px-1 font-bold h-8 cursor-pointer border-slate-200"
            >
              Acme Sales
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('leader1')}
              className="text-[10px] px-1 font-bold h-8 cursor-pointer border-slate-200"
            >
              Acme Leader 1
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('leader2')}
              className="text-[10px] px-1 font-bold h-8 cursor-pointer border-slate-200"
            >
              Acme Leader 2
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pt-2">
          New company?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Register Workspace
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
export default Login
