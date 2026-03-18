import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '@/lib/concierge/menu-context';
import { ConciergeRequest, ConciergeResponse } from '@/lib/concierge/types';
import { supabaseAdmin } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const BUILD_ORDER_TOOL: Anthropic.Tool = {
  name: 'build_order',
  description: 'Build a catering order from the customer request. Always call this tool with your structured interpretation of the order.',
  input_schema: {
    type: 'object' as const,
    properties: {
      matched_items: {
        type: 'array',
        description: 'Items from our menu that match what the customer requested',
        items: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'The exact product ID from the menu' },
            quantity: { type: 'number', description: 'Number of units (pans, lbs, dozens, etc.)' },
            size: { type: 'string', enum: ['half', 'full'], description: 'Pan/tray size if applicable' },
            notes: { type: 'string', description: 'How this was interpreted' },
          },
          required: ['product_id', 'quantity'],
        },
      },
      unmatched_items: {
        type: 'array',
        description: 'Items the customer asked for that are NOT on our menu',
        items: {
          type: 'object',
          properties: {
            requested: { type: 'string', description: 'What the customer asked for' },
            suggestion: { type: 'string', description: 'Our closest alternative or explanation' },
            suggested_product_id: { type: 'string', description: 'ID of suggested substitute if any' },
          },
          required: ['requested', 'suggestion'],
        },
      },
      event_details: {
        type: 'object',
        description: 'Event info extracted from the conversation so far. Accumulate across messages — keep values from prior turns even if not repeated.',
        properties: {
          headcount: { type: 'number' },
          event_date: { type: 'string', description: 'ISO date string (YYYY-MM-DD)' },
          customer_name: { type: 'string', description: 'Customer first and last name' },
          customer_email: { type: 'string', description: 'Customer email address' },
          customer_phone: { type: 'string', description: 'Customer phone number' },
          event_type: { type: 'string', description: 'Type of event (corporate lunch, birthday, wedding, etc.)' },
          delivery_time: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      package_suggestion: {
        type: 'object',
        description: 'A package deal that might save the customer money. null if not applicable.',
        properties: {
          package_id: { type: 'string' },
          reason: { type: 'string' },
        },
      },
      follow_up_questions: {
        type: 'array',
        description: 'Questions to ask the customer to complete the order',
        items: { type: 'string' },
      },
      message: {
        type: 'string',
        description: 'Your friendly response to the customer',
      },
      order_ready: {
        type: 'boolean',
        description: 'True only when the customer has confirmed their final order and is ready to proceed to checkout',
      },
    },
    required: ['matched_items', 'unmatched_items', 'event_details', 'follow_up_questions', 'message', 'order_ready'],
  },
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Concierge is not configured. Please add ANTHROPIC_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: ConciergeRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required.' },
        { status: 400 }
      );
    }

    // Enforce message limits
    if (messages.length > 40) {
      return NextResponse.json(
        { error: 'Conversation too long. Please start a new conversation.' },
        { status: 400 }
      );
    }

    // Limit individual message length
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.content.length > 3000) {
      return NextResponse.json(
        { error: 'Message too long. Please keep messages under 3000 characters.' },
        { status: 400 }
      );
    }

    // Fetch business rules from Supabase and inject into prompt
    let businessRules = '';
    try {
      const { data } = await supabaseAdmin
        .from('concierge_rules')
        .select('category, rule')
        .eq('active', true)
        .order('category')
        .order('sort_order');

      if (data && data.length > 0) {
        const grouped: Record<string, string[]> = {};
        data.forEach((r: { category: string; rule: string }) => {
          if (!grouped[r.category]) grouped[r.category] = [];
          grouped[r.category].push(r.rule);
        });

        businessRules = '\n\n## BUSINESS RULES (set by restaurant owner — follow these exactly)\n\n';
        for (const [cat, rules] of Object.entries(grouped)) {
          businessRules += `### ${cat.toUpperCase()}\n`;
          rules.forEach(r => { businessRules += `- ${r}\n`; });
          businessRules += '\n';
        }
      }
    } catch {
      // Continue without business rules if Supabase fails
    }

    const systemPrompt = getSystemPrompt() + businessRules;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      tools: [BUILD_ORDER_TOOL],
      tool_choice: { type: 'tool', name: 'build_order' },
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Extract the tool use result
    const toolUse = response.content.find(block => block.type === 'tool_use');

    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Betty could not process your request. Please try rephrasing.' },
        { status: 500 }
      );
    }

    const result = toolUse.input as ConciergeResponse;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Concierge API error:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Betty is busy right now. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
