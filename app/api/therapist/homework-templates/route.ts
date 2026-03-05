import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { HOMEWORK_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory, getTemplateById } from '@/lib/homework-templates';

/**
 * Homework Templates API — provides pre-built templates for therapists
 * 
 * GET /api/therapist/homework-templates - List all templates
 * GET /api/therapist/homework-templates?category=cbt - Filter by category
 * GET /api/therapist/homework-templates?id=xxx - Get specific template
 */

export async function GET(req: Request) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const templateId = url.searchParams.get('id');

    // Get specific template
    if (templateId) {
      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // Filter by category
    if (category) {
      const templates = getTemplatesByCategory(category);
      return NextResponse.json({ 
        templates,
        category: TEMPLATE_CATEGORIES.find(c => c.id === category),
      });
    }

    // Return all templates grouped by category
    return NextResponse.json({
      templates: HOMEWORK_TEMPLATES,
      categories: TEMPLATE_CATEGORIES,
      totalCount: HOMEWORK_TEMPLATES.length,
    });
  } catch (error) {
    console.error('Homework templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
