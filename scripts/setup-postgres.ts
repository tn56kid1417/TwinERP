import { Client, Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const PG_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'vipin',
};

const DB_NAME = process.env.PGDATABASE || 'twin_erp';

export async function setupDatabase() {
  console.log(`[DB Setup] Connecting to PostgreSQL at ${PG_CONFIG.host}:${PG_CONFIG.port} as ${PG_CONFIG.user}...`);
  
  // 1. Connect to default 'postgres' database to ensure twin_erp database exists
  const rootClient = new Client({
    ...PG_CONFIG,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
    if (res.rowCount === 0) {
      console.log(`[DB Setup] Creating database "${DB_NAME}"...`);
      await rootClient.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`[DB Setup] Database "${DB_NAME}" created successfully.`);
    } else {
      console.log(`[DB Setup] Database "${DB_NAME}" already exists.`);
    }
  } catch (err: any) {
    console.error('[DB Setup] Error checking/creating database:', err.message);
    throw err;
  } finally {
    await rootClient.end();
  }

  // 2. Connect to the 'twin_erp' database
  const pool = new Pool({
    ...PG_CONFIG,
    database: DB_NAME,
  });

  try {
    console.log(`[DB Setup] Connected to "${DB_NAME}". Creating tables and schema...`);

    // Schema definitions
    const schemaSql = `
      -- 1. Employees / Users
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'Member',
        department VARCHAR(50),
        designation VARCHAR(100),
        hire_date VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'Active',
        shift VARCHAR(50) DEFAULT 'Morning',
        password_hash TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Attendances
      CREATE TABLE IF NOT EXISTS attendances (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        clock_in_time VARCHAR(100),
        clock_out_time VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Present',
        hours_worked NUMERIC(6, 2) DEFAULT 0,
        overtime_hours NUMERIC(6, 2) DEFAULT 0,
        shift VARCHAR(50) DEFAULT 'Morning',
        ip_address VARCHAR(100),
        notes TEXT,
        break_duration_minutes INT DEFAULT 0,
        clock_in_remarks TEXT,
        clock_out_remarks TEXT
      );

      -- 3. Privileges
      CREATE TABLE IF NOT EXISTS privileges (
        id VARCHAR(100) PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(50),
        module VARCHAR(50) NOT NULL,
        can_view BOOLEAN DEFAULT FALSE,
        can_create BOOLEAN DEFAULT FALSE,
        can_edit BOOLEAN DEFAULT FALSE,
        can_delete BOOLEAN DEFAULT FALSE,
        can_approve BOOLEAN DEFAULT FALSE
      );

      -- 4. Clients
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        industry VARCHAR(100),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. Holidays
      CREATE TABLE IF NOT EXISTS holidays (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'Public'
      );

      -- 6. Awards
      CREATE TABLE IF NOT EXISTS awards (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date VARCHAR(50) NOT NULL,
        gift VARCHAR(255),
        prize NUMERIC(10, 2) DEFAULT 0
      );

      -- 7. Events
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50),
        description TEXT,
        department VARCHAR(50),
        location VARCHAR(255)
      );

      -- 8. HR Documents & Contracts
      CREATE TABLE IF NOT EXISTS hr_documents (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        category VARCHAR(100),
        upload_date VARCHAR(50),
        url TEXT,
        size VARCHAR(50),
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS agreements (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Pending',
        date VARCHAR(50),
        url TEXT
      );

      CREATE TABLE IF NOT EXISTS document_templates (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 9. Departments & Branches
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        head VARCHAR(100),
        employee_count INT DEFAULT 0,
        budget NUMERIC(12, 2) DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS branches (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        address TEXT,
        head VARCHAR(100)
      );

      -- 10. Leaves
      CREATE TABLE IF NOT EXISTS leaves (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        leave_type VARCHAR(50) NOT NULL,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        days INT DEFAULT 1,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        applied_on VARCHAR(50),
        approved_by VARCHAR(100),
        rejection_reason TEXT
      );

      -- 11. Payroll & Salary
      CREATE TABLE IF NOT EXISTS salary_structures (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
        hra NUMERIC(12, 2) DEFAULT 0,
        allowances NUMERIC(12, 2) DEFAULT 0,
        deductions NUMERIC(12, 2) DEFAULT 0,
        net_salary NUMERIC(12, 2) DEFAULT 0,
        effective_date VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS payslips (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        month INT NOT NULL,
        year INT NOT NULL,
        basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
        earnings JSONB DEFAULT '[]'::jsonb,
        deductions JSONB DEFAULT '[]'::jsonb,
        net_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Generated',
        generated_date VARCHAR(50),
        payment_method VARCHAR(50) DEFAULT 'Bank Transfer'
      );

      -- 12. Lifecycle (Resignations & Terminations)
      CREATE TABLE IF NOT EXISTS resignations (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        notice_date VARCHAR(50),
        resignation_date VARCHAR(50),
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        applied_at VARCHAR(50),
        approved_by VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS terminations (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
        termination_date VARCHAR(50),
        termination_type VARCHAR(50),
        reason TEXT,
        notice_date VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Terminated'
      );

      -- 13. Announcements & Notifications
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        department VARCHAR(50),
        audience VARCHAR(50) DEFAULT 'All',
        date VARCHAR(50),
        priority VARCHAR(50) DEFAULT 'Normal',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'mention',
        time VARCHAR(50),
        timestamp VARCHAR(100),
        read BOOLEAN DEFAULT FALSE,
        target_role VARCHAR(50),
        target_user_id VARCHAR(100)
      );

      -- 14. Careers & Job Postings
      CREATE TABLE IF NOT EXISTS job_postings (
        id VARCHAR(100) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(50) DEFAULT 'PM',
        location VARCHAR(255) DEFAULT 'Remote',
        employment_type VARCHAR(50) DEFAULT 'Full-Time',
        status VARCHAR(50) DEFAULT 'DRAFT',
        fields JSONB DEFAULT '[]'::jsonb,
        rounds JSONB DEFAULT '[]'::jsonb,
        application_confirmation_template TEXT,
        round_advance_template TEXT,
        rejection_template TEXT,
        hire_template TEXT,
        created_at VARCHAR(100),
        published_at VARCHAR(100),
        closed_at VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS job_applications (
        id VARCHAR(100) PRIMARY KEY,
        job_id VARCHAR(100) REFERENCES job_postings(id) ON DELETE CASCADE,
        candidate_name VARCHAR(255) NOT NULL,
        candidate_email VARCHAR(255) NOT NULL,
        candidate_phone VARCHAR(50),
        full_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        qualification VARCHAR(255),
        experience VARCHAR(100),
        current_org VARCHAR(255),
        resume_url TEXT,
        resume_link TEXT,
        portfolio_url TEXT,
        cover_note TEXT,
        current_round_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'APPLIED',
        applied_at VARCHAR(100),
        notes TEXT,
        rating INT DEFAULT 0,
        interview_date VARCHAR(50),
        interview_time VARCHAR(50),
        interviewer_name VARCHAR(255),
        meeting_link TEXT,
        converted_employee_id VARCHAR(100),
        email_logs JSONB DEFAULT '[]'::jsonb
      );

      -- 15. Projects & Tasks
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client VARCHAR(255),
        client_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Planning',
        priority VARCHAR(50) DEFAULT 'Medium',
        budget NUMERIC(12, 2) DEFAULT 0,
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        team_lead_id VARCHAR(100),
        assignees JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(100) PRIMARY KEY,
        project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'To Do',
        priority VARCHAR(50) DEFAULT 'Medium',
        assignee_id VARCHAR(100),
        description TEXT,
        due_date VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 16. CRM Module
      CREATE TABLE IF NOT EXISTS crm_leads (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'New',
        value NUMERIC(12, 2) DEFAULT 0,
        source VARCHAR(100),
        assigned_to VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crm_customers (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(50),
        website VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crm_calls (
        id VARCHAR(100) PRIMARY KEY,
        lead_id VARCHAR(100),
        customer_id VARCHAR(100),
        caller_id VARCHAR(100),
        type VARCHAR(50) DEFAULT 'Outbound',
        duration INT DEFAULT 0,
        summary TEXT,
        scheduled_at VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crm_payments (
        id VARCHAR(100) PRIMARY KEY,
        customer_id VARCHAR(100),
        lead_id VARCHAR(100),
        amount NUMERIC(12, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'Completed',
        payment_method VARCHAR(50) DEFAULT 'UPI / Bank',
        reference_number VARCHAR(100),
        paid_at VARCHAR(100),
        invoice_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(schemaSql);
    console.log('[DB Setup] All tables created successfully.');

    // 3. Seed initial users/employees if empty
    const empCountRes = await pool.query('SELECT COUNT(*) FROM employees');
    if (parseInt(empCountRes.rows[0].count) === 0) {
      console.log('[DB Setup] Seeding initial employee accounts into PostgreSQL...');
      const defaultHash = bcrypt.hashSync('admin123', 10);
      const seedEmps = [
        { id: 'e1', first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com', role: 'Member', department: 'PM', designation: 'Developer', hire_date: '2023-01-15', is_active: true, shift: 'Morning' },
        { id: 'e2', first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com', role: 'TL', department: 'HRM', designation: 'HR Lead', hire_date: '2022-11-01', is_active: true, shift: 'Evening' },
        { id: 'e3', first_name: 'System', last_name: 'Admin', email: 'admin@example.com', role: 'Admin', department: null, designation: 'System Administrator', hire_date: '2023-01-01', is_active: true, shift: 'Morning' },
        { id: 'e4', first_name: 'Chief', last_name: 'Executive', email: 'ceo@example.com', role: 'CEO', department: null, designation: 'Chief Executive Officer', hire_date: '2022-01-01', is_active: true, shift: 'Morning' },
        { id: 'e5', first_name: 'Chief', last_name: 'Technology', email: 'cto@example.com', role: 'CTO', department: null, designation: 'Chief Technology Officer', hire_date: '2022-01-01', is_active: true, shift: 'Morning' },
        { id: 'e6', first_name: 'Chief', last_name: 'Operations', email: 'coo@example.com', role: 'COO', department: null, designation: 'Chief Operating Officer', hire_date: '2022-01-01', is_active: true, shift: 'Morning' },
      ];

      for (const emp of seedEmps) {
        await pool.query(
          `INSERT INTO employees (id, first_name, last_name, email, role, department, designation, hire_date, is_active, shift, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
          [emp.id, emp.first_name, emp.last_name, emp.email, emp.role, emp.department, emp.designation, emp.hire_date, emp.is_active, emp.shift, defaultHash]
        );
      }
      console.log('[DB Setup] Default employees seeded (Login: admin@example.com / admin123).');
    }

    // 4. Seed initial job postings if empty
    const jobCountRes = await pool.query('SELECT COUNT(*) FROM job_postings');
    if (parseInt(jobCountRes.rows[0].count) === 0) {
      console.log('[DB Setup] Seeding initial sample job postings...');
      const sampleJobs = [
        {
          id: 'job-101',
          slug: 'senior-full-stack-engineer',
          title: 'Senior Full Stack Engineer',
          department: 'PM',
          location: 'Remote / Chennai',
          employment_type: 'Full-Time',
          status: 'PUBLISHED',
          fields: JSON.stringify([
            { id: 'f1', label: 'Experience', value: '4+ Years', fieldType: 'TEXT', section: 'PRIMARY', order: 1 },
            { id: 'f2', label: 'Salary Range', value: '₹14,00,000 - ₹22,00,000 / yr', fieldType: 'TAG', section: 'PRIMARY', order: 2 },
            { id: 'f3', label: 'Workplace', value: 'Hybrid / Remote', fieldType: 'TAG', section: 'PRIMARY', order: 3 },
            { id: 'f4', label: 'Responsibilities', value: 'Design and implement scalable microservices, optimize full-stack React & Node architecture.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 1 }
          ]),
          rounds: JSON.stringify([
            { id: 'r1', title: 'Round 1: Screening & Fit', shortDescription: 'Initial phone screening (30m)', order: 1 },
            { id: 'r2', title: 'Round 2: System Architecture', shortDescription: 'Live coding & database modeling (60m)', order: 2 },
            { id: 'r3', title: 'Round 3: Founder & Culture', shortDescription: 'Vision alignment with leadership', order: 3 },
            { id: 'r4', title: 'Round 4: Formal Offer', shortDescription: 'Offer terms and joining roadmap', order: 4 }
          ]),
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        }
      ];

      for (const j of sampleJobs) {
        await pool.query(
          `INSERT INTO job_postings (id, slug, title, department, location, employment_type, status, fields, rounds, created_at, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (slug) DO NOTHING`,
          [j.id, j.slug, j.title, j.department, j.location, j.employment_type, j.status, j.fields, j.rounds, j.created_at, j.published_at]
        );
      }
    }

    console.log('[DB Setup] PostgreSQL database initialization complete!');
    return pool;
  } catch (err: any) {
    console.error('[DB Setup] Migration error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].includes('setup-postgres')) {
  setupDatabase()
    .then(() => {
      console.log('Setup finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}
