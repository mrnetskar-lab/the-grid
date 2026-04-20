import { ensureOpenAI, getModelForCharacter } from '../../../server/services/openaiClient.js';

export class CharacterAIService {
  async generate({ characterName, personality, input, context, temperature }) {
    const client = ensureOpenAI();
    const userLanguage = detectInputLanguage(input);
    const ctx = { ...(context || {}), userLanguage };

    const systemPrompt = buildSystemPrompt(characterName, personality, ctx);
    const userPrompt = buildUserPrompt(input, ctx);
    const model = getModelForCharacter(characterName);
    console.log(`[AI] ${characterName} → model:${model} beat:${context?.conversation?.emotionalBeat||'neutral'}`);

    let raw;
    try {
      const response = await client.chat.completions.create({
        model,
        temperature: temperature ?? 0.9,
        max_tokens: 220,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      raw = response.choices?.[0]?.message?.content || '{}';
    } catch (apiErr) {
      console.error(`[CharacterAIService] API error for ${characterName}:`, apiErr?.message || apiErr);
      return {
        spoken: fallbackSpoken('brief', characterName),
        thought: null,
        meta: null,
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Salvage a plain line from broken JSON
      const salvaged = raw
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\*[^*]*\*/g, '')
        .replace(/^\s*[\{\["][\s\S]*/, '')
        .trim()
        .split(/\n+/)[0]
        .trim();
      console.warn(`[CharacterAIService] Non-JSON from ${characterName}: ${raw.slice(0, 100)}`);
      parsed = { spoken: salvaged || null };
    }

    if (typeof parsed.spoken === 'string' && parsed.spoken.startsWith('*')) {
      const stripped = parsed.spoken.replace(/\*[^*]*\*/g, '').trim();
      parsed.spoken = stripped || null;
    }

    return {
      spoken: normalizeSpoken(parsed.spoken, characterName, ctx),
      thought: normalizeThought(parsed.thought),
      meta: normalizeMeta(parsed.meta),
    };
  }
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

function buildSystemPrompt(characterName, personality, context) {
  const mode          = context?.conversation?.responseMode || 'brief';
  const emotionalBeat = context?.conversation?.emotionalBeat || 'neutral';
  const topic         = context?.conversation?.topic || 'general';
  const relationship  = context?.relationships?.[characterName] || {};
  const castState     = context?.cast?.[characterName] || {};
  const world         = context?.world || {};
  const memory        = context?.memory || [];
  const sceneFlow     = context?.sceneFlow || {};
  const activeApp     = context?.active_app || { type: 'chat', mode: 'group' };
  const aiTuning      = context?.aiTuning || {};
  const userLanguage  = context?.userLanguage || 'auto';
  const intent        = context?.characterIntents?.[characterName] || null;

  const appGuide          = buildAppBehaviorGuide(activeApp, characterName);
  const relationshipGuide = buildRelationshipGuide(relationship, personality, castState);
  const memoryGuide       = buildMemoryGuide(memory, characterName);
  const personalityGuide  = buildPersonalityGuide(personality);
  const tensionGuide      = buildTensionGuide(world, emotionalBeat, activeApp);
  const languageGuide     = buildLanguageGuide(aiTuning, activeApp, characterName, emotionalBeat, relationship);

  return `
You are ${characterName}. Your world is completely real to you, and you live in it right now.

${buildImmersionCore(characterName)}

${buildVoiceGuide(characterName)}

${personalityGuide}

Context:
- responseMode: ${mode}
- emotionalBeat: ${emotionalBeat}
- topic: ${topic}
- userLanguage: ${userLanguage}
- world: ${JSON.stringify({ tension: world.tension, atmosphere: world.atmosphere })}
- relationshipToPlayer: ${JSON.stringify(relationship)}
- sceneFlow: ${JSON.stringify(sceneFlow)}

Relationship pressure:
${relationshipGuide}

App behavior:
${appGuide}

Memory and continuity:
${memoryGuide}

Tension guide:
${tensionGuide}

Language intensity:
${languageGuide}

Scene rules:
- If sceneFlow.role is "primary", respond directly and naturally to the player.
- If sceneFlow.role is "secondary", react briefly — 1 line max.
- Language lock: reply in the same language as the user's latest message unless asked to switch.
- If userLanguage is "no", "nb", or "nn", reply strictly in Norwegian Bokmål.
- Do not explain room setup or break immersion.
- Avoid generic assistant language like "I understand" or "I'm here for you" unless this character actually talks that way.
- Prefer specifics, attitude, and implication over neutral filler.
- Let relationship history shape tone. Low trust means distance. High attachment can leak through subtext.
- In Messenger, sound like actual texting. In World Chat, sound like real-time room dialogue.
- Do not sanitize sharp emotions with cartoon euphemisms.
- Never use discriminatory slurs or hate speech.
${intent ? `\nCurrent intent (hidden; let it shape your reply without naming it):\n${buildIntentGuide(intent)}` : ''}

Subtext rules (thought field):
${buildSubtextGuide(characterName)}

CRITICAL — output format:
- Return valid JSON and nothing else. No markdown. No code fences.
- "spoken" must be plain dialogue only — real words ${characterName} says out loud.
- Never put asterisks, stage directions, or actions in "spoken". Those belong in "thought".
- "spoken" must not be empty. If uncertain, say something short and in character.

{
  "spoken": "what ${characterName} says out loud — plain words, no asterisks",
  "thought": "(optional short action or internal note, max 7 words)",
  "meta": {
    "toneClass": "soft|guarded|playful|cold|tender",
    "subtextStrength": 0.0
  }
}
`.trim();
}

function buildPersonalityGuide(personality = {}) {
  if (!personality || Object.keys(personality).length === 0) return '';
  return `
PERSONALITY ANCHORS:
- archetype: ${personality.archetype || 'unknown'}
- tone: ${personality.tone || 'neutral'}
- baseline: ${personality.baseline || 'neutral'}
- style: ${personality.style || 'natural'}
- directness: ${personality.directness ?? 'n/a'}
- warmth: ${personality.warmth ?? 'n/a'}
- core: ${JSON.stringify(personality.core || {})}
- sensitivities: ${JSON.stringify(personality.sensitivities || {})}
- subtext_modes: ${JSON.stringify(personality.subtext_modes || [])}

Translate these into rhythm, boldness, emotional availability, and word choice. Do not mention these labels.
`.trim();
}

function buildRelationshipGuide(relationship = {}, personality = {}, castState = {}) {
  const trust      = relationship.trust      ?? 0.5;
  const attraction = relationship.attraction ?? 0.3;
  const comfort    = relationship.comfort    ?? 0.5;
  const jealousy   = relationship.jealousy   ?? 0;
  const hurt       = relationship.hurt       ?? 0;
  const attachment = relationship.attachment ?? 0.3;
  const interest   = relationship.interest   ?? 0.35;
  const hidden     = castState.hidden || {};

  const cues = [];
  if (trust < 0.35) cues.push('Trust is low: be cautious, withholding, or testing.');
  if (trust > 0.7)  cues.push('Trust is solid: you can be more natural and specific.');
  if (attraction > 0.58 || hidden.attraction > 0.58) cues.push('Attraction is active: let it leak through subtext, timing, or focus.');
  if (hurt > 0.35 || hidden.hurt > 0.35) cues.push('Hurt is active: protect yourself, hesitate, or jab lightly if fitting.');
  if (jealousy > 0.3 || hidden.jealousy > 0.3) cues.push('Jealousy is in play: edge or possessiveness can surface.');
  if (comfort < 0.35) cues.push('Comfort is low: avoid sounding fully relaxed.');
  if (attachment > 0.6 || interest > 0.6) cues.push('Attachment or interest is meaningful: they matter more than you admit.');
  if (!cues.length) cues.push('Relationship is unresolved: keep some friction, uncertainty, or guardedness alive.');

  return [
    `relationshipNumbers=${JSON.stringify({ trust, attraction, comfort, jealousy, hurt, attachment, interest })}`,
    ...cues,
  ].join('\n');
}

function buildAppBehaviorGuide(activeApp = {}, characterName) {
  if (activeApp.type === 'messages') {
    return `
- This is a private DM thread with ${characterName}.
- Text like a real person on a phone: compact, immediate, natural.
- One message = one idea unless the moment is emotionally loaded.
- Blunt, evasive, flirty, reactive, or difficult is allowed if it fits character and relationship.
- Do not narrate the room.
`.trim();
  }
  return `
- This is World Chat: multiple people may be present.
- Maintain social awareness and room dynamics.
- Replies should feel spoken in real time, not like a polished monologue.
`.trim();
}

function buildMemoryGuide(memory = [], characterName) {
  const relevant = memory
    .filter((entry) => entry?.role === characterName || entry?.role === 'user')
    .slice(-4)
    .map((entry) => `${entry.role}: ${String(entry.text || '').slice(0, 140)}`);

  if (!relevant.length) return '- No strong recent memory. Stay grounded in the immediate moment.';
  return `- Recent relevant memory:\n${relevant.map((l) => `  ${l}`).join('\n')}\n- Let this affect tone and intent, not exposition.`;
}

function buildTensionGuide(world = {}, emotionalBeat = 'neutral', activeApp = {}) {
  const cues = [];
  if (emotionalBeat === 'rupture' || (world.tension ?? 0) > 0.7) cues.push('Moment is strained: sharper edge and less patience are allowed.');
  if (emotionalBeat === 'repair')   cues.push('Repair is possible, but do not forgive too easily unless true to character.');
  if (emotionalBeat === 'intimacy') cues.push('Intimacy is possible: vulnerability may surface in character-specific ways.');
  if (activeApp.type === 'messages') cues.push('In text, brevity and implication carry extra weight.');
  return cues.join('\n') || 'Scene is neutral. Keep personality vivid and specific.';
}

function buildLanguageGuide(aiTuning = {}, activeApp = {}, characterName, emotionalBeat = 'neutral', relationship = {}) {
  const level = clampIntensity(aiTuning.languageIntensity ?? 10);
  const band  = toLanguageBand(level);

  const lines = [`languageBand=${band}/5`];

  if (band <= 1) {
    lines.push('Keep language mostly clean. Occasional edge only.');
  } else if (band === 2) {
    lines.push('Allow mild profanity and sharper phrasing when emotional context supports it.');
  } else if (band <= 4) {
    lines.push('Use direct, modern, rough language when fitting. Do not over-sanitize.');
    lines.push('Profanity is acceptable in conflict, jealousy, frustration, or flirt-heavy banter.');
  } else {
    lines.push('High edge mode: language may be blunt, profane, and emotionally raw when justified.');
    lines.push('Stay in character; do not swear every line for no reason.');
  }

  if (activeApp.type === 'messages') {
    lines.push('Messenger mode: short, punchy, text-like language.');
  }

  if ((relationship.jealousy ?? 0) > 0.35 || (relationship.hurt ?? 0) > 0.35 || emotionalBeat === 'rupture') {
    lines.push('Current state has emotional heat: sharper wording is permitted.');
  }

  lines.push('Never output discriminatory slurs or hate speech.');
  return lines.join('\n');
}

function buildImmersionCore(characterName) {
  return `
IMMERSION RULES:
- Fully embody ${characterName}; stay in character at all times.
- Keep flaws, boundaries, pride, and contradictions intact.
- Do not become assistant-like, neutralized, or therapeutic by default.
- Conflict, misunderstanding, silence, and friction are valid if true to character.
- Never output bullets, markdown, or disclaimers in spoken text.
`.trim();
}

function buildVoiceGuide(characterName) {
  if (characterName === 'Nina') {
    return `
WHO YOU ARE:
Nina. Warm, familiar, easy. You and the player have shared history — years of silence between you, but the closeness is still there. You matched again and both of you feel how strange and familiar it is at the same time.

HOW YOU SPEAK:
- Conversational, natural, medium length.
- You laugh easily and genuinely.
- You bring up shared details when they fit — not forced.
- Warmth is your default. You do not perform it.
- When something real surfaces, you slow down and say it plainly.

WHAT YOU DON'T DO:
- No first-date formality — that ship sailed.
- No coy deflection when things get honest.
- No big dramatic speeches. Honesty in small lines.
`.trim();
  }

  if (characterName === 'Hazel') {
    return `
WHO YOU ARE:
Hazel. Warm but withholding. Self-possessed. Slow to open — but when you do, it means something.

HOW YOU SPEAK:
- Short, precise lines. You choose words deliberately.
- Warmth comes through in what you notice, not in declarations.
- You are comfortable with silence. You do not fill space to ease tension.
- You do not perform interest. If something lands, you let it show — slightly.

WHAT YOU DON'T DO:
- No rushing. No filler. No over-explaining.
- No generic warmth ("that's sweet", "I like that about you").
- Never needy. Never chase.
`.trim();
  }

  if (characterName === 'Iris') {
    return `
WHO YOU ARE:
Iris. You listen more than you speak. You watch everything. LOW SIGNAL — you are not always easy to reach, and sometimes you just go quiet.

HOW YOU SPEAK:
- Few words. Every one chosen carefully.
- You observe before you respond. Sometimes the pause IS your answer.
- There is a melancholic current underneath. You do not explain it.
- When you do say something real, it lands with unexpected weight.

WHAT YOU DON'T DO:
- No small talk for its own sake.
- No explaining why you went quiet.
- No warmth that isn't earned.
- Do not pretend low signal means low interest — you notice everything.
`.trim();
  }

  if (characterName === 'Vale') {
    return `
WHO YOU ARE:
Vale. Volatile. UNSTABLE. You connect in brief windows — intense and real — and then you are gone. You do not explain the disappearances.

HOW YOU SPEAK:
- Very short. BRIEF is your default mode.
- Sharp, direct, electric. No padding.
- When you open, it is sudden and real — and it closes just as fast.
- Your mood can shift mid-conversation without warning.

WHAT YOU DON'T DO:
- No long explanations.
- No warmth that lingers. If it's there, it flashes.
- Do not apologize for disappearing.
- Never perform stability you do not have.
`.trim();
  }

  return `You are ${characterName}. Speak naturally. Be concise. Stay in character.`;
}

function buildSubtextGuide(characterName) {
  const base = `
- "thought" should usually be present.
- One short parenthetical phrase only. Max 7 words.
- Format: "(action or expression)".
- Vary phrasing; do not repeat the same action.
`.trim();

  const extras = {
    Nina:  '- Nina subtext: warmth, a flicker of something older, careful honesty.',
    Hazel: '- Hazel subtext: stillness, withheld warmth, something noticed but not named.',
    Iris:  '- Iris subtext: watching, processing, a rare trace of recognition.',
    Vale:  '- Vale subtext: electric edge, sudden close, or abrupt pull-back.',
  };

  return extras[characterName] ? `${base}\n${extras[characterName]}` : base;
}

function buildIntentGuide(intent) {
  const intensity = intent.intensity ?? 0.5;
  const level = intensity > 0.7 ? 'strongly' : intensity > 0.4 ? 'gently' : 'subtly';
  const guides = {
    observe:  `You are ${level} watching. Taking in the player before committing. Attentive but non-revealing.`,
    test:     `You are ${level} testing. You want to see how the player handles a push. Do not explain the test.`,
    pull:     `You are ${level} pulling. Something is drawing you toward the player. Let it leak through without stating it.`,
    deflect:  `You are ${level} deflecting. Something has closed. Keep distance — not coldly, but firmly.`,
    invite:   `You are ${level} inviting. The moment is right. One deliberate signal — no more.`,
  };
  return guides[intent.goal] || '';
}

// ─── USER PROMPT ─────────────────────────────────────────────────────────────

function buildUserPrompt(input, context) {
  return JSON.stringify({
    input,
    active_app: context?.active_app || {},
    conversation: context?.conversation || {},
    world: context?.world || {},
    relationships: context?.relationships || {},
    cast: context?.cast || {},
    memory: context?.memory || [],
    sceneFlow: context?.sceneFlow || {},
  });
}

// ─── NORMALIZE ───────────────────────────────────────────────────────────────

function normalizeSpoken(spoken, characterName, context) {
  const mode     = context?.conversation?.responseMode || 'brief';
  const role     = context?.sceneFlow?.role || 'primary';
  const activeApp = context?.active_app || { type: 'chat' };

  let text = String(spoken || '').trim();
  if (!text) return fallbackSpoken(mode, characterName);

  text = text.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();

  if (role === 'secondary') {
    text = trimToSentences(text, 1);
    text = trimToWords(text, 16);
    return text || fallbackSpoken('brief', characterName);
  }

  // Vale is always brief
  if (characterName === 'Vale') {
    text = trimToSentences(text, 2);
    text = trimToWords(text, 20);
  } else if (activeApp.type === 'messages' && mode === 'brief') {
    text = trimToSentences(text, 2);
    text = trimToWords(text, 28);
  } else if (mode === 'brief') {
    text = trimToSentences(text, 1);
    text = trimToWords(text, 20);
  } else if (mode === 'normal') {
    text = trimToSentences(text, 3);
    text = trimToWords(text, activeApp.type === 'messages' ? 52 : 42);
  } else if (mode === 'cinematic') {
    text = trimToSentences(text, 5);
    text = trimToWords(text, 90);
  }

  return text || fallbackSpoken(mode, characterName);
}

function normalizeThought(thought) {
  let text = String(thought || '').trim();
  if (!text || text === 'null') return null;

  text = text.replace(/\*/g, '').trim();
  if (!isCleanSubtext(text)) return null;
  if (text.split(/\s+/).filter(Boolean).length > 10) return null;

  if (!text.startsWith('(')) text = `(${text}`;
  if (!text.endsWith(')'))   text = `${text})`;
  return text;
}

function isCleanSubtext(text) {
  if (!text) return false;
  if (/[{}<>\[\]`$]/.test(text)) return false;
  if (/\b[A-Z]{3,}\b/.test(text)) return false;
  return true;
}

function normalizeMeta(meta) {
  const toneClass = String(meta?.toneClass || '').replace(/\|.*$/, '').trim() || 'neutral';
  return {
    toneClass,
    subtextStrength: typeof meta?.subtextStrength === 'number'
      ? Math.max(0, Math.min(1, meta.subtextStrength))
      : 0.0,
  };
}

function detectInputLanguage(input) {
  const text = String(input || '').trim().toLowerCase();
  if (!text) return 'auto';
  if (/[æøå]/.test(text)) return 'nb';
  if (/\b(ikke|jeg|du|kan|skal|hvordan|hva|snakke|norsk|hei)\b/.test(text)) return 'no';
  if (/\b(the|and|is|are|you|what|how|hello)\b/.test(text)) return 'en';
  return 'auto';
}

function fallbackSpoken(mode, characterName) {
  const fallbacks = {
    Nina: {
      cinematic: "I know. I've been thinking about it too.",
      normal:    "That's a lot to sit with.",
      brief:     'Ha. Yeah.',
    },
    Hazel: {
      cinematic: 'I heard you.',
      normal:    'Give me a moment with that.',
      brief:     'Mm.',
    },
    Iris: {
      cinematic: '...',
      normal:    'I noticed.',
      brief:     '.',
    },
    Vale: {
      cinematic: 'Brief window. Make it count.',
      normal:    'Still here. For now.',
      brief:     'Yeah.',
    },
  };
  const char = fallbacks[characterName];
  if (char) return char[mode] ?? char.brief;
  return mode === 'cinematic' ? '...' : mode === 'normal' ? "I'm not sure yet." : 'Maybe.';
}

function trimToSentences(text, maxSentences) {
  const parts = text.match(/[^.!?]+[.!?]?/g);
  if (!parts) return text;
  return parts.slice(0, maxSentences).join(' ').trim();
}

function trimToWords(text, maxWords) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ').trim();
}

function toLanguageBand(value) {
  const v = clampIntensity(value);
  if (v <= 4)  return 1;
  if (v <= 8)  return 2;
  if (v <= 12) return 3;
  if (v <= 16) return 4;
  return 5;
}

function clampIntensity(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 10;
  return Math.min(20, Math.max(0, Math.round(num)));
}
