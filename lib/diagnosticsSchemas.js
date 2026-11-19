import { z } from 'zod';

export const QueueItemSchema = z.object({
  id: z.string(),
  repair_request_id: z.string().nullable().optional(),
  booking_number: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  appliance_category: z.string().nullable().optional(),
  status: z.string(),
  confidence: z.number().nullable().optional(),
  suggested_urgency: z.string().nullable().optional(),
  top_cause: z.string().nullable().optional(),
  has_safety_flags: z.boolean().default(false),
  estimated_total_min: z.number().nullable().optional(),
  estimated_total_max: z.number().nullable().optional(),
  needs_human_review: z.boolean().default(false),
  review_status: z.string().default('not_required'),
  created_at: z.string().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
});

export const QueueResponseSchema = z.object({
  items: z.array(QueueItemSchema),
  next_cursor: z.string().nullable().optional(),
});

export const MediaItemSchema = z.object({
  id: z.string().optional(),
  media_type: z.string(),
  file_url: z.string().optional(),
  signed_url: z.string().nullable().optional(),
  transcription: z.string().nullable().optional(),
  language_tag: z.string().nullable().optional(),
});

export const ProbableCauseSchema = z.object({
  rank: z.number(),
  name: z.string(),
  likelihood: z.number(),
  reasoning: z.string().optional().default(''),
  evidence: z.array(z.string()).optional().default([]),
});

export const RecommendedPartSchema = z.object({
  sku: z.string(),
  name: z.string(),
  quantity: z.number().default(1),
  unit_price: z.number().nullable().optional(),
  in_stock: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const EstimateSchema = z.object({
  diagnostic_fee: z.number().optional().default(0),
  labor_hours_min: z.number().optional().default(0),
  labor_hours_max: z.number().optional().default(0),
  labor_rate_hourly: z.number().optional().default(0),
  labor_cost_min: z.number().optional().default(0),
  labor_cost_max: z.number().optional().default(0),
  parts_cost_total: z.number().optional().default(0),
  transport_fee: z.number().optional().default(0),
  subtotal_min: z.number().optional().default(0),
  subtotal_max: z.number().optional().default(0),
  sst_amount_min: z.number().optional().default(0),
  sst_amount_max: z.number().optional().default(0),
  total_min: z.number().optional().default(0),
  total_max: z.number().optional().default(0),
  currency: z.string().default('MYR'),
  disclaimer: z.string().optional().default(''),
});

export const SafetyFlagSchema = z.object({
  code: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  category: z.string().optional().default(''),
  requires_acknowledgement: z.boolean().optional().default(false),
  acknowledged_at: z.string().nullable().optional(),
});

export const AssessmentDetailSchema = z.object({
  id: z.string(),
  repair_request_id: z.string().nullable().optional(),
  booking_number: z.string().nullable().optional(),
  customer_first_name: z.string().nullable().optional(),
  address_city: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  appliance_category: z.string().nullable().optional(),
  reported_symptoms: z.string().nullable().optional(),
  issue_description: z.string().nullable().optional(),
  status: z.string(),
  suggested_urgency: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  probable_causes: z.array(ProbableCauseSchema).default([]),
  evidence: z.array(z.string()).default([]),
  diagnostic_steps: z.array(z.string()).default([]),
  recommended_parts: z.array(RecommendedPartSchema).default([]),
  estimate: EstimateSchema.nullable().optional(),
  safety_flags: z.array(SafetyFlagSchema).default([]),
  customer_questions: z.array(z.string()).default([]),
  needs_human_review: z.boolean().default(false),
  review_status: z.string().default('not_required'),
  reviewed_by: z.string().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  review_notes: z.string().nullable().optional(),
  media: z.array(MediaItemSchema).default([]),
  prompt_version: z.string().nullable().optional(),
  pipeline_version: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  model_name: z.string().nullable().optional(),
  latency_ms: z.number().nullable().optional(),
  input_tokens: z.number().nullable().optional(),
  output_tokens: z.number().nullable().optional(),
  attempt: z.number().default(1),
  failure_reason: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  audit_trail: z.array(z.object({
    action: z.string(),
    user: z.string().optional(),
    timestamp: z.string(),
    details: z.string().optional(),
  })).optional().default([]),
});

export const RepriceResponseSchema = z.object({
  status: z.string().default('ok'),
  estimate: EstimateSchema,
});

export const QuoteResponseSchema = z.object({
  status: z.string(),
  draft_invoice_id: z.string().optional(),
  invoice_number: z.string().optional(),
  total: z.number().optional(),
});
