export type UserRole = 'ADMIN' | 'OFFICER' | 'OPERATOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  mineIds: string[];
  officerId?: string;
  department?: string;
  avatarInitials: string;
  avatarColor?: string;
  accountStatus: 'Active' | 'Under Review' | 'Suspended';
}

export interface AuthSession {
  user: AuthUser;
  authenticated: boolean;
  token: string;
  expiresAt: string;
  lastActive: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  userEmail: string;
  action:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'MINE_CREATED'
    | 'MINE_UPDATED'
    | 'USER_MINE_ASSIGNED'
    | 'INSPECTION_CREATED'
    | 'INSPECTION_UPDATED'
    | 'FINDING_CREATED'
    | 'FINDING_UPDATED'
    | 'ALERT_ACKNOWLEDGED'
    | 'DEMO_DATA_RESET'
    | 'COMPLIANCE_KNOWLEDGE_CREATED'
    | 'COMPLIANCE_KNOWLEDGE_UPDATED'
    | 'COMPLIANCE_KNOWLEDGE_ARCHIVED'
    | 'COMPLIANCE_KNOWLEDGE_VERIFICATION_CHANGED'
    | 'COMPLIANCE_CHUNKS_REBUILT'
    | 'AI_ANALYSIS_STARTED'
    | 'AI_EXTRACTION_COMPLETED'
    | 'RAG_RETRIEVAL_COMPLETED'
    | 'AI_ANALYSIS_COMPLETED'
    | 'AI_ANALYSIS_FAILED'
    | 'PROPOSED_FINDING_ACCEPTED'
    | 'PROPOSED_FINDING_EDITED_ACCEPTED'
    | 'PROPOSED_FINDING_REJECTED'
    | 'PROPOSED_FINDING_MORE_EVIDENCE'
    | 'VISION_ANALYSIS_STARTED'
    | 'VISION_ANALYSIS_COMPLETED'
    | 'VISION_ANALYSIS_FAILED'
    | 'VISION_PROVIDER_UNAVAILABLE'
    | 'VISION_ZONE_CREATED'
    | 'VISION_ZONE_UPDATED'
    | 'VISION_ZONE_DELETED'
    | 'VISION_OBSERVATION_CREATED'
    | 'VISION_OBSERVATION_ACCEPTED'
    | 'VISION_OBSERVATION_EDITED'
    | 'VISION_OBSERVATION_REJECTED'
    | 'VISION_FINDING_CREATED'
    | 'RISK_ANALYSIS_REQUESTED'
    | 'RISK_ANALYSIS_COMPLETED'
    | 'RISK_CONFIGURATION_UPDATED'
    | 'RISK_NARRATIVE_GENERATED'
    | 'PREDICTIVE_ANALYSIS_REQUESTED'
    | 'PREDICTIVE_ANALYSIS_COMPLETED'
    | 'PREDICTIVE_NARRATIVE_GENERATED'
    | 'EARLY_WARNING_EXPLANATION_OPENED'
    | 'INTERVENTION_RECOMMENDATION_VIEWED'
    | 'DEMO_SCENARIO_RESET'
    | 'REPORT_PDF_DOWNLOADED';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  session?: AuthSession;
}
