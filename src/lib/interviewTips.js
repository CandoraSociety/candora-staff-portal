// General media interview coaching - the same for every guide, so a new guide
// never has to have it rewritten. Only the interview-specific material (the
// questions, key messages, promotional information) lives on the guide itself.
//
// Blocks: paragraph, bullets, note, example, phrases, checklist. Phrases wrapped
// in **double asterisks** are shown in bold and stripped from the narration.

// The seven reminders printed in a band on the one-page quick reference. The
// narration in base44/shared/guideSpeech.ts carries the same list, in the same
// order - keep the two in step when this changes.
export const ON_AIR_REMINDERS = [
  { label: 'Be conversational', text: 'speak naturally rather than reciting prepared answers.' },
  { label: 'Be concise', text: 'aim for 20–40 seconds per response, unless more detail is invited.' },
  { label: 'Lead with the message', text: 'communicate the most important point first.' },
  { label: 'Stay focused', text: 'answer the question without getting sidetracked.' },
  { label: 'Make it relatable', text: 'use simple language and meaningful examples.' },
  { label: 'Connect with the host', text: 'maintain natural eye contact, smile and show enthusiasm.' },
  { label: 'Reinforce the ask', text: 'mention donation opportunities and Candora.ca/donate/ when appropriate.' },
];

export const TIPS_INTRO =
  'Practical coaching for anyone representing Candora on television, radio or online. Read it once in full, then come back to the sections you need before you go on air.';

export const INTERVIEW_TIPS = [
  {
    id: 'preparing',
    title: 'Preparing for the interview',
    blocks: [
      {
        kind: 'bullets',
        items: [
          'Familiarize yourself with the key messages rather than memorizing scripted answers.',
          'Know the important dates, statistics, partner names and calls to action.',
          'Understand the purpose of the interview and what you want viewers to take away from it.',
          'Practise answering questions aloud in your own words.',
          'Be prepared for the interviewer to change the order or wording of the questions.',
          'Review your quick-reference guide shortly before the interview.',
        ],
      },
      {
        kind: 'note',
        text: 'You don’t need to remember every talking point. You need to understand the subject and communicate the most important messages.',
      },
    ],
  },
  {
    id: 'structuring',
    title: 'Structuring your responses',
    blocks: [
      { kind: 'paragraph', text: 'A strong interview response generally has three components.' },
      {
        kind: 'bullets',
        items: [
          '**Lead with the main point:** answer the question directly and communicate the most important message first.',
          '**Provide supporting context:** add one or two meaningful details, examples or statistics that help the audience understand the message.',
          '**Finish with a takeaway:** where appropriate, reinforce why it matters or how viewers can get involved.',
        ],
      },
      {
        kind: 'example',
        title: 'A question about Kids’ Gift Shop',
        items: [
          '**Main point:** children experience the joy of giving at Christmas.',
          '**Supporting context:** up to 500 children participate, choosing gifts for the important adults in their lives.',
          '**Takeaway:** community donations help make this experience possible.',
        ],
        note: 'This is a framework for organizing your thoughts, not a script to memorize.',
      },
    ],
  },
  {
    id: 'concise',
    title: 'Keeping responses concise',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Television interviews are generally short, and interviewers may have several questions to cover within a limited amount of time.',
      },
      {
        kind: 'bullets',
        items: [
          'Aim for approximately 20–40 seconds for most responses.',
          'More complex questions may require additional time.',
          'Communicate your most important information early in the response.',
          'Avoid trying to incorporate every prepared talking point into every answer.',
          'Avoid lengthy background explanations unless the interviewer asks for them.',
          'Once you’ve made your point, allow the interviewer to continue.',
          'Don’t feel obligated to fill every moment of silence.',
        ],
      },
      {
        kind: 'note',
        text: 'A short, meaningful response is often more memorable than a long, comprehensive one.',
      },
    ],
  },
  {
    id: 'natural',
    title: 'Speaking naturally and confidently',
    blocks: [
      {
        kind: 'bullets',
        items: [
          'Treat the interview as a conversation rather than a presentation.',
          'Speak in your own words.',
          'Use a comfortable, deliberate speaking pace.',
          'Pause briefly before answering if you need to collect your thoughts.',
          'Avoid rushing through information.',
          'Use natural vocal emphasis when communicating important information.',
          'Avoid excessive filler words such as “um,” “like,” and “you know.”',
          'Use language that someone unfamiliar with Candora can easily understand.',
          'Avoid internal terminology, funding acronyms and unnecessary organizational jargon.',
        ],
      },
      {
        kind: 'note',
        text: 'You don’t need to sound rehearsed or polished to the point of losing your personality. Authenticity, warmth and sincerity are valuable.',
      },
    ],
  },
  {
    id: 'presence',
    title: 'Body language and on-camera presence',
    blocks: [
      {
        kind: 'bullets',
        items: [
          'Maintain a comfortable, upright posture.',
          'Relax your shoulders.',
          'Maintain natural eye contact with the interviewer rather than looking directly into the camera, unless instructed otherwise.',
          'Smile naturally, particularly when discussing positive community initiatives.',
          'Use comfortable, natural hand gestures.',
          'Avoid excessive movement, fidgeting or looking around the studio.',
          'Listen attentively while the interviewer is speaking.',
          'Remain engaged even when you’re not speaking, as the camera may still be showing you.',
        ],
      },
      {
        kind: 'note',
        text: 'Your facial expressions and body language should reflect the subject you’re discussing. When discussing community challenges, demonstrate compassion and understanding. When discussing Christmas events, express warmth and genuine enthusiasm.',
      },
    ],
  },
  {
    id: 'impact',
    title: 'Communicating community impact',
    blocks: [
      { kind: 'paragraph', text: 'When speaking about Candora and the community:' },
      {
        kind: 'bullets',
        items: [
          'Speak positively and respectfully about Northeast Edmonton.',
          'Recognize the strengths, resilience and contributions of community members.',
          'Avoid defining people or neighbourhoods solely by the challenges they experience.',
          'Focus on opportunities, empowerment, relationships and positive outcomes.',
          'Use meaningful examples that help viewers understand the difference Candora makes.',
          'Protect the privacy and dignity of participants.',
          'Do not share identifiable personal stories without appropriate consent.',
          'Recognize the contributions of volunteers, donors, businesses and community partners.',
        ],
      },
      {
        kind: 'example',
        title: 'Show what support makes possible',
        items: [
          'Rather than focusing exclusively on what people lack, explain what community support makes possible.',
          'Emphasize how children gain opportunities, families develop stronger support networks and community members build meaningful relationships.',
        ],
      },
    ],
  },
  {
    id: 'messages',
    title: 'Reinforcing key messages and calls to action',
    blocks: [
      {
        kind: 'paragraph',
        text: 'A media interview is an opportunity to communicate important messages to a broader audience.',
      },
      { kind: 'paragraph', text: 'For this interview, the priority messages are:' },
      {
        kind: 'bullets',
        items: [
          'Candora is a trusted community hub for Northeast Edmonton.',
          'Kids’ Gift Shop allows children to experience the joy of giving.',
          'Community support is needed to make these initiatives possible.',
          'The impact of donations extends beyond Christmas.',
          'People and businesses can contribute at Candora.ca/donate/.',
        ],
      },
      {
        kind: 'paragraph',
        text: 'Look for natural opportunities to reinforce these messages throughout the interview.',
      },
      {
        kind: 'phrases',
        title: 'Useful bridging phrases',
        items: [
          '“One of the things that’s particularly special about this initiative is…”',
          '“What’s really important for us is…”',
          '“That’s where community support makes such a difference.”',
          '“What we’d love people to know is…”',
          '“For anyone who’s interested in getting involved…”',
          '“And that’s something we continue to do throughout the year.”',
        ],
      },
      {
        kind: 'note',
        text: 'Use these naturally and sparingly. Do not force a promotional message into every response or avoid answering the interviewer’s actual question.',
      },
    ],
  },
  {
    id: 'unexpected',
    title: 'Handling unexpected questions',
    blocks: [
      {
        kind: 'paragraph',
        text: 'The interviewer may ask questions that aren’t included in the preparation guide.',
      },
      {
        kind: 'bullets',
        items: [
          'Listen carefully to the complete question.',
          'Take a brief moment to collect your thoughts.',
          'Answer based on what you know.',
          'Don’t feel pressured to provide information you aren’t certain about.',
          'Never guess at statistics, dates or organizational details.',
          'If appropriate, acknowledge that you don’t have the exact information and offer to follow up.',
          'Correct inaccurate assumptions politely.',
          'Where relevant, connect your answer back to one of the key messages.',
        ],
      },
      {
        kind: 'phrases',
        title: 'Useful responses when uncertain',
        items: [
          '“I don’t have that exact figure with me, but what I can tell you is…”',
          '“I’d have to confirm that particular detail.”',
          '“What we’ve been seeing in our community is…”',
          '“People can certainly contact Candora for more information about that.”',
        ],
      },
      { kind: 'note', text: 'It’s perfectly acceptable not to know every answer.' },
    ],
  },
  {
    id: 'donations',
    title: 'Promoting donations and community involvement',
    blocks: [
      { kind: 'paragraph', text: 'When discussing fundraising:' },
      {
        kind: 'bullets',
        items: [
          'Be clear about what donations are needed.',
          'Explain what people’s generosity will accomplish.',
          'Provide a simple, memorable way to contribute.',
          'Recognize that individuals and businesses can contribute in different ways.',
          'Express genuine gratitude.',
          'Avoid making people feel guilty or pressured.',
          'Highlight opportunities for ongoing involvement beyond the Christmas season.',
        ],
      },
      { kind: 'paragraph', text: 'For this interview, remember to distinguish between:' },
      {
        kind: 'bullets',
        items: [
          '**Gift donations:** new gift items suitable for men and women, which children can select for their loved ones.',
          '**Monetary donations:** supporting Kids’ Gift Shop, children’s and family programming, Community Lunch and other community initiatives.',
          '**Business involvement:** gift collections, sponsorships, volunteering and ongoing community partnerships.',
          '**Primary call to action:** Candora.ca/donate/',
        ],
      },
    ],
  },
  {
    id: 'nerves',
    title: 'Managing nervousness',
    blocks: [
      {
        kind: 'paragraph',
        text: 'It’s normal to experience some nervousness before a media interview.',
      },
      {
        kind: 'bullets',
        items: [
          'Arrive with enough time to get comfortable.',
          'Review the key messages rather than trying to memorize everything at the last minute.',
          'Take a few slow breaths before going on air.',
          'Remember that the interviewer is there to have a conversation with you.',
          'Focus on the question being asked rather than worrying about the next question.',
          'If you stumble over a word, simply continue.',
          'Don’t dwell on a previous answer while the interview is moving forward.',
        ],
      },
      {
        kind: 'note',
        text: 'You know the organization, the community and the work being done. The interview is an opportunity to share that knowledge with others.',
      },
    ],
  },
  {
    id: 'mistakes',
    title: 'Common interview mistakes to avoid',
    blocks: [
      {
        kind: 'bullets',
        items: [
          'Giving overly long answers.',
          'Trying to communicate too many messages at once.',
          'Repeating the same information unnecessarily.',
          'Speaking too quickly.',
          'Using organizational jargon.',
          'Guessing at information.',
          'Interrupting the interviewer.',
          'Focusing excessively on community challenges rather than opportunities and impact.',
          'Forgetting the primary call to action.',
          'Sounding as though you’re reading or reciting a prepared statement.',
        ],
      },
    ],
  },
  {
    id: 'checklist',
    title: 'Final pre-interview checklist',
    blocks: [
      {
        kind: 'checklist',
        items: [
          'I understand the purpose of the interview.',
          'I know the main messages I want to communicate.',
          'I’ve reviewed the interview questions.',
          'I know the important dates and locations.',
          'I know the important statistics.',
          'I know which partners and sponsors to acknowledge.',
          'I know what donations are needed.',
          'I can clearly communicate the donation website.',
          'I’ve practised answering questions in my own words.',
          'I’m ready to have a natural conversation.',
        ],
      },
    ],
  },
];

const strip = (value) => String(value || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

// Every line of a section that the narrator reads, in reading order: the
// examples and phrases included, the checklist read as a list of promises.
export function sectionSpeechLines(section) {
  const lines = [];
  (section?.blocks || []).forEach((block) => {
    if (block.kind === 'bullets' || block.kind === 'checklist') {
      (block.items || []).forEach((item) => lines.push(strip(item)));
      return;
    }
    if (block.kind === 'example' || block.kind === 'phrases') {
      if (block.title) lines.push(strip(block.title));
      (block.items || []).forEach((item) => lines.push(strip(item)));
      if (block.note) lines.push(strip(block.note));
      return;
    }
    if (block.text) lines.push(strip(block.text));
  });
  return lines.filter(Boolean);
}

// The spoken Interview Tips tab: an opening cue, then each numbered section -
// its heading, then one short clip per point, each followed by a real pause.
export function buildTipsSegments() {
  const segments = [];
  const push = (segment) =>
    segments.push({ category_index: null, point_index: null, pause_after_ms: 1200, ...segment });

  push({
    id: 'tips-intro',
    kind: 'cue',
    text: 'Media interview tips.',
    category_label: 'Interview tips',
    pause_after_ms: 800,
  });

  INTERVIEW_TIPS.forEach((section, index) => {
    push({
      id: `tips-h${index}`,
      kind: 'heading',
      text: `${index + 1}. ${section.title}.`,
      category_label: section.title,
      category_index: index,
      pause_after_ms: 1000,
    });

    const lines = sectionSpeechLines(section);
    lines.forEach((line, lineIndex) => {
      push({
        id: `tips-${section.id}-${lineIndex}`,
        kind: 'point',
        text: line,
        category_label: section.title,
        category_index: index,
        point_index: lineIndex,
        pause_after_ms: lineIndex === lines.length - 1 ? 2000 : 1200,
      });
    });
  });

  return segments;
}