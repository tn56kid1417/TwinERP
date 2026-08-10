import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import db from './db'
import type { User, Lead, Company, Note, Purchase, LeadStatus, Role, Customer, CompanySize } from '../types'

// Create Axios custom client instance
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper to construct mock responses
function createMockResponse(
  config: AxiosRequestConfig,
  status: number,
  data: any,
  statusText: string = 'OK'
): AxiosResponse {
  return {
    data,
    status,
    statusText,
    headers: {},
    config: config as any,
  }
}

// Axios Mock Adapter Router
api.defaults.adapter = async function mockAdapter(config: AxiosRequestConfig): Promise<any> {
  // Simulate standard network latency (400ms)
  await new Promise((resolve) => setTimeout(resolve, 400))

  const url = config.url || ''
  const method = (config.method || 'get').toLowerCase()
  const body = config.data ? JSON.parse(config.data) : null

  // Helper to extract query parameters
  const getQueryParams = () => {
    if (!url.includes('?')) return {}
    const queryStr = url.split('?')[1]
    const params: Record<string, string> = {}
    queryStr.split('&').forEach((pair) => {
      const [k, v] = pair.split('=')
      params[k] = decodeURIComponent(v || '')
    })
    return params
  }

  const queryParams = getQueryParams()
  const cleanPath = url.split('?')[0].replace('/api', '')

  try {
    // === ROUTE: /auth/login ===
    if (cleanPath === '/auth/login' && method === 'post') {
      const { workspaceName, email, password } = body
      const users = db.getUsers()
      
      const foundUser = users.find(
        (u) =>
          u.workspaceName?.toLowerCase() === workspaceName.toLowerCase() &&
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      )

      if (foundUser) {
        // Exclude password in response
        const { password: _, ...userWithoutPassword } = foundUser
        return createMockResponse(config, 200, {
          user: userWithoutPassword,
          token: `mock-jwt-token-for-${foundUser.id}`,
        })
      } else {
        throw { response: createMockResponse(config, 401, { message: 'Invalid workspace, email or password' }, 'Unauthorized') }
      }
    }

    // === ROUTE: /companies/register ===
    if (cleanPath === '/companies/register' && method === 'post') {
      const {
        name,
        email,
        phone,
        industry,
        address,
        country,
        state,
        city,
        website,
        workspaceName,
        companySize,
        adminName,
        adminDesignation,
        adminEmail,
        adminMobile,
        adminPassword,
      } = body

      const companies = db.getCompanies()
      const users = db.getUsers()

      // Check if workspace name already exists
      if (companies.some((c) => c.workspaceName.toLowerCase() === workspaceName.toLowerCase())) {
        throw { response: createMockResponse(config, 400, { message: 'Workspace name is already taken' }, 'Bad Request') }
      }

      // Check if admin email exists
      if (users.some((u) => u.email.toLowerCase() === adminEmail.toLowerCase())) {
        throw { response: createMockResponse(config, 400, { message: 'Email address is already registered' }, 'Bad Request') }
      }

      const companyId = `company-${Date.now()}`
      const newCompany: Company = {
        id: companyId,
        name,
        email,
        phone,
        industry,
        address,
        country,
        state,
        city,
        website: website || undefined,
        workspaceName: workspaceName.toLowerCase(),
        companySize: companySize as CompanySize,
        createdDate: new Date().toISOString(),
        userCount: 1, // Start with 1 (the admin)
      }

      const newAdmin: User & { password?: string } = {
        id: `user-${Date.now()}`,
        name: adminName,
        email: adminEmail,
        role: 'COMPANY_ADMIN',
        designation: adminDesignation,
        mobile: adminMobile,
        companyId,
        workspaceName: workspaceName.toLowerCase(),
        password: adminPassword,
      }

      db.saveCompanies([...companies, newCompany])
      db.saveUsers([...users, newAdmin])

      const { password: _, ...adminWithoutPassword } = newAdmin

      return createMockResponse(config, 201, {
        success: true,
        company: newCompany,
        user: adminWithoutPassword,
      })
    }

    // === ROUTE: /companies/:id ===
    if (cleanPath.startsWith('/companies/') && cleanPath.split('/').length === 3) {
      const companyId = cleanPath.split('/')[2]
      const companies = db.getCompanies()
      const foundCompany = companies.find((c) => c.id === companyId)

      if (foundCompany) {
        if (method === 'get') {
          return createMockResponse(config, 200, foundCompany)
        }
        if (method === 'put') {
          const updatedCompany = { ...foundCompany, ...body }
          const newCompanies = companies.map((c) => (c.id === companyId ? updatedCompany : c))
          db.saveCompanies(newCompanies)
          return createMockResponse(config, 200, updatedCompany)
        }
      } else {
        throw { response: createMockResponse(config, 404, { message: 'Company not found' }, 'Not Found') }
      }
    }

    // === ROUTE: /users ===
    if (cleanPath === '/users') {
      if (method === 'get') {
        let users = db.getUsers().map(({ password: _, ...u }) => u)
        
        // Filter by companyId if requested
        if (queryParams.companyId) {
          users = users.filter((u) => u.companyId === queryParams.companyId)
        }
        // Filter by role if requested
        if (queryParams.role) {
          users = users.filter((u) => u.role === queryParams.role)
        }

        return createMockResponse(config, 200, users)
      }

      if (method === 'post') {
        const { name, email, role, companyId, password, designation, mobile } = body
        const users = db.getUsers()
        const companies = db.getCompanies()
        const company = companies.find((c) => c.id === companyId)

        // Check duplicate email
        if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          throw { response: createMockResponse(config, 400, { message: 'User with this email already exists' }, 'Bad Request') }
        }

        const newUser: User & { password?: string } = {
          id: `user-${Date.now()}`,
          name,
          email,
          role: role as Role,
          companyId,
          designation,
          mobile,
          workspaceName: company?.workspaceName,
          password: password || 'password',
        }

        db.saveUsers([...users, newUser])

        // Update company user count if applicable
        if (companyId) {
          const updatedCompanies = companies.map((c) => {
            if (c.id === companyId) {
              return { ...c, userCount: c.userCount + 1 }
            }
            return c
          })
          db.saveCompanies(updatedCompanies)
        }

        const { password: _, ...userResponse } = newUser
        return createMockResponse(config, 201, userResponse)
      }
    }

    // === ROUTE: /users/:id ===
    if (cleanPath.startsWith('/users/') && cleanPath.split('/').length === 3) {
      const userId = cleanPath.split('/')[2]
      const users = db.getUsers()
      const foundUserIndex = users.findIndex((u) => u.id === userId)

      if (foundUserIndex > -1) {
        const foundUser = users[foundUserIndex]

        if (method === 'put') {
          const updatedUser = { ...foundUser, ...body }
          users[foundUserIndex] = updatedUser
          db.saveUsers(users)

          const { password: _, ...userResponse } = updatedUser
          return createMockResponse(config, 200, userResponse)
        }

        if (method === 'delete') {
          const newUsers = users.filter((u) => u.id !== userId)
          db.saveUsers(newUsers)

          // Update company user count if applicable
          if (foundUser.companyId) {
            const companies = db.getCompanies()
            const updatedCompanies = companies.map((c) => {
              if (c.id === foundUser.companyId) {
                return { ...c, userCount: Math.max(1, c.userCount - 1) }
              }
              return c
            })
            db.saveCompanies(updatedCompanies)
          }

          return createMockResponse(config, 200, { success: true })
        }
      } else {
        throw { response: createMockResponse(config, 404, { message: 'User not found' }, 'Not Found') }
      }
    }

    // === ROUTE: /leads ===
    if (cleanPath === '/leads') {
      if (method === 'get') {
        let leads = db.getLeads()

        // Filters
        if (queryParams.companyId) {
          leads = leads.filter((l) => l.companyId === queryParams.companyId)
        }
        if (queryParams.assignedUserId) {
          leads = leads.filter((l) => l.assignedUserId === queryParams.assignedUserId)
        }
        if (queryParams.status) {
          leads = leads.filter((l) => l.status === queryParams.status)
        }

        return createMockResponse(config, 200, leads)
      }

      if (method === 'post') {
        const leads = db.getLeads()
        const newLead: Lead = {
          id: `lead-${Date.now()}`,
          name: body.name,
          companyName: body.companyName,
          email: body.email,
          phone: body.phone || '',
          status: (body.status || 'New') as LeadStatus,
          assignedUserId: body.assignedUserId || undefined,
          assignedUserName: body.assignedUserName || undefined,
          companyId: body.companyId,
          value: Number(body.value) || 0,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
        }

        db.saveLeads([...leads, newLead])
        return createMockResponse(config, 201, newLead)
      }
    }

    // === ROUTE: /leads/:id ===
    if (cleanPath.startsWith('/leads/') && cleanPath.split('/').length === 3) {
      const leadId = cleanPath.split('/')[2]
      const leads = db.getLeads()
      const foundLead = leads.find((l) => l.id === leadId)

      if (foundLead) {
        if (method === 'get') {
          return createMockResponse(config, 200, foundLead)
        }
        if (method === 'put') {
          const updatedLead = {
            ...foundLead,
            ...body,
            updatedDate: new Date().toISOString(),
          }

          // If assigned to a new user, resolve user details
          if (body.assignedUserId && body.assignedUserId !== foundLead.assignedUserId) {
            const users = db.getUsers()
            const foundUser = users.find((u) => u.id === body.assignedUserId)
            if (foundUser) {
              updatedLead.assignedUserName = foundUser.name
            }
          } else if (body.assignedUserId === null || body.assignedUserId === '') {
            updatedLead.assignedUserId = undefined
            updatedLead.assignedUserName = undefined
          }

          // If lead transitioned to CONVERTED, duplicate/add to Customers roster automatically! (Phase 7 onboarding)
          if (body.status === 'Converted' && foundLead.status !== 'Converted') {
            const customers = db.getCustomers()
            if (!customers.some(c => c.email.toLowerCase() === updatedLead.email.toLowerCase())) {
              const newCustomer: Customer = {
                id: `cust-${Date.now()}`,
                name: updatedLead.name,
                email: updatedLead.email,
                phone: updatedLead.phone,
                assignedUserId: updatedLead.assignedUserId,
                assignedUserName: updatedLead.assignedUserName,
                companyId: updatedLead.companyId,
                createdDate: new Date().toISOString()
              }
              db.saveCustomers([...customers, newCustomer])
            }
          }

          const newLeads = leads.map((l) => (l.id === leadId ? updatedLead : l))
          db.saveLeads(newLeads)
          return createMockResponse(config, 200, updatedLead)
        }
      } else {
        throw { response: createMockResponse(config, 404, { message: 'Lead not found' }, 'Not Found') }
      }
    }

    // === ROUTE: /customers ===
    if (cleanPath === '/customers') {
      if (method === 'get') {
        let customers = db.getCustomers()
        if (queryParams.companyId) {
          customers = customers.filter((c) => c.companyId === queryParams.companyId)
        }
        if (queryParams.assignedUserId) {
          customers = customers.filter((c) => c.assignedUserId === queryParams.assignedUserId)
        }
        return createMockResponse(config, 200, customers)
      }

      if (method === 'post') {
        const customers = db.getCustomers()
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: body.name,
          email: body.email,
          phone: body.phone,
          assignedUserId: body.assignedUserId || undefined,
          assignedUserName: body.assignedUserName || undefined,
          companyId: body.companyId,
          createdDate: new Date().toISOString(),
        }

        db.saveCustomers([...customers, newCustomer])
        return createMockResponse(config, 201, newCustomer)
      }
    }

    // === ROUTE: /customers/:id ===
    if (cleanPath.startsWith('/customers/') && cleanPath.split('/').length === 3) {
      const custId = cleanPath.split('/')[2]
      const customers = db.getCustomers()
      const foundCustomer = customers.find((c) => c.id === custId)

      if (foundCustomer) {
        if (method === 'get') {
          return createMockResponse(config, 200, foundCustomer)
        }
        if (method === 'put') {
          const updatedCustomer = { ...foundCustomer, ...body }
          const newCustomers = customers.map((c) => (c.id === custId ? updatedCustomer : c))
          db.saveCustomers(newCustomers)
          return createMockResponse(config, 200, updatedCustomer)
        }
      } else {
        throw { response: createMockResponse(config, 404, { message: 'Customer not found' }, 'Not Found') }
      }
    }

    // === ROUTE: /notes ===
    if (cleanPath === '/notes') {
      if (method === 'get') {
        let notes = db.getNotes()
        if (queryParams.leadId) {
          notes = notes.filter((n) => n.leadId === queryParams.leadId)
        }
        // Sort chronologically
        notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        return createMockResponse(config, 200, notes)
      }

      if (method === 'post') {
        const notes = db.getNotes()
        const newNote: Note = {
          id: `note-${Date.now()}`,
          leadId: body.leadId,
          authorName: body.authorName,
          text: body.text,
          timestamp: new Date().toISOString(),
        }

        db.saveNotes([...notes, newNote])
        return createMockResponse(config, 201, newNote)
      }
    }

    // === ROUTE: /calls ===
    if (cleanPath === "/calls") {
      if (method === "get") {
        let calls = db.getCalls()
        if (queryParams.userId) {
          calls = calls.filter((c: any) => c.userId === queryParams.userId)
        }
        if (queryParams.leadId) {
          calls = calls.filter((c: any) => c.leadId === queryParams.leadId)
        }
        return createMockResponse(config, 200, calls)
      }

      if (method === "post") {
        const calls = db.getCalls()
        const newCall = {
          id: `call-${Date.now()}`,
          leadId: body.leadId,
          userId: body.userId,
          userName: body.userName,
          phoneNumber: body.phoneNumber,
          startTime: new Date().toISOString(),
          durationSeconds: body.durationSeconds || 0,
          status: body.status,
          notes: body.notes,
        }
        db.saveCalls([...calls, newCall])
        return createMockResponse(config, 201, newCall)
      }
    }

    // === ROUTE: /purchases ===
    if (cleanPath === '/purchases') {
      if (method === 'get') {
        let purchases = db.getPurchases()
        if (queryParams.leadId) {
          purchases = purchases.filter((p) => p.leadId === queryParams.leadId)
        }
        return createMockResponse(config, 200, purchases)
      }

      if (method === 'post') {
        const purchases = db.getPurchases()
        const newPurchase: Purchase = {
          id: `purchase-${Date.now()}`,
          leadId: body.leadId,
          product: body.product,
          amount: Number(body.amount),
          date: new Date().toISOString(),
        }

        db.savePurchases([...purchases, newPurchase])
        return createMockResponse(config, 201, newPurchase)
      }
    }

    // Endpoint not matched
    throw { response: createMockResponse(config, 404, { message: 'API Route Not Found' }, 'Not Found') }
  } catch (error: any) {
    if (error.response) {
      return Promise.reject(error.response)
    }
    return Promise.reject(createMockResponse(config, 500, { message: 'Internal Server Error', details: error.message }, 'Internal Error'))
  }
}
