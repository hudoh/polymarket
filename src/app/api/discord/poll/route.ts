import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OUTCOME_COLORS } from '@/lib/constants'

const DISCORD_CHANNEL_ID = '1497243363416604793'
const GUILD_ID = '1483266029156307014'
const PLATFORM_URL = 'https://polymarket-rouge.vercel.app'

// Simple NLP parser for Discord commands
function parseCommand(content: string): { action: string; args: Record<string, string> } | null {
  const lower = content.toLowerCase().trim()
  
  // "list markets" or "show markets"
  if (lower.match(/^(list|show|view)\s+(the\s+)?(markets|questions)$/)) {
    return { action: 'list_markets', args: {} }
  }
  
  // "create market: ..." or "new market: ..."
  const createMatch = lower.match(/^(create|new)\s+market:\s*(.+)/)
  if (createMatch) {
    return { action: 'create_market', args: { question: createMatch[2] } }
  }
  
  // "resolve market ..." or "settle ..."
  const resolveMatch = lower.match(/^(resolve|settle)\s+market\s+(.+)/)
  if (resolveMatch) {
    return { action: 'resolve_market', args: { question: resolveMatch[2] } }
  }
  
  // "help"
  if (lower === 'help' || lower === 'commands' || lower === '?') {
    return { action: 'help', args: {} }
  }
  
  return null
}

async function listMarkets(): Promise<string> {
  const { data: markets } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!markets || markets.length === 0) {
    return 'No markets yet. Go to polymarket.themcq.ai to create one!'
  }

  const open = markets.filter((m) => !m.resolved)
  const resolved = markets.filter((m) => m.resolved)

  let msg = '⚡ **Open Markets:**\n'
  for (const m of open) {
    const date = new Date(m.close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    msg += `• **${m.question}** (closes ${date})\n`
    msg += `  Outcomes: ${m.outcomes.map((o: string, i: number) => `${o}`).join(' | ')}\n`
    msg += `  → ${PLATFORM_URL}/markets/${m.id}\n\n`
  }

  if (resolved.length > 0) {
    msg += `\n✅ **Resolved Markets:**\n`
    for (const m of resolved.slice(0, 3)) {
      msg += `• ~~${m.question}~~ → **${m.outcomes[m.winning_outcome || 0]}** won\n`
    }
  }

  return msg
}

async function createMarket(question: string, userId: string): Promise<string> {
  // Binary market: Yes / No
  const { data: market, error } = await supabase
    .from('markets')
    .insert({
      question,
      outcomes: ['Yes', 'No'],
      created_by: userId,
      close_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single()

  if (error) return `❌ Failed to create market: ${error.message}`
  return `✅ **Market Created!**\n⚡ ${question}\n→ Bet now: ${PLATFORM_URL}/markets/${market.id}`
}

async function helpCommand(): Promise<string> {
  return `**Polymarket Commands:**

🔹 \`list markets\` — Show all active markets
🔹 \`create market: [your question]\` — Propose a new market (be specific!)
🔹 \`resolve market: [question keyword]\` — Resolve a market (admin only)
🔹 \`help\` — Show this message

**How trading works:**
1. Visit polymarket.themcq.ai → Register → Get $1M play money
2. Browse markets → Buy shares on your prediction
3. If your outcome wins → You earn $1/share

Currently powered by TheMcQ + Apex ⚡`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, lastMessageId } = await req.json()

    let response = ''

    for (const msg of messages) {
      const parsed = parseCommand(msg.content)
      if (!parsed) continue

      switch (parsed.action) {
        case 'list_markets':
          response = await listMarkets()
          break
        case 'create_market':
          // For Discord users, we can't auto-create without account linkage
          // Instead, give them a direct link to create
          response = `📝 **New Market Proposal:** "${parsed.args.question}"

To create this market, visit: ${PLATFORM_URL}/admin

Or describe it differently and I'll help you think through the outcomes!`
          break
        case 'resolve_market':
          response = `⚠️ Market resolution requires admin access via the web dashboard:\n${PLATFORM_URL}/admin`
          break
        case 'help':
          response = await helpCommand()
          break
      }
    }

    if (response) {
      return NextResponse.json({ response })
    }

    return NextResponse.json({ response: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
