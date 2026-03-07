/**
 * Therapy Modality Mode Configuration
 * 
 * Each modality shapes how Sorca asks questions and frames reflections.
 * This is NOT therapy — it's a Socratic reflection tool that adapts
 * its questioning style to align with the user's therapeutic approach.
 */

export interface TherapyMode {
  id: string;
  name: string;
  shortName: string;
  description: string;
  questioningStyle: string;
  samplePrompts: string[];
  colour: string;
  icon: string;
}

export interface TimeMode {
  id: string;
  name: string;
  description: string;
  tone: string;
  greeting: string;
  closingPrompt: string;
  sessionLength: 'brief' | 'standard' | 'deep';
  colour: string;
}

export const THERAPY_MODES: TherapyMode[] = [
  {
    id: 'socratic',
    name: 'Socratic (Default)',
    shortName: 'Socratic',
    description: 'Open-ended questioning that helps you examine beliefs and arrive at your own insights.',
    questioningStyle: 'Ask open questions that challenge assumptions without directing toward a specific answer. Focus on evidence, logic, and self-discovery.',
    samplePrompts: [
      'What evidence supports that belief — and what evidence contradicts it?',
      'If you followed that thought to its logical conclusion, where does it lead?',
      'What would you say to someone you love who held that same belief?',
    ],
    colour: 'gold',
    icon: '◇',
  },
  {
    id: 'cbt',
    name: 'CBT-Informed',
    shortName: 'CBT',
    description: 'Structured exploration of thoughts, feelings, and behaviours. Identify cognitive distortions and reframe.',
    questioningStyle: 'Help the user identify automatic thoughts, cognitive distortions, and alternative perspectives. Use thought records and behavioural experiments as frameworks.',
    samplePrompts: [
      'What automatic thought came up in that moment?',
      'Is there a thinking pattern here — perhaps catastrophising, mind-reading, or black-and-white thinking?',
      'What would be a more balanced way to think about this situation?',
    ],
    colour: 'teal',
    icon: '□',
  },
  {
    id: 'act',
    name: 'ACT-Informed',
    shortName: 'ACT',
    description: 'Acceptance and commitment. Notice thoughts without fusion, clarify values, take committed action.',
    questioningStyle: 'Encourage defusion from thoughts, present-moment awareness, acceptance of difficult emotions, and values-driven action. Avoid trying to change thoughts directly.',
    samplePrompts: [
      'What if you could have that thought and still move toward what matters to you?',
      'If you stepped back and observed this feeling rather than being inside it, what would you notice?',
      'What value is this struggle connected to — and what small step could honour that value today?',
    ],
    colour: 'violet',
    icon: '○',
  },
  {
    id: 'psychodynamic',
    name: 'Psychodynamic',
    shortName: 'Psychodynamic',
    description: 'Explore how past experiences shape present patterns. Uncover unconscious dynamics.',
    questioningStyle: 'Gently explore connections between past and present, recurring relational patterns, and emotional resonances that may not be immediately obvious. Allow space for free association.',
    samplePrompts: [
      'Does this feeling remind you of anything from earlier in your life?',
      'What pattern do you notice repeating here — and where did it first appear?',
      'What might this reaction be protecting you from?',
    ],
    colour: 'gold',
    icon: '◈',
  },
  {
    id: 'ifs',
    name: 'IFS-Informed',
    shortName: 'IFS',
    description: 'Internal Family Systems. Explore different parts of yourself with curiosity and compassion.',
    questioningStyle: 'Help the user identify and dialogue with different "parts" — protectors, exiles, and the Self. Approach all parts with curiosity rather than judgement.',
    samplePrompts: [
      'Which part of you is speaking right now — and what is it trying to protect you from?',
      'If you could approach this part with curiosity rather than frustration, what might it tell you?',
      'What does this part need to hear from you in order to relax a little?',
    ],
    colour: 'teal',
    icon: '✦',
  },
  {
    id: 'humanistic',
    name: 'Person-Centred',
    shortName: 'Person-Centred',
    description: 'Warm, empathic exploration. Trust your own inner wisdom and capacity for growth.',
    questioningStyle: 'Reflect back what the user shares with warmth and accuracy. Trust their process. Avoid directing or interpreting — create conditions for self-discovery through unconditional positive regard.',
    samplePrompts: [
      'It sounds like that was really significant for you. What stands out most?',
      'You seem to know something important here. What is it?',
      'What would it mean to fully trust yourself in this moment?',
    ],
    colour: 'gold',
    icon: '❋',
  },
  {
    id: 'schema',
    name: 'Schema-Informed',
    shortName: 'Schema',
    description: 'Identify early maladaptive schemas and understand how childhood patterns drive present reactions.',
    questioningStyle: 'Help the user recognise schema activations — deep beliefs formed in childhood that get triggered in adult life. Explore the origin, maintenance, and healthy alternatives.',
    samplePrompts: [
      'What deep belief about yourself gets activated in moments like this?',
      'Where did you first learn that you were [the belief]? How old were you?',
      'What would the healthy adult in you say to the child who first formed this belief?',
    ],
    colour: 'violet',
    icon: '◆',
  },
];

export const TIME_MODES: TimeMode[] = [
  {
    id: 'morning',
    name: 'Morning Reflection',
    description: 'Gentle, intention-setting questions to start the day with awareness.',
    tone: 'Warm, calm, forward-looking. Focus on setting intentions and noticing how you are arriving into the day.',
    greeting: 'Good morning. Before the day takes hold, let\'s pause here for a moment.',
    closingPrompt: 'What intention do you want to carry into today?',
    sessionLength: 'brief',
    colour: 'gold',
  },
  {
    id: 'evening',
    name: 'Evening Wind-Down',
    description: 'Reflective, processing questions to close the day with meaning.',
    tone: 'Gentle, reflective, processing. Help the user make sense of the day and release what they are carrying.',
    greeting: 'The day is drawing to a close. Let\'s take a moment to be with what happened.',
    closingPrompt: 'What do you want to let go of before sleep — and what do you want to keep?',
    sessionLength: 'standard',
    colour: 'violet',
  },
  {
    id: 'night',
    name: 'Night Mode',
    description: 'Soft, grounding questions for when sleep won\'t come. Reduced stimulation.',
    tone: 'Very gentle, minimal, grounding. Short questions. No challenging or provocative prompts. Focus on body awareness and safety.',
    greeting: 'Still awake. That\'s okay. Let\'s be here together for a moment.',
    closingPrompt: 'What does your body need right now to feel safe enough to rest?',
    sessionLength: 'brief',
    colour: 'teal',
  },
  {
    id: 'crisis',
    name: 'Grounding Mode',
    description: 'When things feel overwhelming. Sensory grounding and safety-focused.',
    tone: 'Calm, steady, present-focused. No deep exploration. Focus entirely on grounding, safety, and the present moment.',
    greeting: 'I\'m here. Let\'s slow everything down. You don\'t need to think about anything else right now.',
    closingPrompt: 'What is one thing you can do right now to take care of yourself?',
    sessionLength: 'brief',
    colour: 'teal',
  },
];

export function getTherapyMode(id: string): TherapyMode | undefined {
  return THERAPY_MODES.find(m => m.id === id);
}

export function getTimeMode(id: string): TimeMode | undefined {
  return TIME_MODES.find(m => m.id === id);
}

export function getTimeModeForHour(hour: number): TimeMode {
  if (hour >= 5 && hour < 12) return TIME_MODES.find(m => m.id === 'morning')!;
  if (hour >= 18 && hour < 22) return TIME_MODES.find(m => m.id === 'evening')!;
  if (hour >= 22 || hour < 5) return TIME_MODES.find(m => m.id === 'night')!;
  // Default to morning-style for afternoon
  return TIME_MODES.find(m => m.id === 'morning')!;
}
