import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, BarChart3, Users, Target, ArrowRight, Star } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'

export const LandingPage: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="p-2 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Twincord
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <button onClick={() => scrollTo(featuresRef)} className="hover:text-primary transition-colors cursor-pointer">Features</button>
          <button onClick={() => scrollTo(pricingRef)} className="hover:text-primary transition-colors cursor-pointer">Pricing</button>
          <button onClick={() => scrollTo(contactRef)} className="hover:text-primary transition-colors cursor-pointer">Contact</button>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-semibold cursor-pointer">
              Log In
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="font-semibold cursor-pointer shadow-sm hover:shadow-md">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-wider">
          <Star size={12} className="fill-current" /> Next Generation Multi-Tenant CRM
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Scale Your Client Operations with <span className="text-primary">Twincord CRM</span>
        </h1>
        <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
          The ultimate multi-tenant platform for managing company sales cycles, allocating prospects to agents, and tracking won deals from a unified interface.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto flex items-center gap-2 cursor-pointer shadow-md">
              Start Free Trial <ArrowRight size={18} />
            </Button>
          </Link>
          <button
            onClick={() => scrollTo(featuresRef)}
            className="w-full sm:w-auto"
          >
            <Button variant="outline" size="lg" className="w-full sm:w-auto cursor-pointer">
              Explore Features
            </Button>
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section ref={featuresRef} className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">One Platform, Endless Control</h2>
            <p className="text-sm font-semibold text-slate-500 max-w-xl mx-auto">
              Everything your team needs to pipeline deals, profile contact notes, and review closed bookings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 text-left space-y-3">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold">Multi-Tenant Workspaces</h3>
                <p className="text-sm text-slate-500 leading-normal">
                  Create isolated spaces for your company (e.g. `abc.twincord.com`) to secure organization resources and manage team scopes.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 text-left space-y-3">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold">Team Allocation</h3>
                <p className="text-sm text-slate-500 leading-normal">
                  Manage representative logins, customize profile configurations, and allocate leads to your agents with visual boards.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 text-left space-y-3">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Target size={24} />
                </div>
                <h3 className="text-lg font-bold">Lead Progression</h3>
                <p className="text-sm text-slate-500 leading-normal">
                  Track prospects across stage filters from Open to Converted. Upgrade conversions directly to Customers automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Flexible SaaS Pricing Plans</h2>
            <p className="text-sm font-semibold text-slate-500 max-w-xl mx-auto">
              Simple tiers with no hidden fees. Start free and scale up as your company expands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Starter Plan */}
            <Card className="flex flex-col bg-white border border-slate-200">
              <CardContent className="p-8 flex-1 flex flex-col justify-between text-left space-y-6">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-600">Starter</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">$29</span>
                    <span className="text-sm text-slate-500 font-medium">/month</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">Perfect for small initial agencies.</p>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 flex-1">
                  <li className="flex items-center gap-2">✓ Up to 10 Employees</li>
                  <li className="flex items-center gap-2">✓ Basic Lead Board</li>
                  <li className="flex items-center gap-2">✓ 1 Workspace Allocation</li>
                </ul>
                <Link to="/register" className="block w-full">
                  <Button variant="outline" className="w-full cursor-pointer">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Growth Plan */}
            <Card className="flex flex-col bg-white border-2 border-primary relative glow-primary">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <CardContent className="p-8 flex-1 flex flex-col justify-between text-left space-y-6">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-primary">Growth</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">$79</span>
                    <span className="text-sm text-slate-500 font-medium">/month</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">Optimized for growing companies.</p>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 flex-1">
                  <li className="flex items-center gap-2">✓ Up to 100 Employees</li>
                  <li className="flex items-center gap-2">✓ Reports & Analytics</li>
                  <li className="flex items-center gap-2">✓ Priority Email Support</li>
                </ul>
                <Link to="/register" className="block w-full">
                  <Button className="w-full cursor-pointer">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="flex flex-col bg-white border border-slate-200">
              <CardContent className="p-8 flex-1 flex flex-col justify-between text-left space-y-6">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-600">Enterprise</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">$199</span>
                    <span className="text-sm text-slate-500 font-medium">/month</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">Tailored for giant corporate structures.</p>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 flex-1">
                  <li className="flex items-center gap-2">✓ Unlimited Employees</li>
                  <li className="flex items-center gap-2">✓ Custom API Access</li>
                  <li className="flex items-center gap-2">✓ 24/7 Phone Support</li>
                </ul>
                <Link to="/register" className="block w-full">
                  <Button variant="outline" className="w-full cursor-pointer">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Contact Section / Footer */}
      <section ref={contactRef} className="py-20 bg-white border-t border-slate-200 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div className="text-left space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">Connect with Twincord</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Have questions about multi-tenant workspace setups, pricing plans, or onboarding pipelines? Fill out the contact form and our support engineers will get back to you within 24 hours.
            </p>
            <div className="space-y-2 pt-2 text-sm text-slate-600 font-semibold">
              <p>Email: support@twincord.com</p>
              <p>Phone: +1 (555) TWIN-CORD</p>
              <p>Location: 100 Pine Street, San Francisco, CA</p>
            </div>
          </div>

          <Card className="bg-slate-50 border border-slate-200">
            <CardContent className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">First Name</label>
                  <input type="text" placeholder="John" className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-primary placeholder:text-slate-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input type="text" placeholder="Connor" className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-primary placeholder:text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Corporate Email</label>
                <input type="email" placeholder="john@acme.com" className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-primary placeholder:text-slate-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Message</label>
                <textarea rows={3} placeholder="How can we help your team?" className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-primary placeholder:text-slate-400 resize-none" />
              </div>
              <Button onClick={() => alert('Demo: Message logged successfully!')} className="w-full cursor-pointer mt-2">
                Send Message
              </Button>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 border-t border-slate-800 text-center text-xs">
        <p>© 2026 Twincord CRM SaaS Platform. All rights reserved.</p>
      </footer>

    </div>
  )
}
export default LandingPage
