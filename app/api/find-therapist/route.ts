import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';
import { searchServicesByPostcode, getServicesByRegion, getRegions } from '@/lib/nhs-services';

/**
 * Find Therapist — NHS Service Finder
 * GET  /api/find-therapist?postcode=SW1A+1AA  — Search by postcode
 * GET  /api/find-therapist?region=London       — Browse by region
 * GET  /api/find-therapist?list=regions        — List all regions
 */

const postcodeQuery = z.string().min(2).max(10).optional();
const regionQuery = z.string().min(2).max(50).optional();

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/find-therapist', correlationId: crypto.randomUUID() });

  try {
    const { searchParams } = new URL(req.url);
    const postcode = searchParams.get('postcode');
    const region = searchParams.get('region');
    const list = searchParams.get('list');

    // List all regions
    if (list === 'regions') {
      return NextResponse.json({ regions: getRegions() });
    }

    // Search by postcode
    if (postcode) {
      const parsed = postcodeQuery.safeParse(postcode);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid postcode format' }, { status: 400 });
      }

      const results = searchServicesByPostcode(postcode);
      log.info('Postcode search', { postcode, localCount: results.localServices.length });

      return NextResponse.json({
        query: postcode.toUpperCase().trim(),
        localServices: results.localServices,
        nationalServices: results.nationalServices,
        totalFound: results.localServices.length,
      });
    }

    // Browse by region
    if (region) {
      const parsed = regionQuery.safeParse(region);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
      }

      const services = getServicesByRegion(region);
      return NextResponse.json({
        region,
        services,
        totalFound: services.length,
      });
    }

    // No query provided — return all regions as default
    return NextResponse.json({
      regions: getRegions(),
      message: 'Provide a postcode or region to search for NHS Talking Therapy services.',
    });
  } catch (error) {
    log.error('Find therapist error', {}, error);
    return NextResponse.json({ error: 'Search failed. Please try again.' }, { status: 500 });
  }
}
