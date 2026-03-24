/**
 * CRM API Service
 * Connects the CRM frontend to the backend API
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

// Helper to get auth token (uses the same key as main app)
const getToken = () => localStorage.getItem('flowtym_token');

// Generic API call with error handling
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ===================== CLIENTS =====================

export interface CRMClient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  client_type: string;
  status: string;
  tags: string[];
  preferences: Record<string, any>;
  loyalty_score: number;
  total_stays: number;
  total_spent: number;
  last_stay?: string;
  stays?: any[];
  notes: string;
  language: string;
  country: string;
  segment_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ClientsResponse {
  clients: CRMClient[];
  total: number;
  limit: number;
  offset: number;
}

export async function getClients(params?: {
  search?: string;
  client_type?: string;
  status?: string;
  segment_id?: string;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
}): Promise<ClientsResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
  }
  return apiCall(`/crm/clients?${searchParams.toString()}`);
}

export async function getClient(clientId: string): Promise<CRMClient> {
  return apiCall(`/crm/clients/${clientId}`);
}

export async function createClient(client: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  client_type?: string;
  tags?: string[];
  notes?: string;
}): Promise<CRMClient> {
  return apiCall('/crm/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
}

export async function updateClient(clientId: string, updates: Partial<CRMClient>): Promise<CRMClient> {
  return apiCall(`/crm/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteClient(clientId: string): Promise<{ message: string }> {
  return apiCall(`/crm/clients/${clientId}`, { method: 'DELETE' });
}

// ===================== SEGMENTS =====================

export interface CRMSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  conditions: Array<{ field: string; operator: string; value: any }>;
  is_dynamic: boolean;
  client_count: number;
  created_at: string;
  updated_at: string;
}

export async function getSegments(): Promise<CRMSegment[]> {
  return apiCall('/crm/segments');
}

export async function createSegment(segment: {
  name: string;
  description?: string;
  color?: string;
  conditions?: Array<{ field: string; operator: string; value: any }>;
  is_dynamic?: boolean;
}): Promise<CRMSegment> {
  return apiCall('/crm/segments', {
    method: 'POST',
    body: JSON.stringify(segment),
  });
}

export async function updateSegment(segmentId: string, updates: Partial<CRMSegment>): Promise<CRMSegment> {
  return apiCall(`/crm/segments/${segmentId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteSegment(segmentId: string): Promise<{ message: string }> {
  return apiCall(`/crm/segments/${segmentId}`, { method: 'DELETE' });
}

// ===================== CAMPAIGNS =====================

export interface CRMCampaign {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  segment_ids: string[];
  subject?: string;
  content: string;
  scheduled_at?: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  created_at: string;
  updated_at: string;
}

export async function getCampaigns(status?: string): Promise<CRMCampaign[]> {
  const params = status ? `?status=${status}` : '';
  return apiCall(`/crm/campaigns${params}`);
}

export async function createCampaign(campaign: {
  name: string;
  description?: string;
  type: string;
  segment_ids?: string[];
  subject?: string;
  content: string;
  scheduled_at?: string;
}): Promise<CRMCampaign> {
  return apiCall('/crm/campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign),
  });
}

export async function updateCampaign(campaignId: string, updates: Partial<CRMCampaign>): Promise<CRMCampaign> {
  return apiCall(`/crm/campaigns/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function launchCampaign(campaignId: string): Promise<{ message: string; target_count: number }> {
  return apiCall(`/crm/campaigns/${campaignId}/launch`, { method: 'POST' });
}

// ===================== WORKFLOWS =====================

export interface CRMWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: { type: string; delay_hours: number };
  actions: Array<{ type: string; config: Record<string, any> }>;
  status: string;
  executions_count: number;
  last_execution?: string;
  created_at: string;
  updated_at: string;
}

export async function getWorkflows(): Promise<CRMWorkflow[]> {
  return apiCall('/crm/workflows');
}

export async function createWorkflow(workflow: {
  name: string;
  description?: string;
  trigger: { type: string; delay_hours?: number };
  actions: Array<{ type: string; config?: Record<string, any> }>;
  is_active?: boolean;
}): Promise<CRMWorkflow> {
  return apiCall('/crm/workflows', {
    method: 'POST',
    body: JSON.stringify(workflow),
  });
}

export async function updateWorkflow(workflowId: string, updates: Partial<CRMWorkflow>): Promise<CRMWorkflow> {
  return apiCall(`/crm/workflows/${workflowId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function toggleWorkflow(workflowId: string): Promise<{ status: string }> {
  return apiCall(`/crm/workflows/${workflowId}/toggle`, { method: 'POST' });
}

// ===================== CONVERSATIONS =====================

export interface CRMConversation {
  id: string;
  client_id: string;
  client_name?: string;
  channel: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: string;
}

export interface CRMMessage {
  id: string;
  conversation_id: string;
  client_id: string;
  channel: string;
  direction: string;
  subject?: string;
  content: string;
  sender: string;
  created_at: string;
}

export async function getConversations(params?: { status?: string; channel?: string }): Promise<CRMConversation[]> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
  }
  return apiCall(`/crm/conversations?${searchParams.toString()}`);
}

export async function getConversationMessages(conversationId: string): Promise<CRMMessage[]> {
  return apiCall(`/crm/conversations/${conversationId}/messages`);
}

export async function sendMessage(message: {
  client_id: string;
  channel: string;
  subject?: string;
  content: string;
}): Promise<CRMMessage> {
  return apiCall('/crm/messages', {
    method: 'POST',
    body: JSON.stringify(message),
  });
}

// ===================== ALERTS =====================

export interface CRMAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  client_id?: string;
  is_read: boolean;
  data: Record<string, any>;
  created_at: string;
}

export async function getAlerts(unreadOnly?: boolean): Promise<CRMAlert[]> {
  const params = unreadOnly ? '?unread_only=true' : '';
  return apiCall(`/crm/alerts${params}`);
}

export async function createAlert(alert: {
  type: string;
  title: string;
  message: string;
  priority?: string;
  client_id?: string;
  data?: Record<string, any>;
}): Promise<CRMAlert> {
  return apiCall('/crm/alerts', {
    method: 'POST',
    body: JSON.stringify(alert),
  });
}

export async function markAlertRead(alertId: string): Promise<{ message: string }> {
  return apiCall(`/crm/alerts/${alertId}/read`, { method: 'POST' });
}

// ===================== AUTO-REPLIES =====================

export interface CRMAutoReply {
  id: string;
  name: string;
  trigger_keywords: string[];
  channel: string;
  response_template: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export async function getAutoReplies(): Promise<CRMAutoReply[]> {
  return apiCall('/crm/auto-replies');
}

export async function createAutoReply(autoReply: {
  name: string;
  trigger_keywords: string[];
  channel: string;
  response_template: string;
  is_active?: boolean;
}): Promise<CRMAutoReply> {
  return apiCall('/crm/auto-replies', {
    method: 'POST',
    body: JSON.stringify(autoReply),
  });
}

export async function deleteAutoReply(ruleId: string): Promise<{ message: string }> {
  return apiCall(`/crm/auto-replies/${ruleId}`, { method: 'DELETE' });
}

// ===================== ANALYTICS =====================

export interface CRMAnalytics {
  total_clients: number;
  active_clients: number;
  new_clients_month: number;
  retention_rate: number;
  average_nps: number;
  average_ltv: number;
  top_segments: Array<{ id: string; name: string; color: string; client_count: number }>;
  channel_distribution: Record<string, number>;
}

export async function getAnalytics(): Promise<CRMAnalytics> {
  return apiCall('/crm/analytics');
}

// ===================== PMS INTEGRATION =====================

export async function syncFromPMS(): Promise<{ message: string; new_clients: number; updated_clients: number }> {
  return apiCall('/crm/sync-from-pms', { method: 'POST' });
}

export async function getClientByEmail(email: string): Promise<CRMClient> {
  return apiCall(`/crm/client-by-email/${encodeURIComponent(email)}`);
}
