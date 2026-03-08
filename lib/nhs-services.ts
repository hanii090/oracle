/**
 * NHS Talking Therapies Service Directory
 * Static dataset of NHS Talking Therapies (formerly IAPT) services across England.
 * Postcode area lookup maps the first part of a UK postcode to the relevant ICB/service.
 *
 * Sources: NHS England, NHS Talking Therapies service listings.
 * Last updated: 2025
 */

export interface NHSService {
  id: string;
  name: string;
  icbArea: string;
  region: string;
  phone: string;
  website: string;
  selfReferralUrl: string;
  postcodeAreas: string[];
  serviceTypes: ('talking-therapies' | 'camhs' | 'perinatal' | 'older-adults' | 'crisis')[];
  waitTimeWeeks: { min: number; max: number };
  description: string;
}

export const NHS_SERVICES: NHSService[] = [
  // ── London ────────────────────────────────────────────────────────────────
  {
    id: 'nhs-talk-london-nw',
    name: 'Barnet Talking Therapies',
    icbArea: 'North Central London ICB',
    region: 'London',
    phone: '020 8702 3500',
    website: 'https://www.barnettalkingtherapi.nhs.uk',
    selfReferralUrl: 'https://www.barnettalkingtherapi.nhs.uk/self-referral',
    postcodeAreas: ['N2', 'N3', 'N10', 'N11', 'N12', 'N14', 'N20', 'NW4', 'NW7', 'NW9', 'NW11', 'EN4', 'EN5', 'HA8'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 12 },
    description: 'Free NHS talking therapies for Barnet residents aged 18+. CBT, counselling, and guided self-help.',
  },
  {
    id: 'nhs-talk-london-camden',
    name: 'Camden & Islington Talking Therapies',
    icbArea: 'North Central London ICB',
    region: 'London',
    phone: '020 3317 6670',
    website: 'https://www.candi.nhs.uk/our-services/talking-therapies',
    selfReferralUrl: 'https://www.candi.nhs.uk/our-services/talking-therapies/self-referral',
    postcodeAreas: ['N1', 'N4', 'N5', 'N6', 'N7', 'N8', 'N19', 'NW1', 'NW3', 'NW5', 'NW6', 'NW8', 'WC1', 'EC1'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 16 },
    description: 'Free NHS talking therapies for Camden and Islington residents. Self-referral available for adults 18+.',
  },
  {
    id: 'nhs-talk-london-south',
    name: 'Southwark Talking Therapies',
    icbArea: 'South East London ICB',
    region: 'London',
    phone: '020 3228 6747',
    website: 'https://www.slam.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.slam.nhs.uk/talking-therapies/referral',
    postcodeAreas: ['SE1', 'SE5', 'SE15', 'SE16', 'SE17', 'SE21', 'SE22', 'SE24'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 18 },
    description: 'Free NHS talking therapies for Southwark residents aged 18+. Includes CBT, EMDR, and counselling.',
  },
  {
    id: 'nhs-talk-london-tower',
    name: 'Tower Hamlets Talking Therapies',
    icbArea: 'North East London ICB',
    region: 'London',
    phone: '020 7655 4050',
    website: 'https://www.elft.nhs.uk/talking-therapies-tower-hamlets',
    selfReferralUrl: 'https://www.elft.nhs.uk/talking-therapies-tower-hamlets/self-referral',
    postcodeAreas: ['E1', 'E2', 'E3', 'E14'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies for Tower Hamlets residents. Multilingual services available.',
  },
  {
    id: 'nhs-talk-london-west',
    name: 'West London NHS Talking Therapies',
    icbArea: 'North West London ICB',
    region: 'London',
    phone: '020 3313 5660',
    website: 'https://www.westlondon.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.westlondon.nhs.uk/talking-therapies/refer',
    postcodeAreas: ['W1', 'W2', 'W6', 'W8', 'W10', 'W11', 'W12', 'W14', 'SW3', 'SW5', 'SW6', 'SW7', 'SW10'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 16 },
    description: 'Free NHS talking therapies across West London boroughs. CBT, IPT, and counselling available.',
  },
  {
    id: 'nhs-talk-london-lambeth',
    name: 'Lambeth Talking Therapies',
    icbArea: 'South East London ICB',
    region: 'London',
    phone: '020 3228 6090',
    website: 'https://www.slam.nhs.uk/lambeth-talking-therapies',
    selfReferralUrl: 'https://www.slam.nhs.uk/lambeth-talking-therapies/referral',
    postcodeAreas: ['SE11', 'SE27', 'SW2', 'SW4', 'SW8', 'SW9', 'SW16'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 18 },
    description: 'Free NHS talking therapies for Lambeth residents. Self-referral for adults 18+.',
  },
  {
    id: 'nhs-talk-london-croydon',
    name: 'Croydon Talking Therapies',
    icbArea: 'South West London ICB',
    region: 'London',
    phone: '020 3228 4040',
    website: 'https://www.slam.nhs.uk/croydon-talking-therapies',
    selfReferralUrl: 'https://www.slam.nhs.uk/croydon-talking-therapies/referral',
    postcodeAreas: ['CR0', 'CR2', 'CR5', 'CR7', 'CR8', 'CR9'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies for Croydon residents aged 16+.',
  },

  // ── South East ────────────────────────────────────────────────────────────
  {
    id: 'nhs-talk-kent',
    name: 'Kent & Medway NHS Talking Therapies',
    icbArea: 'Kent and Medway ICB',
    region: 'South East',
    phone: '0300 123 0981',
    website: 'https://www.kmpt.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.kmpt.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['CT', 'ME', 'TN', 'DA'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 18 },
    description: 'Free NHS talking therapies across Kent and Medway. Self-referral for adults 18+.',
  },
  {
    id: 'nhs-talk-sussex',
    name: 'Sussex NHS Talking Therapies',
    icbArea: 'Sussex ICB',
    region: 'South East',
    phone: '0300 003 0130',
    website: 'https://www.sussexpartnership.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.sussexpartnership.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['BN', 'RH', 'PO'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 20 },
    description: 'Free NHS talking therapies for East and West Sussex residents.',
  },
  {
    id: 'nhs-talk-surrey',
    name: 'Surrey NHS Talking Therapies',
    icbArea: 'Surrey Heartlands ICB',
    region: 'South East',
    phone: '0300 365 2000',
    website: 'https://www.sabp.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.sabp.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['GU', 'KT', 'SM', 'CR3', 'CR6'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 16 },
    description: 'Free NHS talking therapies across Surrey. Includes online, phone, and face-to-face options.',
  },

  // ── South West ────────────────────────────────────────────────────────────
  {
    id: 'nhs-talk-bristol',
    name: 'Bristol Talking Therapies',
    icbArea: 'Bristol, North Somerset and South Gloucestershire ICB',
    region: 'South West',
    phone: '0333 200 1893',
    website: 'https://www.vitahealthgroup.co.uk/nhs-services/nhs-mental-health/bristol-talking-therapies',
    selfReferralUrl: 'https://www.vitahealthgroup.co.uk/nhs-services/nhs-mental-health/bristol-talking-therapies/refer',
    postcodeAreas: ['BS'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 12 },
    description: 'Free NHS talking therapies for Bristol residents. Wide range of evidence-based therapies.',
  },
  {
    id: 'nhs-talk-devon',
    name: 'Devon NHS Talking Therapies',
    icbArea: 'Devon ICB',
    region: 'South West',
    phone: '0300 555 3344',
    website: 'https://www.talkworks.dpt.nhs.uk',
    selfReferralUrl: 'https://www.talkworks.dpt.nhs.uk/self-referral',
    postcodeAreas: ['EX', 'TQ', 'PL'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies across Devon. Self-referral for adults aged 18+.',
  },
  {
    id: 'nhs-talk-dorset',
    name: 'Steps to Wellbeing (Dorset)',
    icbArea: 'Dorset ICB',
    region: 'South West',
    phone: '0800 484 0500',
    website: 'https://www.steps2wellbeing.co.uk',
    selfReferralUrl: 'https://www.steps2wellbeing.co.uk/self-referral',
    postcodeAreas: ['BH', 'DT', 'SP'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 12 },
    description: 'Free NHS talking therapies across Dorset, Bournemouth, and Poole.',
  },

  // ── Midlands ──────────────────────────────────────────────────────────────
  {
    id: 'nhs-talk-birmingham',
    name: 'Birmingham Healthy Minds',
    icbArea: 'Birmingham and Solihull ICB',
    region: 'West Midlands',
    phone: '0121 301 2525',
    website: 'https://www.bsmhft.nhs.uk/our-services/birmingham-healthy-minds',
    selfReferralUrl: 'https://www.bsmhft.nhs.uk/our-services/birmingham-healthy-minds/self-referral',
    postcodeAreas: ['B'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 18 },
    description: 'Free NHS talking therapies for Birmingham and Solihull residents aged 16+.',
  },
  {
    id: 'nhs-talk-nottingham',
    name: 'Nottingham & Nottinghamshire Talking Therapies',
    icbArea: 'Nottingham and Nottinghamshire ICB',
    region: 'East Midlands',
    phone: '0115 896 3160',
    website: 'https://www.nottinghamshirehealthcare.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.nottinghamshirehealthcare.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['NG'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 16 },
    description: 'Free NHS talking therapies across Nottingham and Nottinghamshire.',
  },
  {
    id: 'nhs-talk-leicester',
    name: 'Leicestershire Talking Therapies',
    icbArea: 'Leicester, Leicestershire and Rutland ICB',
    region: 'East Midlands',
    phone: '0116 295 2525',
    website: 'https://www.vitaminds.org',
    selfReferralUrl: 'https://www.vitaminds.org/self-referral',
    postcodeAreas: ['LE'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies for Leicester, Leicestershire, and Rutland residents.',
  },
  {
    id: 'nhs-talk-coventry',
    name: 'Coventry & Warwickshire Talking Therapies',
    icbArea: 'Coventry and Warwickshire ICB',
    region: 'West Midlands',
    phone: '024 7667 1090',
    website: 'https://www.covwarkpt.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.covwarkpt.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['CV'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 16 },
    description: 'Free NHS talking therapies for Coventry and Warwickshire residents aged 16+.',
  },

  // ── North West ────────────────────────────────────────────────────────────
  {
    id: 'nhs-talk-manchester',
    name: 'Manchester Talking Therapies',
    icbArea: 'Greater Manchester ICB',
    region: 'North West',
    phone: '0161 226 3871',
    website: 'https://www.selfhelpservices.org.uk',
    selfReferralUrl: 'https://www.selfhelpservices.org.uk/referral',
    postcodeAreas: ['M'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 18 },
    description: 'Free NHS talking therapies for Manchester residents. Online and face-to-face available.',
  },
  {
    id: 'nhs-talk-liverpool',
    name: 'Talk Liverpool',
    icbArea: 'Cheshire and Merseyside ICB',
    region: 'North West',
    phone: '0151 228 2300',
    website: 'https://www.talkliverpool.nhs.uk',
    selfReferralUrl: 'https://www.talkliverpool.nhs.uk/self-referral',
    postcodeAreas: ['L'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies for Liverpool residents aged 16+.',
  },
  {
    id: 'nhs-talk-lancashire',
    name: 'Lancashire Talking Therapies',
    icbArea: 'Lancashire and South Cumbria ICB',
    region: 'North West',
    phone: '01onal 954 000',
    website: 'https://www.lscft.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.lscft.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['BB', 'FY', 'LA', 'PR'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 18 },
    description: 'Free NHS talking therapies across Lancashire and South Cumbria.',
  },

  // ── North East & Yorkshire ────────────────────────────────────────────────
  {
    id: 'nhs-talk-leeds',
    name: 'Leeds NHS Talking Therapies',
    icbArea: 'West Yorkshire ICB',
    region: 'Yorkshire',
    phone: '0113 843 4388',
    website: 'https://www.leedscommunityhealthcare.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.leedscommunityhealthcare.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['LS'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 16 },
    description: 'Free NHS talking therapies for Leeds residents. Step 2 and Step 3 services.',
  },
  {
    id: 'nhs-talk-sheffield',
    name: 'Sheffield Talking Therapies',
    icbArea: 'South Yorkshire ICB',
    region: 'Yorkshire',
    phone: '0114 226 4660',
    website: 'https://www.shsc.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.shsc.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['S'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 6, max: 18 },
    description: 'Free NHS talking therapies for Sheffield residents aged 16+.',
  },
  {
    id: 'nhs-talk-newcastle',
    name: 'Talking Helps Newcastle',
    icbArea: 'North East and North Cumbria ICB',
    region: 'North East',
    phone: '0191 282 6800',
    website: 'https://www.talkinghelpsnewcastle.nhs.uk',
    selfReferralUrl: 'https://www.talkinghelpsnewcastle.nhs.uk/self-referral',
    postcodeAreas: ['NE'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies for Newcastle and Gateshead residents.',
  },
  {
    id: 'nhs-talk-york',
    name: 'York & Scarborough Talking Therapies',
    icbArea: 'Humber and North Yorkshire ICB',
    region: 'Yorkshire',
    phone: '01904 556620',
    website: 'https://www.tewv.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.tewv.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['YO'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 16 },
    description: 'Free NHS talking therapies for York and Scarborough residents.',
  },

  // ── East of England ───────────────────────────────────────────────────────
  {
    id: 'nhs-talk-norfolk',
    name: 'Wellbeing Norfolk & Waveney',
    icbArea: 'Norfolk and Waveney ICB',
    region: 'East of England',
    phone: '0300 123 1503',
    website: 'https://www.wellbeingnands.co.uk',
    selfReferralUrl: 'https://www.wellbeingnands.co.uk/norfolk/self-referral',
    postcodeAreas: ['NR', 'IP'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies across Norfolk and Waveney.',
  },
  {
    id: 'nhs-talk-essex',
    name: 'Therapy For You (Essex)',
    icbArea: 'Mid and South Essex ICB',
    region: 'East of England',
    phone: '01onal 987 7000',
    website: 'https://www.therapyforyou.co.uk',
    selfReferralUrl: 'https://www.therapyforyou.co.uk/self-referral',
    postcodeAreas: ['SS', 'CM', 'CO', 'RM'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 16 },
    description: 'Free NHS talking therapies across mid and south Essex.',
  },
  {
    id: 'nhs-talk-cambridge',
    name: 'Cambridgeshire Talking Therapies',
    icbArea: 'Cambridgeshire and Peterborough ICB',
    region: 'East of England',
    phone: '0300 300 0055',
    website: 'https://www.cpft.nhs.uk/talking-therapies',
    selfReferralUrl: 'https://www.cpft.nhs.uk/talking-therapies/self-referral',
    postcodeAreas: ['CB', 'PE'],
    serviceTypes: ['talking-therapies'],
    waitTimeWeeks: { min: 4, max: 14 },
    description: 'Free NHS talking therapies for Cambridgeshire and Peterborough residents.',
  },

  // ── National & Crisis Services ────────────────────────────────────────────
  {
    id: 'nhs-crisis-samaritans',
    name: 'Samaritans',
    icbArea: 'National',
    region: 'National',
    phone: '116 123',
    website: 'https://www.samaritans.org',
    selfReferralUrl: 'https://www.samaritans.org',
    postcodeAreas: [],
    serviceTypes: ['crisis'],
    waitTimeWeeks: { min: 0, max: 0 },
    description: 'Free 24/7 emotional support. Call, email, or visit a branch. Available to anyone in the UK.',
  },
  {
    id: 'nhs-crisis-shout',
    name: 'Shout Crisis Text Line',
    icbArea: 'National',
    region: 'National',
    phone: 'Text SHOUT to 85258',
    website: 'https://giveusashout.org',
    selfReferralUrl: 'https://giveusashout.org',
    postcodeAreas: [],
    serviceTypes: ['crisis'],
    waitTimeWeeks: { min: 0, max: 0 },
    description: 'Free 24/7 text-based crisis support. Text SHOUT to 85258 from any UK mobile.',
  },
  {
    id: 'nhs-crisis-mind',
    name: 'Mind Infoline',
    icbArea: 'National',
    region: 'National',
    phone: '0300 123 3393',
    website: 'https://www.mind.org.uk',
    selfReferralUrl: 'https://www.mind.org.uk/information-support/helplines',
    postcodeAreas: [],
    serviceTypes: ['crisis'],
    waitTimeWeeks: { min: 0, max: 0 },
    description: 'Information and signposting for mental health concerns. Lines open 9am-6pm, Mon-Fri.',
  },
  {
    id: 'nhs-111',
    name: 'NHS 111 Mental Health',
    icbArea: 'National',
    region: 'National',
    phone: '111',
    website: 'https://111.nhs.uk',
    selfReferralUrl: 'https://111.nhs.uk',
    postcodeAreas: [],
    serviceTypes: ['crisis'],
    waitTimeWeeks: { min: 0, max: 0 },
    description: 'Call or go online for urgent mental health advice. Available 24/7 across England.',
  },
];

/**
 * Search NHS services by postcode.
 * Matches the outward code (first part) of the postcode against service coverage areas.
 */
export function searchServicesByPostcode(postcode: string): {
  localServices: NHSService[];
  nationalServices: NHSService[];
} {
  // Normalise postcode: uppercase, strip spaces
  const clean = postcode.toUpperCase().replace(/\s+/g, '');
  
  // Extract outward code (everything before the last 3 characters)
  // e.g., "SW1A 1AA" → "SW1A", "M1 1AA" → "M1", "LS1" → "LS1"
  let outwardCode: string;
  if (clean.length >= 5) {
    outwardCode = clean.slice(0, -3);
  } else {
    // Partial postcode — use as-is
    outwardCode = clean;
  }

  const localServices: NHSService[] = [];
  const nationalServices: NHSService[] = [];

  for (const service of NHS_SERVICES) {
    // National services (crisis) always returned
    if (service.postcodeAreas.length === 0) {
      nationalServices.push(service);
      continue;
    }

    // Check if any postcode area prefix matches
    const matches = service.postcodeAreas.some(area => {
      const normArea = area.toUpperCase();
      return outwardCode.startsWith(normArea) || normArea.startsWith(outwardCode);
    });

    if (matches) {
      localServices.push(service);
    }
  }

  return { localServices, nationalServices };
}

/**
 * Get all unique regions from the service directory.
 */
export function getRegions(): string[] {
  const regions = new Set(NHS_SERVICES.filter(s => s.region !== 'National').map(s => s.region));
  return Array.from(regions).sort();
}

/**
 * Get services filtered by region.
 */
export function getServicesByRegion(region: string): NHSService[] {
  return NHS_SERVICES.filter(s => s.region === region && s.serviceTypes.includes('talking-therapies'));
}
