export interface ActionItem {
  id?: string;
  task: string;
  owner?: string | null;
  owner_email?: string | null;
  deadline?: string | null;
  deadline_type?: 'explicit' | 'inferred' | null;
  priority: 'high' | 'medium' | 'low';
  department?: string | null;
  confidence_score: number;
  status: string;
  meeting_id?: string;
  // Commitment tracking
  commitment_type?: 'verbal_commitment' | 'assignment' | 'self_volunteered' | 'unclear' | null;
  transcript_excerpt?: string | null;
  transcript_position?: number | null;
}

export interface Decision {
  decision: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string | null;
  transcript_excerpt?: string | null;
}

export interface Gap {
  id?: string;
  description: string;
  resolved: boolean;
}

export interface GhostTask {
  description: string;
  reason: string;
}

export interface BombRisk {
  description: string;
  reason: string;
}

export interface Meeting {
  id: string;
  title: string;
  transcript?: string | null;
  summary?: string | null;
  decisions: (string | Decision)[];  // backwards-compatible with legacy string format
  action_items: ActionItem[];
  gaps: Gap[];
  ghost_tasks?: GhostTask[];
  bomb_risks?: BombRisk[];
  remeeting_risk_score?: number | null;
  remeeting_risk_reason?: string | null;
  created_at?: string | null;
}

export interface DashboardData {
  total_meetings: number;
  total_tasks: number;
  tasks_completed: number;
  tasks_overdue: number;
  tasks_in_progress: number;
  soft_decisions_count: number;
  recent_meetings: Meeting[];
  attention_needed: ActionItem[];
}

export interface ReminderRecipient {
  name: string;
  email: string;
  task: string;
  deadline?: string | null;
  task_id?: string | null;
}

export interface ReminderRequest {
  meeting_id: string;
  meeting_title: string;
  summary?: string | null;
  decisions: (string | Decision)[];
  recipients: ReminderRecipient[];
}

// ── Teams ──

export interface TeamMember {
  uid?: string;
  email: string;
  name: string;
  role: 'coordinator' | 'member';
  status: 'pending' | 'active' | 'declined';
}

export interface Team {
  id: string;
  name: string;
  department?: string | null;
  created_by: string;
  created_at?: string | null;
  members?: TeamMember[];
  member_count?: number;
}

export interface Invitation {
  id: string;
  team_id: string;
  team_name: string;
  invited_by_name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at?: string | null;
}

export interface MyTask extends ActionItem {
  meeting_title?: string;
}

// ── Insights & Patterns ──

export interface PatternInsight {
  type: 'recurring_topic' | 'stuck_task' | 'overloaded_member' | 'underutilized_member' | 'soft_decision_pattern';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  data: Record<string, any>;
}

export interface PatternReport {
  generated_at: string;
  insights: PatternInsight[];
}

// ── Workload ──

export interface MemberWorkload {
  name: string;
  email: string;
  total_tasks: number;
  completed: number;
  in_progress: number;
  overdue: number;
  load_score: number;
}

export interface WorkloadReport {
  team_id?: string | null;
  generated_at: string;
  members: MemberWorkload[];
  bottleneck_departments: string[];
  recommendations: string[];
}

// ── Briefs ──

export interface BriefAgendaItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BriefReport {
  generated_at: string;
  suggested_agenda: BriefAgendaItem[];
  unresolved_tasks: ActionItem[];
  soft_decisions_to_review: Decision[];
  open_gaps: Gap[];
  strategic_risks: string[];
}

// ── Phase 4 ──

export interface CrossTeamDependency {
  waiting_team: string;
  blocking_team: string;
  description: string;
  recommended_action: string;
}

export interface DependenciesResponse {
  generated_at: string;
  dependencies: CrossTeamDependency[];
}

export interface HandoffCard {
  title: string;
  date: string;
  summary: string;
  decisions: (string | Decision)[];
  tasks: ActionItem[];
  remeeting_risk_score?: number;
  bomb_risks?: BombRisk[];
}
