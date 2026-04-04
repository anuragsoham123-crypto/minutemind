import axios from 'axios';
import { auth } from '@/lib/firebase';
import type { ReminderRequest } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Meetings ──

export async function createMeeting(formData: FormData) {
  const res = await api.post('/api/meetings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function analyzeMeeting(meetingId: string) {
  const res = await api.post(`/api/meetings/${meetingId}/analyze`);
  return res.data;
}

export async function listMeetings() {
  const res = await api.get('/api/meetings');
  return res.data;
}

export async function getMeeting(meetingId: string) {
  const res = await api.get(`/api/meetings/${meetingId}`);
  return res.data;
}

export async function updateMeeting(meetingId: string, data: Record<string, unknown>) {
  const res = await api.put(`/api/meetings/${meetingId}`, data);
  return res.data;
}

// ── Tasks ──

export async function listTasks(filters?: { status?: string; owner?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.owner) params.set('owner', filters.owner);
  const res = await api.get(`/api/tasks?${params.toString()}`);
  return res.data;
}

export async function createTask(meetingId: string, data: Record<string, unknown>) {
  const res = await api.post(`/api/tasks/${meetingId}`, data);
  return res.data;
}

export async function updateTask(meetingId: string, taskId: string, data: Record<string, unknown>) {
  const res = await api.patch(`/api/tasks/${meetingId}/${taskId}`, data);
  return res.data;
}

// ── Gaps ──

export async function resolveGap(meetingId: string, gapId: string) {
  const res = await api.patch(`/api/meetings/${meetingId}/gaps/${gapId}`, { resolved: true });
  return res.data;
}

// ── Reminders ──

export async function sendReminder(data: ReminderRequest) {
  const res = await api.post('/api/reminders/send', data);
  return res.data;
}

// ── Dashboard ──

export async function getDashboard() {
  const res = await api.get('/api/dashboard');
  return res.data;
}

// ── Teams ──

export async function createTeam(data: { name: string; department?: string }) {
  const res = await api.post('/api/teams', data);
  return res.data;
}

export async function listTeams() {
  const res = await api.get('/api/teams');
  return res.data;
}

export async function getTeam(teamId: string) {
  const res = await api.get(`/api/teams/${teamId}`);
  return res.data;
}

export async function deleteTeam(teamId: string) {
  const res = await api.delete(`/api/teams/${teamId}`);
  return res.data;
}

// ── Insights ──

export async function getInsights() {
  const res = await api.get('/api/insights');
  return res.data;
}

// ── Workload ──

export async function getWorkload(teamId?: string) {
  const res = await api.get('/api/workload', { params: { team_id: teamId } });
  return res.data;
}

export async function generateBrief(data: { team_id?: string; topic?: string }) {
  const res = await api.post('/api/briefs/generate', data);
  return res.data;
}

export async function inviteToTeam(teamId: string, data: { email: string; name?: string }) {
  const res = await api.post(`/api/teams/${teamId}/invite`, data);
  return res.data;
}

export async function removeMember(teamId: string, memberEmail: string) {
  const res = await api.post(`/api/teams/${teamId}/remove/${encodeURIComponent(memberEmail)}`);
  return res.data;
}

// ── Invitations ──

export async function getMyInvitations() {
  const res = await api.get('/api/invitations');
  return res.data;
}

export async function acceptInvitation(invitationId: string) {
  const res = await api.post(`/api/invitations/${invitationId}/accept`);
  return res.data;
}

export async function declineInvitation(invitationId: string) {
  const res = await api.post(`/api/invitations/${invitationId}/decline`);
  return res.data;
}

// ── My Tasks (for assignees) ──

export async function getMyTasks() {
  const res = await api.get('/api/tasks/my');
  return res.data;
}

export async function updateMyTaskStatus(meetingId: string, taskId: string, status: string) {
  const res = await api.patch(`/api/tasks/my/${meetingId}/${taskId}/status`, { status });
  return res.data;
}

// ── Phase 4 ──

export async function getHandoff(meetingId: string) {
  const res = await api.get(`/api/meetings/handoff/${meetingId}`);
  return res.data;
}

export async function scanDependencies() {
  const res = await api.post('/api/teams/dependencies/scan');
  return res.data;
}

export default api;
