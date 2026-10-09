/**
 * Spectra Automations Database Schema & View Specifications
 * 
 * Defines all 13 core tables and their 8 entity-to-view mappings.
 */

export interface SpectraCustomer {
    id: string; // UUID (PK)
    eworks_customer_id: number; // INT (UNIQUE)
    full_name: string;
    email: string;
    phone_e164: string;
    address_line?: string;
    city?: string;
    country?: string;
    is_reachable: boolean;
    is_opted_out: boolean;
    retention_segment?: string;
    decision_status?: string;
    latest_job_id?: string | number;
    latest_job_status_text?: string;
    latest_quote_id?: string | number;
    latest_quote_total?: number;
    latest_invoice_id?: string | number;
    total_outstanding_balance: number;
    total_invoiced_value?: number;
    total_received_value?: number;
    active_job_count?: number;
    completed_job_count?: number;
    total_job_count?: number;
    
    // Outreach Touch Summary
    email_1?: string;
    email_2?: string;
    email_3?: string;
    email_4?: string;
    whatsapp_1?: string;
    whatsapp_2?: string;
    whatsapp_3?: string;
    whatsapp_4?: string;
    WA_text?: string;
    WA_status?: string;
    WA_replied?: boolean | string;

    created_at?: string;
    updated_at?: string;
}

export interface SpectraConversation {
    id: string; // UUID (PK)
    customer_id: string; // UUID (FK -> customers.id)
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'VOICE';
    status: 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'CLOSED';
    current_intent?: string;
    intent_confidence?: number;
    initial_sequence_id?: string;
    channel_metadata?: Record<string, any>;
    last_message_at?: string; // ISO
    created_at?: string;
}

export interface SpectraMessage {
    id: string; // UUID (PK)
    conversation_id: string; // UUID (FK -> conversations.id)
    customer_id: string; // UUID (FK -> customers.id)
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'VOICE';
    direction: 'INBOUND' | 'OUTBOUND';
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    provider: 'GMAIL' | 'META_WHATSAPP' | 'INSTANTLY' | 'TWILIO' | 'VAPI';
    provider_message_id?: string;
    provider_thread_id?: string;
    sender_address?: string;
    recipient_address?: string;
    subject?: string;
    body_text?: string;
    body_html?: string;
    raw_payload?: Record<string, any>;
    sent_or_received_at: string; // ISO
}

export interface SlotProvenance {
    source: 'CUSTOMER_CURRENT_MESSAGE' | 'DATABASE_FACT';
    timestamp: string;
    confidence: number;
}

export interface SpectraConversationState {
    conversation_id: string; // UUID (PK/FK -> conversations.id)
    customer_id: string; // UUID (FK -> customers.id)
    service_episode_id?: string; // UUID (FK -> service_episodes.id)
    current_state: string;
    current_intent: string;
    current_actionability: 'ACTIONABLE' | 'INFORMATIONAL' | 'AWAITING_INPUT' | 'BLOCKED';
    current_slots: Record<string, any>;
    slot_provenance: Record<string, SlotProvenance>;
    pending_question?: string;
    pending_expected_slot?: string;
    pending_expected_values?: string[];
    pending_action?: string;
    awaiting_customer_information: boolean;
    last_customer_message?: string;
    last_ai_message?: string;
    updated_at?: string;
}

export interface SpectraServiceEpisode {
    id: string; // UUID (PK)
    customer_id: string; // UUID (FK -> customers.id)
    eworks_customer_id: number;
    conversation_id: string; // UUID (FK -> conversations.id)
    service_type: string;
    property_address?: string;
    site_id?: string;
    active_task_id?: string | number;
    active_quote_id?: string | number;
    active_job_id?: string | number;
    status: 'NEW' | 'QUALIFYING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    required_fields: string[];
    provided_fields: string[];
    missing_fields: string[];
    next_action?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SpectraCommercialApproval {
    id: string; // UUID (PK)
    approval_id: string; // e.g. SPECTRA-APPROVAL-XXXXX
    service_episode_id: string; // UUID (FK -> service_episodes.id)
    conversation_id: string; // UUID (FK -> conversations.id)
    customer_id: string; // UUID (FK -> customers.id)
    approval_type: string; // e.g. QUOTE_GENERATION, JOB_DISPATCH
    proposed_action: string;
    proposal_payload: Record<string, any>;
    approved_payload?: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    reviewer?: string;
    review_channel?: 'PORTAL' | 'EMAIL' | 'SLACK';
    review_timestamp?: string; // ISO
    eworks_entity_id?: number;
    customer_accepted_at?: string; // ISO
    job_id?: string | number;
    job_status?: string;
    job_auth_id?: string; // e.g. SPECTRA-JOB-AUTH-XXXXX
    created_at?: string;
}

export interface SpectraActionRequest {
    id: string; // UUID (PK)
    conversation_id: string; // UUID (FK -> conversations.id)
    customer_id: string; // UUID (FK -> customers.id)
    action_type: string;
    target_entity_type?: string;
    target_entity_id?: string;
    status: 'PENDING' | 'EXECUTED' | 'FAILED';
    required_fields: string[];
    provided_slots: Record<string, any>;
    missing_fields: string[];
    created_at?: string;
}

export interface SpectraActionExecution {
    id: string; // UUID (PK)
    action_request_id: string; // UUID (FK -> action_requests.id)
    tool_name: 'eworks_create_quote' | 'eworks_update_task' | 'eworks_create_job' | string;
    execution_status: 'SUCCESS' | 'FAILURE';
    http_status: number;
    created_external_id?: string | number;
    attempt_number: number;
    request_payload: Record<string, any>;
    response_payload?: Record<string, any>;
    error_message?: string;
    executed_at: string; // ISO
}

export interface SpectraInternalNotification {
    id: string; // UUID (PK)
    notification_key: string;
    case_id: string;
    service_episode_id?: string; // UUID (FK -> service_episodes.id)
    notification_type: 'COMMERCIAL_REVIEW' | 'URGENT_SAFETY' | 'JOB_AUTHORIZATION' | 'EWORKS_FAILURE' | string;
    recipient: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    sent_at?: string; // ISO
    created_at?: string;
}

export interface SpectraCustomerLifecycleEvent {
    id: string; // UUID (PK)
    customer_id: string; // UUID (FK -> customers.id)
    episode_id?: string; // UUID (FK -> service_episodes.id)
    event_type: string;
    entity_type: string;
    entity_id: string;
    previous_state?: string;
    new_state: string;
    created_at?: string;
}

export interface SpectraExternalEntityLink {
    id: string; // UUID (PK)
    customer_id: string; // UUID (FK -> customers.id)
    action_request_id?: string;
    external_system: 'EWORKS' | 'FOLLOWUP_BOSS' | 'STRIPE';
    external_entity_type: string;
    external_entity_id: string;
    created_at?: string;
}

export interface SpectraSequenceDefinition {
    sequence_id: string;
    sequence_name: string;
    category: string;
    sequence_step: number;
    sequence_channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
    sequence_step_status: string;
}

/**
 * Entity-to-View Specifications
 */

// 1. Customer Profile View
export interface CustomerProfileViewData {
    customer: SpectraCustomer;
}

// 2. Conversation List & Detail View
export interface ConversationDetailViewData {
    conversation: SpectraConversation;
    customer: SpectraCustomer;
    messages: SpectraMessage[]; // Single authoritative transcript
}

// 3. Current AI State View
export interface CurrentAIStateViewData {
    conversationState: SpectraConversationState;
}

// 4. Service Case View
export interface ServiceCaseViewData {
    serviceEpisode: SpectraServiceEpisode;
}

// 5. Commercial Timeline View
export interface CommercialTimelineViewData {
    commercialApprovals: SpectraCommercialApproval[];
}

// 6. Eworks Activity Audit View
export interface EworksActivityAuditViewData {
    executions: (SpectraActionExecution & { action_request?: SpectraActionRequest })[];
}

// 7. Internal Actions & Governance View
export interface GovernanceViewData {
    notifications: SpectraInternalNotification[];
}

// 8. Outreach & Campaign View
export interface OutreachCampaignViewData {
    sequence: SpectraSequenceDefinition;
    customer: SpectraCustomer;
    renderedOutboundMessages: SpectraMessage[];
}
