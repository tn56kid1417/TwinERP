import { api } from '../services/api'
import type { User, Lead, CallLog } from '../types'

export const generateEmployeeReport = async (user: User, companyId: string) => {
  try {
    const [leadsRes, callsRes] = await Promise.all([
      api.get('/leads', { params: { assignedUserId: user.id, companyId } }),
      api.get('/calls', { params: { userId: user.id } })
    ]);
    
    const leads = leadsRes.data as Lead[];
    const calls = callsRes.data as CallLog[];
    
    const wonLeads = leads.filter(l => l.status === 'Converted' || l.status === 'Closed');
    const totalPipeline = leads.reduce((acc, l) => acc + (l.value || 0), 0);
    const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.value || 0), 0);
    const totalCallDuration = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const conversionRate = leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : "0.0";
    const avgCallDuration = calls.length > 0 ? Math.round((totalCallDuration / calls.length) / 60) : 0;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CRM Sales Employee Report\n";
    csvContent += `Generated On,${new Date().toLocaleString()}\n\n`;
    
    csvContent += "Employee Details\n";
    csvContent += `Name,${user.name}\n`;
    csvContent += `Email,${user.email}\n`;
    csvContent += `Designation,${user.designation || 'Sales Rep'}\n\n`;
    
    csvContent += "Sales Performance Metrics\n";
    csvContent += `Total Leads Assigned,${leads.length}\n`;
    csvContent += `Deals Won / Converted,${wonLeads.length}\n`;
    csvContent += `Conversion Rate,${conversionRate}%\n`;
    csvContent += `Total Pipeline Value,$${totalPipeline.toLocaleString()}\n`;
    csvContent += `Total Revenue Generated,$${wonRevenue.toLocaleString()}\n\n`;
    
    csvContent += "Call Activity Metrics\n";
    csvContent += `Total Calls Dialed,${calls.length}\n`;
    csvContent += `Total Call Duration,${Math.round(totalCallDuration / 60)} mins\n`;
    csvContent += `Average Call Duration,${avgCallDuration} mins\n\n`;
    
    csvContent += "Detailed Call Logs\n";
    csvContent += "Date & Time,Lead Name,Phone Number,Duration (mins),Status,Notes\n";
    calls.forEach(c => {
      const lead = leads.find(l => l.id === c.leadId);
      const leadName = lead ? lead.name : c.leadId;
      const notes = c.notes ? c.notes.replace(/,/g, " ") : "";
      const durationMins = (c.durationSeconds / 60).toFixed(2);
      csvContent += `${new Date(c.startTime).toLocaleString()},${leadName},${c.phoneNumber},${durationMins},${c.status},${notes}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${user.name.replace(/\s+/g, '_')}_Sales_Report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Failed to generate report", error);
    throw error;
  }
}

export const generateEntireReport = async (companyId: string) => {
  try {
    const [leadsRes, callsRes, usersRes] = await Promise.all([
      api.get('/leads', { params: { companyId } }),
      api.get('/calls'), 
      api.get('/users', { params: { companyId } })
    ]);
    
    const leads = leadsRes.data as Lead[];
    const calls = callsRes.data as CallLog[];
    const users = usersRes.data as User[];
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CRM Sales Performance Report (Entire Team)\n";
    csvContent += `Generated On,${new Date().toLocaleString()}\n\n`;
    
    csvContent += "Employee Name,Email,Designation,Total Leads Assigned,Deals Converted,Conversion Rate (%),Total Pipeline Value ($),Revenue Generated ($),Total Calls Dialed,Total Call Duration (mins),Average Call Duration (mins)\n";
    
    users.forEach(u => {
      const isSalesUser = u.role === 'SALES_USER';
      const isSalesLeader = u.role === 'COMPANY_ADMIN' && u.designation && u.designation.toLowerCase().includes('sales');
      
      if (isSalesUser || isSalesLeader) {
        const uLeads = leads.filter(l => l.assignedUserId === u.id);
        const uCalls = calls.filter(c => c.userId === u.id);
        
        const wonLeads = uLeads.filter(l => l.status === 'Converted' || l.status === 'Closed');
        const totalPipeline = uLeads.reduce((acc, l) => acc + (l.value || 0), 0);
        const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.value || 0), 0);
        const totalCallDuration = uCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
        
        const conversionRate = uLeads.length > 0 ? ((wonLeads.length / uLeads.length) * 100).toFixed(1) : "0.0";
        const durationMins = Math.round(totalCallDuration / 60);
        const avgDurationMins = uCalls.length > 0 ? (durationMins / uCalls.length).toFixed(1) : "0.0";
        const desig = u.designation || 'Sales Rep';
        
        csvContent += `${u.name},${u.email},${desig},${uLeads.length},${wonLeads.length},${conversionRate}%,${totalPipeline},${wonRevenue},${uCalls.length},${durationMins},${avgDurationMins}\n`;
      }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Company_CRM_Sales_Report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Failed to generate report", error);
    throw error;
  }
}
