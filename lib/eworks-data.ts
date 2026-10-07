// Spectra Automation eWorks Customer Data Schema & Mock Dataset
// Matches Supabase public.customers table schema

export interface EworksCustomer {
    id: string;
    eworks_customer_id: number;
    customer_name: string | null;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_e164: string | null;
    telephone_raw: string | null;
    mobile_raw: string | null;
    address_line: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    country: string | null;
    customer_type_id: number | null;
    notes: string | null;
    eworks_created_on: string | null;
    eworks_last_updated_on: string | null;
    has_email: boolean;
    has_phone: boolean;
    is_reachable: boolean;
    is_opted_out: boolean;
    last_contacted_at: string | null;
    last_synced_at: string;
    created_at: string;
    updated_at: string;

    // Jobs
    total_job_count: number;
    completed_job_count: number;
    active_job_count: number;
    latest_job_id: number | null;
    latest_job_type_id: number | null;
    latest_job_status: number | null;
    latest_job_status_text: string | null;
    latest_job_start_date: string | null;
    latest_job_completed_date: string | null;
    latest_job_completion_date: string | null;
    latest_job_short_description: string | null;
    latest_job_description: string | null;
    latest_job_total: number | null;
    latest_job_quote_id: number | null;
    latest_job_invoice_id: number | null;
    latest_job_updated_on: string | null;
    latest_job_created_on: string | null;
    active_jobs: Array<{
        id: number;
        title: string;
        status: string;
        type: string;
        amount: number;
        scheduled_date: string;
    }>;
    eworks_jobs_synced_at: string | null;
    jobs_sync_error: string | null;
    jobs_sync_error_count: number;
    jobs_sync_attempted_at: string | null;
    jobs_sync_claimed_at: string | null;
    jobs_sync_claimed_by: string | null;

    // Quotes
    total_quote_count: number;
    latest_quote_id: number | null;
    latest_quote_ref: string | null;
    latest_quote_date: string | null;
    latest_quote_expiry_date: string | null;
    latest_quote_converted_date: string | null;
    latest_quote_status: number | null;
    latest_quote_status_text: string | null;
    latest_quote_description: string | null;
    latest_quote_total: number | null;
    latest_quote_link: string | null;
    has_pending_quote: boolean;
    pending_quote_count: number;
    latest_pending_quote_id: number | null;
    latest_pending_quote_date: string | null;
    latest_pending_quote_expiry_date: string | null;
    latest_pending_quote_status: number | null;
    latest_pending_quote_total: number | null;
    latest_pending_quote_link: string | null;
    latest_converted_quote_id: number | null;
    latest_converted_quote_date: string | null;
    has_amc_quote: boolean;
    latest_amc_quote_id: number | null;
    latest_amc_quote_status: number | null;
    latest_amc_quote_date: string | null;
    latest_quoted_service_category: string | null;
    eworks_quotes_synced_at: string | null;
    quotes_sync_claimed_at: string | null;
    quotes_sync_claimed_by: string | null;
    quotes_sync_error: string | null;
    quotes_sync_error_count: number;
    quotes_sync_attempted_at: string | null;

    // Invoices & Financials
    total_invoice_count: number;
    paid_invoice_count: number;
    unpaid_invoice_count: number;
    overdue_invoice_count: number;
    has_unpaid_invoice: boolean;
    has_overdue_invoice: boolean;
    total_invoiced_value: number;
    total_received_value: number;
    total_outstanding_balance: number;
    latest_invoice_id: number | null;
    latest_invoice_ref: string | null;
    latest_invoice_date: string | null;
    latest_invoice_due_date: string | null;
    latest_invoice_job_id: number | null;
    latest_invoice_quote_id: number | null;
    latest_invoice_total: number | null;
    latest_invoice_received_amount: number | null;
    latest_invoice_balance_amount: number | null;
    latest_invoice_status: number | null;
    latest_invoice_status_text: string | null;
    latest_unpaid_invoice_id: number | null;
    latest_unpaid_invoice_date: string | null;
    latest_unpaid_invoice_due_date: string | null;
    latest_unpaid_invoice_balance_amount: number | null;
    latest_overdue_invoice_id: number | null;
    latest_overdue_invoice_date: string | null;
    latest_overdue_invoice_due_date: string | null;
    latest_overdue_invoice_balance_amount: number | null;
    latest_paid_invoice_id: number | null;
    latest_paid_invoice_date: string | null;
    latest_paid_invoice_total: number | null;
    eworks_invoices_synced_at: string | null;
    invoices_sync_claimed_at: string | null;
    invoices_sync_claimed_by: string | null;
    invoices_sync_error: string | null;
    invoices_sync_error_count: number;
    invoices_sync_attempted_at: string | null;

    // Service & AMC
    last_service_date: string | null;
    has_ac_service_history: boolean;
    last_ac_service_date: string | null;
    ac_service_count: number;
    service_history: Array<{
        id: string;
        service_name: string;
        date: string;
        technician?: string;
        cost?: number;
    }> | null;
    has_amc: boolean;
    amc_start_date: string | null;
    amc_expiry_date: string | null;
    amc_status: string | null;
    amc_source_job_id: number | null;
    amc_source_quote_id: number | null;

    // Retention Engine & Decisions
    retention_segment: string | null;
    next_retention_action: string | null;
    next_retention_action_at: string | null;
    last_automation_at: string | null;
    last_automation_type: string | null;
    retention_suppressed: boolean;
    retention_suppression_reason: string | null;
    decision_id: string | null;
    decision_status: 'READY' | 'NO_ACTION' | 'INELIGIBLE' | 'DATA_STALE' | 'ERROR' | null;
    decision_action_class: 'MARKETING' | 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE' | 'NONE' | null;
    decision_calculated_at: string | null;
    decision_source_snapshot_version: string | null;
    dispatch_claim_token: string | null;
    dispatch_claimed_at: string | null;
    dispatch_lease_expires_at: string | null;

    // Sequence & Channel
    sequence_id: string | null;
    sequence_instance_id: string | null;
    sequence_version: number;
    sequence_step: number;
    sequence_channel: 'whatsapp' | 'email' | 'voice' | 'sms' | null;
    sequence_step_status: string;
    sequence_state: Record<string, any>;

    // WhatsApp & Email Step Columns
    whatsapp_1?: string | null;
    whatsapp_1_status?: any;
    whatsapp_2?: string | null;
    whatsapp_2_status?: any;
    whatsapp_3?: string | null;
    whatsapp_3_status?: any;
    whatsapp_4?: string | null;
    whatsapp_4_status?: any;
    email_unsubscribed?: boolean;
    email_1?: string | null;
    email_1_status?: any;
    email_2?: string | null;
    email_2_status?: any;
    email_3?: string | null;
    email_3_status?: any;
    email_4?: string | null;
    email_4_status?: any;
    email_reply?: any;
    WA_text?: string | null;
    WA_status?: string | null;
    WA_replied?: string | null;
    WA_sentiment?: string | null;
    WA_note?: string | null;
}

export const SPECTRA_EWORKS_CUSTOMERS: EworksCustomer[] = [
    {
        id: "005b3534-a3c5-4e75-b754-8cb89cb25f8c",
        eworks_customer_id: 627,
        customer_name: "Mr. Syed Ilias Rizvi",
        full_name: "Mr. Syed Ilias Rizvi",
        first_name: "Syed",
        last_name: "Rizvi",
        email: "maintenance@rarehomes.ae",
        phone_e164: "+971501234567",
        telephone_raw: "+971 4 399 1234",
        mobile_raw: "+971 50 123 4567",
        address_line: "Dubai Marina, Marina Heights Tower",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 3,
        notes: "Key commercial account for Rare Homes Maintenance",
        eworks_created_on: "2020-02-24T12:29:04Z",
        eworks_last_updated_on: "2020-02-24T12:29:04Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-09-25T14:30:00Z",
        last_synced_at: "2026-09-25T13:47:55Z",
        created_at: "2026-09-01T13:32:28Z",
        updated_at: "2026-09-25T13:47:55Z",

        total_job_count: 3,
        completed_job_count: 2,
        active_job_count: 1,
        latest_job_id: 9841,
        latest_job_type_id: 12,
        latest_job_status: 2,
        latest_job_status_text: "In Progress",
        latest_job_start_date: "2026-09-28",
        latest_job_completed_date: null,
        latest_job_completion_date: null,
        latest_job_short_description: "Custom Wooden Cabinet Installation",
        latest_job_description: "Carpentry and custom cabinet assembly in main reception area.",
        latest_job_total: 1850.00,
        latest_job_quote_id: 4489,
        latest_job_invoice_id: 8102,
        latest_job_updated_on: "2026-09-28T10:00:00Z",
        latest_job_created_on: "2026-09-24T09:15:00Z",
        active_jobs: [
            {
                id: 9841,
                title: "Custom Wooden Cabinet Installation",
                status: "In Progress",
                type: "Carpentry",
                amount: 1850.00,
                scheduled_date: "2026-09-28"
            }
        ],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 4,
        latest_quote_id: 4489,
        latest_quote_ref: "SWTS4015",
        latest_quote_date: "2020-02-24",
        latest_quote_expiry_date: "2020-03-25",
        latest_quote_converted_date: "2026-09-24T11:00:00Z",
        latest_quote_status: 1,
        latest_quote_status_text: "Approved",
        latest_quote_description: "Custom Joinery & Interior Carpentry Package",
        latest_quote_total: 666.75,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/C470159899-R0519098446-39487082858-QD1790332419",
        has_pending_quote: true,
        pending_quote_count: 1,
        latest_pending_quote_id: 4590,
        latest_pending_quote_date: "2026-09-20",
        latest_pending_quote_expiry_date: "2026-10-20",
        latest_pending_quote_status: 0,
        latest_pending_quote_total: 2400.00,
        latest_pending_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/C470159899-PENDING-4590",
        latest_converted_quote_id: 4489,
        latest_converted_quote_date: "2026-09-24T11:00:00Z",
        has_amc_quote: false,
        latest_amc_quote_id: null,
        latest_amc_quote_status: null,
        latest_amc_quote_date: null,
        latest_quoted_service_category: "Carpentry",
        eworks_quotes_synced_at: "2026-09-25T10:33:39Z",
        quotes_sync_claimed_at: "2026-10-05T10:30:02Z",
        quotes_sync_claimed_by: "1969858",
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T10:30:02Z",

        total_invoice_count: 3,
        paid_invoice_count: 2,
        unpaid_invoice_count: 1,
        overdue_invoice_count: 0,
        has_unpaid_invoice: true,
        has_overdue_invoice: false,
        total_invoiced_value: 4250.00,
        total_received_value: 3583.25,
        total_outstanding_balance: 666.75,
        latest_invoice_id: 8102,
        latest_invoice_ref: "INV-2026-8102",
        latest_invoice_date: "2026-09-25",
        latest_invoice_due_date: "2026-10-15",
        latest_invoice_job_id: 9841,
        latest_invoice_quote_id: 4489,
        latest_invoice_total: 666.75,
        latest_invoice_received_amount: 0.00,
        latest_invoice_balance_amount: 666.75,
        latest_invoice_status: 1,
        latest_invoice_status_text: "Unpaid",
        latest_unpaid_invoice_id: 8102,
        latest_unpaid_invoice_date: "2026-09-25",
        latest_unpaid_invoice_due_date: "2026-10-15",
        latest_unpaid_invoice_balance_amount: 666.75,
        latest_overdue_invoice_id: null,
        latest_overdue_invoice_date: null,
        latest_overdue_invoice_due_date: null,
        latest_overdue_invoice_balance_amount: null,
        latest_paid_invoice_id: 7901,
        latest_paid_invoice_date: "2026-08-10",
        latest_paid_invoice_total: 3583.25,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-08-10",
        has_ac_service_history: true,
        last_ac_service_date: "2026-05-14",
        ac_service_count: 2,
        service_history: [
            { id: "srv-1", service_name: "Annual AC Deep Clean & Coil Sanitation", date: "2026-05-14", technician: "Ahmed Hassan", cost: 450 },
            { id: "srv-2", service_name: "Chiller Pump Repair", date: "2026-08-10", technician: "Tariq Mahmood", cost: 3133.25 }
        ],
        has_amc: true,
        amc_start_date: "2026-01-01",
        amc_expiry_date: "2026-12-31",
        amc_status: "ACTIVE",
        amc_source_job_id: 7901,
        amc_source_quote_id: 4102,

        retention_segment: "UNCONVERTED_LEAD_REVIVAL",
        next_retention_action: "FIRST_SERVICE_INTRO_OFFER",
        next_retention_action_at: "2026-09-25T07:51:08Z",
        last_automation_at: "2026-09-26T08:00:56Z",
        last_automation_type: "EMAIL_CAMPAIGN_TOUCH_1",
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "ebf95a8b-8849-4bbf-ad10-5cd916605e7d",
        decision_status: "READY",
        decision_action_class: "MARKETING",
        decision_calculated_at: "2026-09-25T07:51:08Z",
        decision_source_snapshot_version: "sha256:732d03a9dfa8cab8f8103a53d851efa9d83dff547ad844af5862a199f4616a70",
        dispatch_claim_token: null,
        dispatch_claimed_at: "2026-09-26T08:00:56Z",
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_QUOTE_REVIVAL_CAMPAIGN",
        sequence_instance_id: "1a501e67-6801-421f-a2ad-bb7964485611",
        sequence_version: 1,
        sequence_step: 1,
        sequence_channel: "email",
        sequence_step_status: "NOT_STARTED",
        sequence_state: { history: [], source_decision_id: "a26bd407-2e1d-46eb-9ee4-f1700c366e37" }
    },
    {
        id: "7a1b2c3d-4e5f-6789-0123-456789abcdef",
        eworks_customer_id: 742,
        customer_name: "Al Habtoor Properties",
        full_name: "Fatima Al Mansoori",
        first_name: "Fatima",
        last_name: "Al Mansoori",
        email: "f.almansoori@habtoorgroup.com",
        phone_e164: "+971529876543",
        telephone_raw: "+971 4 205 9999",
        mobile_raw: "+971 52 987 6543",
        address_line: "Business Bay, Executive Towers Block B",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 1,
        notes: "VIP Commercial Contract - 12 Luxury Villas",
        eworks_created_on: "2021-06-15T09:00:00Z",
        eworks_last_updated_on: "2026-10-02T16:20:00Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-10-02T11:15:00Z",
        last_synced_at: "2026-10-05T08:00:00Z",
        created_at: "2021-06-15T09:00:00Z",
        updated_at: "2026-10-05T08:00:00Z",

        total_job_count: 14,
        completed_job_count: 12,
        active_job_count: 2,
        latest_job_id: 10240,
        latest_job_type_id: 8,
        latest_job_status: 1,
        latest_job_status_text: "Scheduled",
        latest_job_start_date: "2026-10-08",
        latest_job_completed_date: null,
        latest_job_completion_date: null,
        latest_job_short_description: "Full HVAC Duct Cleaning & Filter Replacement",
        latest_job_description: "Comprehensive duct sanitation and filter replacement across 4 penthouses.",
        latest_job_total: 4500.00,
        latest_job_quote_id: 5120,
        latest_job_invoice_id: null,
        latest_job_updated_on: "2026-10-02T16:20:00Z",
        latest_job_created_on: "2026-10-01T14:00:00Z",
        active_jobs: [
            { id: 10240, title: "Full HVAC Duct Cleaning", status: "Scheduled", type: "AC Service", amount: 4500.00, scheduled_date: "2026-10-08" },
            { id: 10241, title: "Emergency Water Leak Repair", status: "In Progress", type: "Plumbing", amount: 1200.00, scheduled_date: "2026-10-05" }
        ],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 18,
        latest_quote_id: 5120,
        latest_quote_ref: "SWTS5120",
        latest_quote_date: "2026-09-28",
        latest_quote_expiry_date: "2026-10-28",
        latest_quote_converted_date: "2026-10-01T14:00:00Z",
        latest_quote_status: 2,
        latest_quote_status_text: "Converted to Job",
        latest_quote_description: "Annual Commercial HVAC Sanitation Package",
        latest_quote_total: 5700.00,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5120",
        has_pending_quote: false,
        pending_quote_count: 0,
        latest_pending_quote_id: null,
        latest_pending_quote_date: null,
        latest_pending_quote_expiry_date: null,
        latest_pending_quote_status: null,
        latest_pending_quote_total: null,
        latest_pending_quote_link: null,
        latest_converted_quote_id: 5120,
        latest_converted_quote_date: "2026-10-01T14:00:00Z",
        has_amc_quote: true,
        latest_amc_quote_id: 5120,
        latest_amc_quote_status: 2,
        latest_amc_quote_date: "2026-09-28",
        latest_quoted_service_category: "AC Service",
        eworks_quotes_synced_at: "2026-10-05T09:30:00Z",
        quotes_sync_claimed_at: null,
        quotes_sync_claimed_by: null,
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T09:30:00Z",

        total_invoice_count: 12,
        paid_invoice_count: 10,
        unpaid_invoice_count: 2,
        overdue_invoice_count: 1,
        has_unpaid_invoice: true,
        has_overdue_invoice: true,
        total_invoiced_value: 84500.00,
        total_received_value: 72000.00,
        total_outstanding_balance: 12500.00,
        latest_invoice_id: 9104,
        latest_invoice_ref: "INV-2026-9104",
        latest_invoice_date: "2026-09-01",
        latest_invoice_due_date: "2026-09-20",
        latest_invoice_job_id: 9710,
        latest_invoice_quote_id: 4980,
        latest_invoice_total: 8500.00,
        latest_invoice_received_amount: 0.00,
        latest_invoice_balance_amount: 8500.00,
        latest_invoice_status: 3,
        latest_invoice_status_text: "Overdue",
        latest_unpaid_invoice_id: 9104,
        latest_unpaid_invoice_date: "2026-09-01",
        latest_unpaid_invoice_due_date: "2026-09-20",
        latest_unpaid_invoice_balance_amount: 8500.00,
        latest_overdue_invoice_id: 9104,
        latest_overdue_invoice_date: "2026-09-01",
        latest_overdue_invoice_due_date: "2026-09-20",
        latest_overdue_invoice_balance_amount: 8500.00,
        latest_paid_invoice_id: 8890,
        latest_paid_invoice_date: "2026-07-15",
        latest_paid_invoice_total: 15000.00,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-09-15",
        has_ac_service_history: true,
        last_ac_service_date: "2026-09-15",
        ac_service_count: 8,
        service_history: [
            { id: "srv-101", service_name: "Chiller Plant Monthly Maintenance", date: "2026-09-15", technician: "Mohammad Riaz", cost: 3500 },
            { id: "srv-102", service_name: "FCU Coil Flush & Cleaning", date: "2026-08-01", technician: "Mohammad Riaz", cost: 2800 },
            { id: "srv-103", service_name: "BMS Sensor Calibration", date: "2026-06-10", technician: "Kevin Vance", cost: 2200 }
        ],
        has_amc: true,
        amc_start_date: "2025-11-01",
        amc_expiry_date: "2026-10-31",
        amc_status: "EXPIRING_SOON",
        amc_source_job_id: 8890,
        amc_source_quote_id: 4200,

        retention_segment: "AMC_EXPIRING_RENEWAL",
        next_retention_action: "SEND_AMC_RENEWAL_QUOTE",
        next_retention_action_at: "2026-10-06T09:00:00Z",
        last_automation_at: "2026-10-02T11:15:00Z",
        last_automation_type: "WHATSAPP_RENEWAL_ALERT",
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "8c91f0a1-92b3-4c5d-6e7f-8a9b0c1d2e3f",
        decision_status: "READY",
        decision_action_class: "FINANCIAL",
        decision_calculated_at: "2026-10-05T07:30:00Z",
        decision_source_snapshot_version: "sha256:a91f...9b0c",
        dispatch_claim_token: null,
        dispatch_claimed_at: null,
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_AMC_RENEWAL_WORKFLOW",
        sequence_instance_id: "9f8e7d6c-5b4a-3210-9876-543210fedcba",
        sequence_version: 1,
        sequence_step: 2,
        sequence_channel: "whatsapp",
        sequence_step_status: "ENROLLED",
        sequence_state: { step: "RENEWAL_PROPOSAL_SENT" }
    },
    {
        id: "8b2c3d4e-5f6a-7890-1234-56789abcdef0",
        eworks_customer_id: 890,
        customer_name: "Dr. Kenneth Sterling",
        full_name: "Dr. Kenneth Sterling",
        first_name: "Kenneth",
        last_name: "Sterling",
        email: "k.sterling@emirateshealth.ae",
        phone_e164: "+971554321098",
        telephone_raw: "+971 4 344 5566",
        mobile_raw: "+971 55 432 1098",
        address_line: "Jumeirah 3, Villa 44B, Street 12",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 2,
        notes: "Residential Villa - Prefers weekend appointments",
        eworks_created_on: "2022-03-10T11:20:00Z",
        eworks_last_updated_on: "2026-09-30T10:00:00Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-09-29T16:00:00Z",
        last_synced_at: "2026-10-05T08:00:00Z",
        created_at: "2022-03-10T11:20:00Z",
        updated_at: "2026-10-05T08:00:00Z",

        total_job_count: 6,
        completed_job_count: 6,
        active_job_count: 0,
        latest_job_id: 9650,
        latest_job_type_id: 5,
        latest_job_status: 3,
        latest_job_status_text: "Completed",
        latest_job_start_date: "2026-08-20",
        latest_job_completed_date: "2026-08-20",
        latest_job_completion_date: "2026-08-20",
        latest_job_short_description: "Smart Thermostat & DB Panel Electrical Upgrade",
        latest_job_description: "Installed 6 Ecobee thermostats and re-wired main circuit breakers.",
        latest_job_total: 3200.00,
        latest_job_quote_id: 4890,
        latest_job_invoice_id: 8640,
        latest_job_updated_on: "2026-08-20T17:00:00Z",
        latest_job_created_on: "2026-08-15T09:00:00Z",
        active_jobs: [],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 7,
        latest_quote_id: 5010,
        latest_quote_ref: "SWTS5010",
        latest_quote_date: "2026-09-15",
        latest_quote_expiry_date: "2026-10-15",
        latest_quote_converted_date: null,
        latest_quote_status: 1,
        latest_quote_status_text: "Sent",
        latest_quote_description: "Complete Villa Solar Inverter Maintenance",
        latest_quote_total: 1950.00,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5010",
        has_pending_quote: true,
        pending_quote_count: 1,
        latest_pending_quote_id: 5010,
        latest_pending_quote_date: "2026-09-15",
        latest_pending_quote_expiry_date: "2026-10-15",
        latest_pending_quote_status: 1,
        latest_pending_quote_total: 1950.00,
        latest_pending_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5010",
        latest_converted_quote_id: 4890,
        latest_converted_quote_date: "2026-08-15T10:00:00Z",
        has_amc_quote: false,
        latest_amc_quote_id: null,
        latest_amc_quote_status: null,
        latest_amc_quote_date: null,
        latest_quoted_service_category: "Electrical",
        eworks_quotes_synced_at: "2026-10-05T09:30:00Z",
        quotes_sync_claimed_at: null,
        quotes_sync_claimed_by: null,
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T09:30:00Z",

        total_invoice_count: 6,
        paid_invoice_count: 6,
        unpaid_invoice_count: 0,
        overdue_invoice_count: 0,
        has_unpaid_invoice: false,
        has_overdue_invoice: false,
        total_invoiced_value: 19800.00,
        total_received_value: 19800.00,
        total_outstanding_balance: 0.00,
        latest_invoice_id: 8640,
        latest_invoice_ref: "INV-2026-8640",
        latest_invoice_date: "2026-08-20",
        latest_invoice_due_date: "2026-09-05",
        latest_invoice_job_id: 9650,
        latest_invoice_quote_id: 4890,
        latest_invoice_total: 3200.00,
        latest_invoice_received_amount: 3200.00,
        latest_invoice_balance_amount: 0.00,
        latest_invoice_status: 2,
        latest_invoice_status_text: "Paid",
        latest_unpaid_invoice_id: null,
        latest_unpaid_invoice_date: null,
        latest_unpaid_invoice_due_date: null,
        latest_unpaid_invoice_balance_amount: null,
        latest_overdue_invoice_id: null,
        latest_overdue_invoice_date: null,
        latest_overdue_invoice_due_date: null,
        latest_overdue_invoice_balance_amount: null,
        latest_paid_invoice_id: 8640,
        latest_paid_invoice_date: "2026-08-22",
        latest_paid_invoice_total: 3200.00,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-08-20",
        has_ac_service_history: true,
        last_ac_service_date: "2026-04-10",
        ac_service_count: 4,
        service_history: [
            { id: "srv-201", service_name: "Electrical Safety Audit", date: "2026-08-20", technician: "Sanjay Kumar", cost: 3200 },
            { id: "srv-202", service_name: "Bi-Annual AC Maintenance", date: "2026-04-10", technician: "Ahmed Hassan", cost: 950 }
        ],
        has_amc: false,
        amc_start_date: null,
        amc_expiry_date: null,
        amc_status: null,
        amc_source_job_id: null,
        amc_source_quote_id: null,

        retention_segment: "HIGH_VALUE_WINBACK",
        next_retention_action: "OFFER_ANNUAL_AMC_DISCOUNT",
        next_retention_action_at: "2026-10-10T10:00:00Z",
        last_automation_at: null,
        last_automation_type: null,
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
        decision_status: "READY",
        decision_action_class: "MARKETING",
        decision_calculated_at: "2026-10-04T12:00:00Z",
        decision_source_snapshot_version: "sha256:1a2b...7890",
        dispatch_claim_token: null,
        dispatch_claimed_at: null,
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_AMC_CROSS_SELL",
        sequence_instance_id: "2b3c4d5e-6f7a-8901-bcde-f12345678901",
        sequence_version: 1,
        sequence_step: 1,
        sequence_channel: "email",
        sequence_step_status: "NOT_STARTED",
        sequence_state: {}
    },
    {
        id: "9c3d4e5f-6a7b-8901-2345-6789abcdef01",
        eworks_customer_id: 915,
        customer_name: "Palm Jumeirah Villa 18",
        full_name: "Charlotte Dubois",
        first_name: "Charlotte",
        last_name: "Dubois",
        email: "c.dubois@luxuryliving.fr",
        phone_e164: "+971509871234",
        telephone_raw: "+971 4 555 7788",
        mobile_raw: "+971 50 987 1234",
        address_line: "Palm Jumeirah, Frond M, Villa 18",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 2,
        notes: "High priority AC cooling emergency case",
        eworks_created_on: "2023-01-14T08:30:00Z",
        eworks_last_updated_on: "2026-10-04T14:10:00Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-10-04T14:10:00Z",
        last_synced_at: "2026-10-05T08:00:00Z",
        created_at: "2023-01-14T08:30:00Z",
        updated_at: "2026-10-05T08:00:00Z",

        total_job_count: 8,
        completed_job_count: 7,
        active_job_count: 1,
        latest_job_id: 10310,
        latest_job_type_id: 8,
        latest_job_status: 2,
        latest_job_status_text: "In Progress",
        latest_job_start_date: "2026-10-04",
        latest_job_completed_date: null,
        latest_job_completion_date: null,
        latest_job_short_description: "Emergency Compressor Replacement - Master Bedroom AC",
        latest_job_description: "Replacing burnt 5-ton Daikin compressor and flushing refrigerant lines.",
        latest_job_total: 3800.00,
        latest_job_quote_id: 5190,
        latest_job_invoice_id: 9210,
        latest_job_updated_on: "2026-10-04T14:10:00Z",
        latest_job_created_on: "2026-10-03T18:00:00Z",
        active_jobs: [
            { id: 10310, title: "Emergency Compressor Replacement", status: "In Progress", type: "AC Service", amount: 3800.00, scheduled_date: "2026-10-04" }
        ],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 9,
        latest_quote_id: 5190,
        latest_quote_ref: "SWTS5190",
        latest_quote_date: "2026-10-03",
        latest_quote_expiry_date: "2026-11-03",
        latest_quote_converted_date: "2026-10-03T19:30:00Z",
        latest_quote_status: 2,
        latest_quote_status_text: "Converted",
        latest_quote_description: "Emergency Daikin 5-Ton Compressor Unit & Gas Recharge",
        latest_quote_total: 3800.00,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5190",
        has_pending_quote: false,
        pending_quote_count: 0,
        latest_pending_quote_id: null,
        latest_pending_quote_date: null,
        latest_pending_quote_expiry_date: null,
        latest_pending_quote_status: null,
        latest_pending_quote_total: null,
        latest_pending_quote_link: null,
        latest_converted_quote_id: 5190,
        latest_converted_quote_date: "2026-10-03T19:30:00Z",
        has_amc_quote: false,
        latest_amc_quote_id: null,
        latest_amc_quote_status: null,
        latest_amc_quote_date: null,
        latest_quoted_service_category: "AC Service",
        eworks_quotes_synced_at: "2026-10-05T09:30:00Z",
        quotes_sync_claimed_at: null,
        quotes_sync_claimed_by: null,
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T09:30:00Z",

        total_invoice_count: 7,
        paid_invoice_count: 6,
        unpaid_invoice_count: 1,
        overdue_invoice_count: 0,
        has_unpaid_invoice: true,
        has_overdue_invoice: false,
        total_invoiced_value: 31200.00,
        total_received_value: 27400.00,
        total_outstanding_balance: 3800.00,
        latest_invoice_id: 9210,
        latest_invoice_ref: "INV-2026-9210",
        latest_invoice_date: "2026-10-04",
        latest_invoice_due_date: "2026-10-18",
        latest_invoice_job_id: 10310,
        latest_invoice_quote_id: 5190,
        latest_invoice_total: 3800.00,
        latest_invoice_received_amount: 0.00,
        latest_invoice_balance_amount: 3800.00,
        latest_invoice_status: 1,
        latest_invoice_status_text: "Unpaid",
        latest_unpaid_invoice_id: 9210,
        latest_unpaid_invoice_date: "2026-10-04",
        latest_unpaid_invoice_due_date: "2026-10-18",
        latest_unpaid_invoice_balance_amount: 3800.00,
        latest_overdue_invoice_id: null,
        latest_overdue_invoice_date: null,
        latest_overdue_invoice_due_date: null,
        latest_overdue_invoice_balance_amount: null,
        latest_paid_invoice_id: 8750,
        latest_paid_invoice_date: "2026-06-12",
        latest_paid_invoice_total: 4200.00,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-10-04",
        has_ac_service_history: true,
        last_ac_service_date: "2026-10-04",
        ac_service_count: 6,
        service_history: [
            { id: "srv-301", service_name: "Emergency Daikin Compressor Replacement", date: "2026-10-04", technician: "Tariq Mahmood", cost: 3800 },
            { id: "srv-302", service_name: "AC Pressure Leak Test & Gas Refill", date: "2026-06-12", technician: "Ahmed Hassan", cost: 1200 }
        ],
        has_amc: true,
        amc_start_date: "2026-03-01",
        amc_expiry_date: "2027-02-28",
        amc_status: "ACTIVE",
        amc_source_job_id: 8750,
        amc_source_quote_id: 4750,

        retention_segment: "OPERATIONAL_FOLLOWUP",
        next_retention_action: "SERVICE_QUALITY_FEEDBACK_CALL",
        next_retention_action_at: "2026-10-06T11:00:00Z",
        last_automation_at: null,
        last_automation_type: null,
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "3d4e5f6a-7b89-0123-cdef-1234567890ab",
        decision_status: "READY",
        decision_action_class: "OPERATIONAL",
        decision_calculated_at: "2026-10-05T08:00:00Z",
        decision_source_snapshot_version: "sha256:3d4e...90ab",
        dispatch_claim_token: null,
        dispatch_claimed_at: null,
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_POST_SERVICE_FEEDBACK",
        sequence_instance_id: "4e5f6a7b-8901-2345-def0-234567890abc",
        sequence_version: 1,
        sequence_step: 1,
        sequence_channel: "whatsapp",
        sequence_step_status: "NOT_STARTED",
        sequence_state: {}
    },
    {
        id: "ad4e5f6a-7b89-0123-4567-89abcdef0123",
        eworks_customer_id: 1045,
        customer_name: "Emaar Hills Estate",
        full_name: "Rashid Al Falasi",
        first_name: "Rashid",
        last_name: "Al Falasi",
        email: "r.alfalasi@emaar.ae",
        phone_e164: "+971561112233",
        telephone_raw: "+971 4 367 3333",
        mobile_raw: "+971 56 111 2233",
        address_line: "Dubai Hills, Maple 2, Villa 105",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 1,
        notes: "Corporate Client - Annual Maintenance Contract Lead",
        eworks_created_on: "2024-02-01T10:00:00Z",
        eworks_last_updated_on: "2026-10-01T09:00:00Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-09-28T10:00:00Z",
        last_synced_at: "2026-10-05T08:00:00Z",
        created_at: "2024-02-01T10:00:00Z",
        updated_at: "2026-10-05T08:00:00Z",

        total_job_count: 2,
        completed_job_count: 2,
        active_job_count: 0,
        latest_job_id: 9400,
        latest_job_type_id: 3,
        latest_job_status: 3,
        latest_job_status_text: "Completed",
        latest_job_start_date: "2026-07-10",
        latest_job_completed_date: "2026-07-10",
        latest_job_completion_date: "2026-07-10",
        latest_job_short_description: "Plumbing Pressure Pump & Tank Inspection",
        latest_job_description: "Inspected Grundfos pressure booster pumps and replaced check valves.",
        latest_job_total: 1600.00,
        latest_job_quote_id: 4620,
        latest_job_invoice_id: 8400,
        latest_job_updated_on: "2026-07-10T16:00:00Z",
        latest_job_created_on: "2026-07-05T09:00:00Z",
        active_jobs: [],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 3,
        latest_quote_id: 5080,
        latest_quote_ref: "SWTS5080",
        latest_quote_date: "2026-09-22",
        latest_quote_expiry_date: "2026-10-22",
        latest_quote_converted_date: null,
        latest_quote_status: 0,
        latest_quote_status_text: "Draft",
        latest_quote_description: "Comprehensive Villa AMC Maintenance Proposal",
        latest_quote_total: 6200.00,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5080",
        has_pending_quote: true,
        pending_quote_count: 1,
        latest_pending_quote_id: 5080,
        latest_pending_quote_date: "2026-09-22",
        latest_pending_quote_expiry_date: "2026-10-22",
        latest_pending_quote_status: 0,
        latest_pending_quote_total: 6200.00,
        latest_pending_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5080",
        latest_converted_quote_id: 4620,
        latest_converted_quote_date: "2026-07-05T09:00:00Z",
        has_amc_quote: true,
        latest_amc_quote_id: 5080,
        latest_amc_quote_status: 0,
        latest_amc_quote_date: "2026-09-22",
        latest_quoted_service_category: "Plumbing",
        eworks_quotes_synced_at: "2026-10-05T09:30:00Z",
        quotes_sync_claimed_at: null,
        quotes_sync_claimed_by: null,
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T09:30:00Z",

        total_invoice_count: 2,
        paid_invoice_count: 2,
        unpaid_invoice_count: 0,
        overdue_invoice_count: 0,
        has_unpaid_invoice: false,
        has_overdue_invoice: false,
        total_invoiced_value: 3800.00,
        total_received_value: 3800.00,
        total_outstanding_balance: 0.00,
        latest_invoice_id: 8400,
        latest_invoice_ref: "INV-2026-8400",
        latest_invoice_date: "2026-07-10",
        latest_invoice_due_date: "2026-07-25",
        latest_invoice_job_id: 9400,
        latest_invoice_quote_id: 4620,
        latest_invoice_total: 1600.00,
        latest_invoice_received_amount: 1600.00,
        latest_invoice_balance_amount: 0.00,
        latest_invoice_status: 2,
        latest_invoice_status_text: "Paid",
        latest_unpaid_invoice_id: null,
        latest_unpaid_invoice_date: null,
        latest_unpaid_invoice_due_date: null,
        latest_unpaid_invoice_balance_amount: null,
        latest_overdue_invoice_id: null,
        latest_overdue_invoice_date: null,
        latest_overdue_invoice_due_date: null,
        latest_overdue_invoice_balance_amount: null,
        latest_paid_invoice_id: 8400,
        latest_paid_invoice_date: "2026-07-12",
        latest_paid_invoice_total: 1600.00,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-07-10",
        has_ac_service_history: false,
        last_ac_service_date: null,
        ac_service_count: 0,
        service_history: [
            { id: "srv-401", service_name: "Plumbing Pump Overhaul", date: "2026-07-10", technician: "Sanjay Kumar", cost: 1600 }
        ],
        has_amc: false,
        amc_start_date: null,
        amc_expiry_date: null,
        amc_status: null,
        amc_source_job_id: null,
        amc_source_quote_id: null,

        retention_segment: "QUOTE_REVIVAL_CAMPAIGN",
        next_retention_action: "SEND_QUOTE_FOLLOWUP_DISCOUNT",
        next_retention_action_at: "2026-10-07T09:00:00Z",
        last_automation_at: "2026-09-25T10:00:00Z",
        last_automation_type: "EMAIL_QUOTE_REMINDER",
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "5e6f7a8b-9012-3456-789a-bcdef0123456",
        decision_status: "READY",
        decision_action_class: "MARKETING",
        decision_calculated_at: "2026-10-04T15:00:00Z",
        decision_source_snapshot_version: "sha256:5e6f...3456",
        dispatch_claim_token: null,
        dispatch_claimed_at: null,
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_QUOTE_REVIVAL_CAMPAIGN",
        sequence_instance_id: "6f7a8b9c-0123-4567-89ab-cdef01234567",
        sequence_version: 1,
        sequence_step: 2,
        sequence_channel: "email",
        sequence_step_status: "NOT_STARTED",
        sequence_state: {}
    },
    {
        id: "be5f6a7b-8901-2345-def0-123456789012",
        eworks_customer_id: 1120,
        customer_name: "Damac Hills 2 Villa 402",
        full_name: "Sebastian Mueller",
        first_name: "Sebastian",
        last_name: "Mueller",
        email: "s.mueller@globaltrade.de",
        phone_e164: "+971581234999",
        telephone_raw: "+971 4 412 8800",
        mobile_raw: "+971 58 123 4999",
        address_line: "Damac Hills 2, Vardon Cluster, Villa 402",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 2,
        notes: "Full Villa AC Duct Sanitization and Chiller Repair",
        eworks_created_on: "2023-05-18T14:00:00Z",
        eworks_last_updated_on: "2026-10-04T12:00:00Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-10-03T16:00:00Z",
        last_synced_at: "2026-10-05T08:00:00Z",
        created_at: "2023-05-18T14:00:00Z",
        updated_at: "2026-10-05T08:00:00Z",

        total_job_count: 5,
        completed_job_count: 4,
        active_job_count: 1,
        latest_job_id: 10380,
        latest_job_type_id: 8,
        latest_job_status: 2,
        latest_job_status_text: "In Progress",
        latest_job_start_date: "2026-10-04",
        latest_job_completed_date: null,
        latest_job_completion_date: null,
        latest_job_short_description: "Central AC Blower Fan Assembly Replacement",
        latest_job_description: "Replacing damaged blower motor and balancing airflow across 3 floors.",
        latest_job_total: 2950.00,
        latest_job_quote_id: 5210,
        latest_job_invoice_id: 9280,
        latest_job_updated_on: "2026-10-04T12:00:00Z",
        latest_job_created_on: "2026-10-02T11:00:00Z",
        active_jobs: [
            { id: 10380, title: "Central AC Blower Fan Assembly Replacement", status: "In Progress", type: "AC Service", amount: 2950.00, scheduled_date: "2026-10-04" }
        ],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 6,
        latest_quote_id: 5210,
        latest_quote_ref: "SWTS5210",
        latest_quote_date: "2026-10-02",
        latest_quote_expiry_date: "2026-11-02",
        latest_quote_converted_date: "2026-10-03T10:00:00Z",
        latest_quote_status: 2,
        latest_quote_status_text: "Converted",
        latest_quote_description: "Heavy Duty AC Blower Motor & V-Belt Drive Upgrade",
        latest_quote_total: 2950.00,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5210",
        has_pending_quote: false,
        pending_quote_count: 0,
        latest_pending_quote_id: null,
        latest_pending_quote_date: null,
        latest_pending_quote_expiry_date: null,
        latest_pending_quote_status: null,
        latest_pending_quote_total: null,
        latest_pending_quote_link: null,
        latest_converted_quote_id: 5210,
        latest_converted_quote_date: "2026-10-03T10:00:00Z",
        has_amc_quote: true,
        latest_amc_quote_id: 5210,
        latest_amc_quote_status: 2,
        latest_amc_quote_date: "2026-10-02",
        latest_quoted_service_category: "AC Service",
        eworks_quotes_synced_at: "2026-10-05T09:30:00Z",
        quotes_sync_claimed_at: null,
        quotes_sync_claimed_by: null,
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T09:30:00Z",

        total_invoice_count: 5,
        paid_invoice_count: 4,
        unpaid_invoice_count: 1,
        overdue_invoice_count: 0,
        has_unpaid_invoice: true,
        has_overdue_invoice: false,
        total_invoiced_value: 18400.00,
        total_received_value: 15450.00,
        total_outstanding_balance: 2950.00,
        latest_invoice_id: 9280,
        latest_invoice_ref: "INV-2026-9280",
        latest_invoice_date: "2026-10-04",
        latest_invoice_due_date: "2026-10-18",
        latest_invoice_job_id: 10380,
        latest_invoice_quote_id: 5210,
        latest_invoice_total: 2950.00,
        latest_invoice_received_amount: 0.00,
        latest_invoice_balance_amount: 2950.00,
        latest_invoice_status: 1,
        latest_invoice_status_text: "Unpaid",
        latest_unpaid_invoice_id: 9280,
        latest_unpaid_invoice_date: "2026-10-04",
        latest_unpaid_invoice_due_date: "2026-10-18",
        latest_unpaid_invoice_balance_amount: 2950.00,
        latest_overdue_invoice_id: null,
        latest_overdue_invoice_date: null,
        latest_overdue_invoice_due_date: null,
        latest_overdue_invoice_balance_amount: null,
        latest_paid_invoice_id: 8990,
        latest_paid_invoice_date: "2026-07-20",
        latest_paid_invoice_total: 4500.00,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-10-04",
        has_ac_service_history: true,
        last_ac_service_date: "2026-10-04",
        ac_service_count: 5,
        service_history: [
            { id: "srv-501", service_name: "Blower Motor & Air Flow Calibration", date: "2026-10-04", technician: "Ahmed Hassan", cost: 2950 }
        ],
        has_amc: true,
        amc_start_date: "2026-01-15",
        amc_expiry_date: "2027-01-14",
        amc_status: "ACTIVE",
        amc_source_job_id: 8990,
        amc_source_quote_id: 4800,

        retention_segment: "OPERATIONAL_FOLLOWUP",
        next_retention_action: "AIR_QUALITY_CHECK_SCHEDULE",
        next_retention_action_at: "2026-10-08T10:00:00Z",
        last_automation_at: null,
        last_automation_type: null,
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "6f7a8b9c-0123-4567-89ab-cdef01234567",
        decision_status: "READY",
        decision_action_class: "OPERATIONAL",
        decision_calculated_at: "2026-10-05T08:00:00Z",
        decision_source_snapshot_version: "sha256:6f7a...4567",
        dispatch_claim_token: null,
        dispatch_claimed_at: null,
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_AIR_QUALITY_CHECK",
        sequence_instance_id: "7a8b9c0d-1234-5678-9abc-def012345678",
        sequence_version: 1,
        sequence_step: 1,
        sequence_channel: "whatsapp",
        sequence_step_status: "NOT_STARTED",
        sequence_state: {}
    },
    {
        id: "cf6a7b89-0123-4567-89ab-cdef01234567",
        eworks_customer_id: 1250,
        customer_name: "Nakheel Townhouses Gate 3",
        full_name: "Mariam Al Suwaidi",
        first_name: "Mariam",
        last_name: "Al Suwaidi",
        email: "m.alsuwaidi@nakheel.ae",
        phone_e164: "+971543332211",
        telephone_raw: "+971 4 390 1111",
        mobile_raw: "+971 54 333 2211",
        address_line: "Jumeirah Village Circle, District 14, Villa 12",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 1,
        notes: "Main Water Tank Cleaning & UV Filtration Maintenance",
        eworks_created_on: "2023-08-10T10:30:00Z",
        eworks_last_updated_on: "2026-10-01T15:00:00Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-09-30T11:00:00Z",
        last_synced_at: "2026-10-05T08:00:00Z",
        created_at: "2023-08-10T10:30:00Z",
        updated_at: "2026-10-05T08:00:00Z",

        total_job_count: 4,
        completed_job_count: 4,
        active_job_count: 0,
        latest_job_id: 9910,
        latest_job_type_id: 3,
        latest_job_status: 3,
        latest_job_status_text: "Completed",
        latest_job_start_date: "2026-09-12",
        latest_job_completed_date: "2026-09-12",
        latest_job_completion_date: "2026-09-12",
        latest_job_short_description: "Water Tank Disinfection & Pump Strainer Cleaning",
        latest_job_description: "Cleaned 2000-gallon GRP overhead water tank and replaced UV lamp tube.",
        latest_job_total: 1400.00,
        latest_job_quote_id: 4920,
        latest_job_invoice_id: 8810,
        latest_job_updated_on: "2026-09-12T16:00:00Z",
        latest_job_created_on: "2026-09-08T09:00:00Z",
        active_jobs: [],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 5,
        latest_quote_id: 5140,
        latest_quote_ref: "SWTS5140",
        latest_quote_date: "2026-09-25",
        latest_quote_expiry_date: "2026-10-25",
        latest_quote_converted_date: null,
        latest_quote_status: 1,
        latest_quote_status_text: "Sent",
        latest_quote_description: "Annual Plumbing & Water Filtration Package",
        latest_quote_total: 2800.00,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5140",
        has_pending_quote: true,
        pending_quote_count: 1,
        latest_pending_quote_id: 5140,
        latest_pending_quote_date: "2026-09-25",
        latest_pending_quote_expiry_date: "2026-10-25",
        latest_pending_quote_status: 1,
        latest_pending_quote_total: 2800.00,
        latest_pending_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5140",
        latest_converted_quote_id: 4920,
        latest_converted_quote_date: "2026-09-08T09:00:00Z",
        has_amc_quote: true,
        latest_amc_quote_id: 5140,
        latest_amc_quote_status: 1,
        latest_amc_quote_date: "2026-09-25",
        latest_quoted_service_category: "Plumbing",
        eworks_quotes_synced_at: "2026-10-05T09:30:00Z",
        quotes_sync_claimed_at: null,
        quotes_sync_claimed_by: null,
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T09:30:00Z",

        total_invoice_count: 4,
        paid_invoice_count: 4,
        unpaid_invoice_count: 0,
        overdue_invoice_count: 0,
        has_unpaid_invoice: false,
        has_overdue_invoice: false,
        total_invoiced_value: 8900.00,
        total_received_value: 8900.00,
        total_outstanding_balance: 0.00,
        latest_invoice_id: 8810,
        latest_invoice_ref: "INV-2026-8810",
        latest_invoice_date: "2026-09-12",
        latest_invoice_due_date: "2026-09-26",
        latest_invoice_job_id: 9910,
        latest_invoice_quote_id: 4920,
        latest_invoice_total: 1400.00,
        latest_invoice_received_amount: 1400.00,
        latest_invoice_balance_amount: 0.00,
        latest_invoice_status: 2,
        latest_invoice_status_text: "Paid",
        latest_unpaid_invoice_id: null,
        latest_unpaid_invoice_date: null,
        latest_unpaid_invoice_due_date: null,
        latest_unpaid_invoice_balance_amount: null,
        latest_overdue_invoice_id: null,
        latest_overdue_invoice_date: null,
        latest_overdue_invoice_due_date: null,
        latest_overdue_invoice_balance_amount: null,
        latest_paid_invoice_id: 8810,
        latest_paid_invoice_date: "2026-09-14",
        latest_paid_invoice_total: 1400.00,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-09-12",
        has_ac_service_history: false,
        last_ac_service_date: null,
        ac_service_count: 0,
        service_history: [
            { id: "srv-601", service_name: "Overhead Water Tank Sanitation", date: "2026-09-12", technician: "Sanjay Kumar", cost: 1400 }
        ],
        has_amc: false,
        amc_start_date: null,
        amc_expiry_date: null,
        amc_status: null,
        amc_source_job_id: null,
        amc_source_quote_id: null,

        retention_segment: "QUOTE_REVIVAL_CAMPAIGN",
        next_retention_action: "SEND_WATER_SAFETY_GUIDE",
        next_retention_action_at: "2026-10-09T09:00:00Z",
        last_automation_at: "2026-09-26T10:00:00Z",
        last_automation_type: "EMAIL_PROPOSAL_DISCOUNT",
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "7a8b9c0d-1234-5678-9abc-def012345678",
        decision_status: "READY",
        decision_action_class: "MARKETING",
        decision_calculated_at: "2026-10-04T16:00:00Z",
        decision_source_snapshot_version: "sha256:7a8b...5678",
        dispatch_claim_token: null,
        dispatch_claimed_at: null,
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_PLUMBING_REVIVAL",
        sequence_instance_id: "8b9c0d1e-2345-6789-abcd-ef0123456789",
        sequence_version: 1,
        sequence_step: 1,
        sequence_channel: "email",
        sequence_step_status: "NOT_STARTED",
        sequence_state: {}
    },
    {
        id: "d77a8b9c-0123-4567-89ab-cdef01234568",
        eworks_customer_id: 1380,
        customer_name: "Sobha Hartland Villa 88",
        full_name: "Vikram Shah",
        first_name: "Vikram",
        last_name: "Shah",
        email: "v.shah@shahcapital.in",
        phone_e164: "+971526667788",
        telephone_raw: "+971 4 580 9900",
        mobile_raw: "+971 52 666 7788",
        address_line: "Sobha Hartland, Estates Villa 88",
        city: "Dubai",
        county: null,
        postcode: null,
        country: "AE",
        customer_type_id: 2,
        notes: "Custom Outdoor Garden Lighting & Pool DB Panel Wiring",
        eworks_created_on: "2024-01-20T11:00:00Z",
        eworks_last_updated_on: "2026-10-02T17:00:00Z",
        has_email: true,
        has_phone: true,
        is_reachable: true,
        is_opted_out: false,
        last_contacted_at: "2026-10-01T14:30:00Z",
        last_synced_at: "2026-10-05T08:00:00Z",
        created_at: "2024-01-20T11:00:00Z",
        updated_at: "2026-10-05T08:00:00Z",

        total_job_count: 7,
        completed_job_count: 6,
        active_job_count: 1,
        latest_job_id: 10400,
        latest_job_type_id: 5,
        latest_job_status: 2,
        latest_job_status_text: "In Progress",
        latest_job_start_date: "2026-10-02",
        latest_job_completed_date: null,
        latest_job_completion_date: null,
        latest_job_short_description: "Smart Pool Automation & Submersible Light Installation",
        latest_job_description: "Wiring IP68 LED RGB pool lights and integrating Hayward smart controller.",
        latest_job_total: 4800.00,
        latest_job_quote_id: 5240,
        latest_job_invoice_id: 9310,
        latest_job_updated_on: "2026-10-02T17:00:00Z",
        latest_job_created_on: "2026-09-29T10:00:00Z",
        active_jobs: [
            { id: 10400, title: "Smart Pool Automation & RGB Lights", status: "In Progress", type: "Electrical", amount: 4800.00, scheduled_date: "2026-10-02" }
        ],
        eworks_jobs_synced_at: "2026-10-05T10:03:44Z",
        jobs_sync_error: null,
        jobs_sync_error_count: 0,
        jobs_sync_attempted_at: "2026-10-05T10:03:44Z",
        jobs_sync_claimed_at: null,
        jobs_sync_claimed_by: null,

        total_quote_count: 8,
        latest_quote_id: 5240,
        latest_quote_ref: "SWTS5240",
        latest_quote_date: "2026-09-29",
        latest_quote_expiry_date: "2026-10-29",
        latest_quote_converted_date: "2026-10-01T12:00:00Z",
        latest_quote_status: 2,
        latest_quote_status_text: "Converted",
        latest_quote_description: "Hayward OmniLogic Pool Automation & Fiber Optic Lights",
        latest_quote_total: 4800.00,
        latest_quote_link: "https://customer.ewmjobsystem.com/remote/quote/view/5240",
        has_pending_quote: false,
        pending_quote_count: 0,
        latest_pending_quote_id: null,
        latest_pending_quote_date: null,
        latest_pending_quote_expiry_date: null,
        latest_pending_quote_status: null,
        latest_pending_quote_total: null,
        latest_pending_quote_link: null,
        latest_converted_quote_id: 5240,
        latest_converted_quote_date: "2026-10-01T12:00:00Z",
        has_amc_quote: true,
        latest_amc_quote_id: 5240,
        latest_amc_quote_status: 2,
        latest_amc_quote_date: "2026-09-29",
        latest_quoted_service_category: "Electrical",
        eworks_quotes_synced_at: "2026-10-05T09:30:00Z",
        quotes_sync_claimed_at: null,
        quotes_sync_claimed_by: null,
        quotes_sync_error: null,
        quotes_sync_error_count: 0,
        quotes_sync_attempted_at: "2026-10-05T09:30:00Z",

        total_invoice_count: 7,
        paid_invoice_count: 6,
        unpaid_invoice_count: 1,
        overdue_invoice_count: 0,
        has_unpaid_invoice: true,
        has_overdue_invoice: false,
        total_invoiced_value: 36500.00,
        total_received_value: 31700.00,
        total_outstanding_balance: 4800.00,
        latest_invoice_id: 9310,
        latest_invoice_ref: "INV-2026-9310",
        latest_invoice_date: "2026-10-02",
        latest_invoice_due_date: "2026-10-16",
        latest_invoice_job_id: 10400,
        latest_invoice_quote_id: 5240,
        latest_invoice_total: 4800.00,
        latest_invoice_received_amount: 0.00,
        latest_invoice_balance_amount: 4800.00,
        latest_invoice_status: 1,
        latest_invoice_status_text: "Unpaid",
        latest_unpaid_invoice_id: 9310,
        latest_unpaid_invoice_date: "2026-10-02",
        latest_unpaid_invoice_due_date: "2026-10-16",
        latest_unpaid_invoice_balance_amount: 4800.00,
        latest_overdue_invoice_id: null,
        latest_overdue_invoice_date: null,
        latest_overdue_invoice_due_date: null,
        latest_overdue_invoice_balance_amount: null,
        latest_paid_invoice_id: 8905,
        latest_paid_invoice_date: "2026-06-18",
        latest_paid_invoice_total: 6200.00,
        eworks_invoices_synced_at: "2026-10-05T06:00:38Z",
        invoices_sync_claimed_at: null,
        invoices_sync_claimed_by: null,
        invoices_sync_error: null,
        invoices_sync_error_count: 0,
        invoices_sync_attempted_at: "2026-10-05T06:00:38Z",

        last_service_date: "2026-10-02",
        has_ac_service_history: true,
        last_ac_service_date: "2026-06-18",
        ac_service_count: 4,
        service_history: [
            { id: "srv-701", service_name: "Pool Lighting & Electrical Integration", date: "2026-10-02", technician: "Kevin Vance", cost: 4800 },
            { id: "srv-702", service_name: "Villa Main Electrical DB Maintenance", date: "2026-06-18", technician: "Kevin Vance", cost: 6200 }
        ],
        has_amc: true,
        amc_start_date: "2026-02-01",
        amc_expiry_date: "2027-01-31",
        amc_status: "ACTIVE",
        amc_source_job_id: 8905,
        amc_source_quote_id: 4880,

        retention_segment: "HIGH_VALUE_WINBACK",
        next_retention_action: "OFFER_EXTENDED_WARRANTY",
        next_retention_action_at: "2026-10-12T10:00:00Z",
        last_automation_at: null,
        last_automation_type: null,
        retention_suppressed: false,
        retention_suppression_reason: null,
        decision_id: "8b9c0d1e-2345-6789-abcd-ef0123456789",
        decision_status: "READY",
        decision_action_class: "MARKETING",
        decision_calculated_at: "2026-10-05T07:00:00Z",
        decision_source_snapshot_version: "sha256:8b9c...6789",
        dispatch_claim_token: null,
        dispatch_claimed_at: null,
        dispatch_lease_expires_at: null,

        sequence_id: "SEQ_SMART_HOME_CROSS_SELL",
        sequence_instance_id: "9c0d1e2f-3456-789a-bcde-f01234567890",
        sequence_version: 1,
        sequence_step: 1,
        sequence_channel: "whatsapp",
        sequence_step_status: "NOT_STARTED",
        sequence_state: {}
    }
];

export const SPECTRA_EWORKS_METRICS = {
    totalCustomers: 1490,
    activeJobCount: 38,
    completedJobCount: 412,
    totalJobCount: 450,
    totalInvoicedValue: 485200.00,
    totalReceivedValue: 442350.00,
    totalOutstandingBalance: 42850.00,
    unpaidInvoiceCount: 14,
    overdueInvoiceCount: 5,
    pendingQuoteCount: 28,
    totalQuoteCount: 380,
    amcCustomerCount: 215,
    retentionReadyCount: 184,

    // Category breakdown
    serviceCategories: [
        { name: "AC Service & HVAC", count: 185, revenue: 215000, color: "#3b82f6" },
        { name: "Plumbing & Hydraulics", count: 95, revenue: 110000, color: "#06b6d4" },
        { name: "Electrical & BMS", count: 82, revenue: 88500, color: "#8b5cf6" },
        { name: "Carpentry & Fit-Out", count: 48, revenue: 42300, color: "#f59e0b" },
        { name: "Pest Control & Sanitation", count: 40, revenue: 29400, color: "#10b981" }
    ],

    // Monthly Financial trend (Invoiced vs Received)
    financialTrend: [
        { month: "May 2026", invoiced: 65000, received: 62000, balance: 3000 },
        { month: "Jun 2026", invoiced: 78000, received: 74000, balance: 4000 },
        { month: "Jul 2026", invoiced: 82000, received: 79000, balance: 3000 },
        { month: "Aug 2026", invoiced: 94000, received: 88000, balance: 6000 },
        { month: "Sep 2026", invoiced: 105000, received: 96000, balance: 9000 },
        { month: "Oct 2026", invoiced: 61200, received: 43350, balance: 17850 }
    ],

    // Retention segment distribution
    retentionSegments: [
        { segment: "Unconverted Lead Revival", count: 64, class: "MARKETING" },
        { segment: "AMC Expiring Renewal", count: 42, class: "FINANCIAL" },
        { segment: "High Value Winback", count: 35, class: "MARKETING" },
        { segment: "Operational Followup", count: 28, class: "OPERATIONAL" },
        { segment: "Suppressed / Opted Out", count: 15, class: "COMPLIANCE" }
    ],

    // Infrastructure Sync health
    syncHealth: {
        jobsSyncedAt: "2026-10-05T10:03:44Z",
        quotesSyncedAt: "2026-10-05T09:30:00Z",
        invoicesSyncedAt: "2026-10-05T06:00:38Z",
        jobsErrorCount: 0,
        quotesErrorCount: 0,
        invoicesErrorCount: 0
    }
};
