/**
 * Pre-built homework templates for common therapeutic approaches
 * Therapists can use these as starting points when assigning homework
 */

export interface HomeworkTemplate {
  id: string;
  name: string;
  category: 'cbt' | 'dbt' | 'mindfulness' | 'behavioral' | 'journaling' | 'general';
  description: string;
  topic: string;
  suggestedDuration: number; // days
  checkInPrompts: string[];
}

export const HOMEWORK_TEMPLATES: HomeworkTemplate[] = [
  // CBT Templates
  {
    id: 'cbt-thought-record',
    name: 'Thought Record',
    category: 'cbt',
    description: 'Track automatic negative thoughts and challenge them with evidence',
    topic: 'Notice when you have a strong negative thought. What triggered it? What evidence supports or contradicts it?',
    suggestedDuration: 7,
    checkInPrompts: [
      'Did you notice any automatic thoughts today?',
      'What situation triggered your strongest thought?',
      'Were you able to find any evidence against the thought?',
      'How did challenging the thought affect how you felt?',
    ],
  },
  {
    id: 'cbt-behavioral-activation',
    name: 'Behavioral Activation',
    category: 'cbt',
    description: 'Schedule and complete activities that bring pleasure or accomplishment',
    topic: 'Plan one activity each day that you used to enjoy or that gives you a sense of achievement. Notice how you feel before and after.',
    suggestedDuration: 7,
    checkInPrompts: [
      'What activity did you plan for today?',
      'Did you complete it? What got in the way if not?',
      'How did you feel after completing the activity?',
      'What activity might you try tomorrow?',
    ],
  },
  {
    id: 'cbt-worry-time',
    name: 'Scheduled Worry Time',
    category: 'cbt',
    description: 'Contain worry to a specific time each day',
    topic: 'Set aside 15 minutes at the same time each day for worry. Outside this time, note worries but postpone them to your worry time.',
    suggestedDuration: 7,
    checkInPrompts: [
      'Did you stick to your scheduled worry time today?',
      'How many worries did you postpone?',
      'When worry time came, were the postponed worries still as urgent?',
      'What did you notice about your anxiety levels outside worry time?',
    ],
  },

  // DBT Templates
  {
    id: 'dbt-wise-mind',
    name: 'Wise Mind Practice',
    category: 'dbt',
    description: 'Find the balance between emotional mind and rational mind',
    topic: 'When facing a decision or strong emotion, pause and ask: What would Wise Mind say? Notice the difference between reacting and responding.',
    suggestedDuration: 7,
    checkInPrompts: [
      'Did you have a moment today where you paused before reacting?',
      'What was the difference between your emotional and rational response?',
      'Were you able to find a Wise Mind perspective?',
      'How did acting from Wise Mind change the outcome?',
    ],
  },
  {
    id: 'dbt-opposite-action',
    name: 'Opposite Action',
    category: 'dbt',
    description: 'Act opposite to unhelpful emotional urges',
    topic: 'When you notice an urge to avoid, withdraw, or react impulsively, try doing the opposite. Notice what happens to the emotion.',
    suggestedDuration: 7,
    checkInPrompts: [
      'What emotional urge did you notice today?',
      'Were you able to try the opposite action?',
      'What happened to the emotion when you acted opposite?',
      'What made it easier or harder to do the opposite?',
    ],
  },
  {
    id: 'dbt-distress-tolerance',
    name: 'TIPP Skills Practice',
    category: 'dbt',
    description: 'Use Temperature, Intense exercise, Paced breathing, Paired muscle relaxation',
    topic: 'When distress is high, try one TIPP skill: cold water on face, brief intense exercise, slow breathing, or progressive muscle relaxation.',
    suggestedDuration: 5,
    checkInPrompts: [
      'Did you experience high distress today?',
      'Which TIPP skill did you try?',
      'How effective was it at reducing the intensity?',
      'Which skill feels most accessible to you?',
    ],
  },

  // Mindfulness Templates
  {
    id: 'mindfulness-daily',
    name: 'Daily Mindfulness',
    category: 'mindfulness',
    description: 'Brief daily mindfulness practice',
    topic: 'Spend 5-10 minutes each day in mindful awareness. This could be formal meditation or mindful attention during a routine activity.',
    suggestedDuration: 7,
    checkInPrompts: [
      'Did you practice mindfulness today?',
      'What did you notice during your practice?',
      'What thoughts or feelings arose?',
      'How did you feel after the practice?',
    ],
  },
  {
    id: 'mindfulness-body-scan',
    name: 'Body Scan Awareness',
    category: 'mindfulness',
    description: 'Develop awareness of physical sensations and tension',
    topic: 'Once daily, scan your body from head to toe. Notice areas of tension, discomfort, or ease without trying to change them.',
    suggestedDuration: 7,
    checkInPrompts: [
      'Where did you notice tension in your body today?',
      'Were there any surprising sensations?',
      'Did the sensations change as you observed them?',
      'What connection did you notice between body and emotions?',
    ],
  },

  // Behavioral Templates
  {
    id: 'behavioral-sleep-hygiene',
    name: 'Sleep Hygiene',
    category: 'behavioral',
    description: 'Improve sleep through consistent habits',
    topic: 'Track your sleep routine: same bedtime, no screens 1 hour before, cool dark room. Note what helps and what disrupts sleep.',
    suggestedDuration: 7,
    checkInPrompts: [
      'What time did you go to bed and wake up?',
      'Did you follow your sleep routine?',
      'How would you rate your sleep quality?',
      'What helped or hindered your sleep?',
    ],
  },
  {
    id: 'behavioral-exposure',
    name: 'Gradual Exposure',
    category: 'behavioral',
    description: 'Gradually face feared situations',
    topic: 'Each day, take one small step toward something you\'ve been avoiding. Start with the least scary step and work up.',
    suggestedDuration: 7,
    checkInPrompts: [
      'What step did you take today?',
      'What was your anxiety level before, during, and after?',
      'What did you learn from this exposure?',
      'What might be your next step?',
    ],
  },

  // Journaling Templates
  {
    id: 'journaling-gratitude',
    name: 'Gratitude Journal',
    category: 'journaling',
    description: 'Daily gratitude practice to shift attention',
    topic: 'Each evening, write three things you\'re grateful for. They can be small. Notice how this practice affects your mood over time.',
    suggestedDuration: 7,
    checkInPrompts: [
      'What three things were you grateful for today?',
      'Was it easy or hard to find things?',
      'Did anything surprise you on your list?',
      'How did writing the list affect your mood?',
    ],
  },
  {
    id: 'journaling-values',
    name: 'Values Reflection',
    category: 'journaling',
    description: 'Connect daily actions to core values',
    topic: 'Each day, reflect on one action you took that aligned with your values, and one that didn\'t. What can you learn?',
    suggestedDuration: 7,
    checkInPrompts: [
      'What value-aligned action did you take today?',
      'Was there a moment you acted against your values?',
      'What got in the way of living your values?',
      'What small change could help tomorrow?',
    ],
  },

  // General Templates
  {
    id: 'general-mood-tracking',
    name: 'Mood Tracking',
    category: 'general',
    description: 'Track mood patterns and triggers',
    topic: 'Rate your mood 1-10 three times daily (morning, afternoon, evening). Note what was happening at each point.',
    suggestedDuration: 7,
    checkInPrompts: [
      'What were your mood ratings today?',
      'What patterns did you notice?',
      'What seemed to improve or worsen your mood?',
      'Any surprises in what affected your mood?',
    ],
  },
  {
    id: 'general-self-compassion',
    name: 'Self-Compassion Practice',
    category: 'general',
    description: 'Develop kinder self-talk',
    topic: 'When you notice self-criticism, pause and ask: What would I say to a friend in this situation? Offer yourself the same kindness.',
    suggestedDuration: 7,
    checkInPrompts: [
      'Did you catch any self-critical thoughts today?',
      'Were you able to respond with self-compassion?',
      'What did you say to yourself?',
      'How did it feel to be kind to yourself?',
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'cbt', name: 'Cognitive Behavioral (CBT)', description: 'Challenge thoughts and change behaviors' },
  { id: 'dbt', name: 'Dialectical Behavioral (DBT)', description: 'Emotion regulation and distress tolerance' },
  { id: 'mindfulness', name: 'Mindfulness', description: 'Present-moment awareness practices' },
  { id: 'behavioral', name: 'Behavioral', description: 'Change behaviors to change feelings' },
  { id: 'journaling', name: 'Journaling', description: 'Written reflection exercises' },
  { id: 'general', name: 'General', description: 'Flexible therapeutic exercises' },
] as const;

export function getTemplatesByCategory(category: string): HomeworkTemplate[] {
  return HOMEWORK_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): HomeworkTemplate | undefined {
  return HOMEWORK_TEMPLATES.find(t => t.id === id);
}
