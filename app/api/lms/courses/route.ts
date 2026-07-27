import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { getLmsContext, json } from '../_shared';
import Course from '@/models/Course';
import { canManageLms } from '@/lib/lms-role';

function buildCourseCode(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return `${slug || 'course'}-${nanoid(4).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  const { context, response } = await getLmsContext();
  if (!context) {
    return response;
  }

  const search = req.nextUrl.searchParams.get('search') || '';
  const query: any = {};

  if (context.lmsRole === 'student') {
    query['enrolledStudents.email'] = context.userEmail;
  } else if (context.lmsRole === 'instructor') {
    query.instructorEmail = context.userEmail;
  }

  if (search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { code: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const courses = await Course.find(query).sort({ updatedAt: -1 });
  return json({ success: true, courses });
}

export async function POST(req: NextRequest) {
  const { context, response } = await getLmsContext();
  if (!context) {
    return response;
  }

  if (!canManageLms(context.lmsRole)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await req.json();
  const title = String(body?.title || '').trim();

  if (!title) {
    return json({ error: 'Course title is required' }, 400);
  }

  const slug = String(body?.slug || '').trim().toLowerCase() || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nanoid(5).toLowerCase()}`;
  const code = String(body?.code || '').trim() || buildCourseCode(title);

  const existingSlug = await Course.findOne({ slug });
  if (existingSlug) {
    return json({ error: 'Course slug already exists' }, 409);
  }

  const course = new Course({
    title,
    slug,
    code,
    description: String(body?.description || '').trim(),
    instructorId: context.userId,
    instructorEmail: context.userEmail,
    instructorName: context.userName,
    organizationId: context.organizationId,
    status: body?.status || 'draft',
    enrolledStudents: [],
    outline: body?.outline && typeof body.outline === 'object'
      ? {
          learnerLevel: String(body.outline.learnerLevel || '').trim(),
          estimatedDuration: String(body.outline.estimatedDuration || '').trim(),
          learningOutcomes: Array.isArray(body.outline.learningOutcomes) ? body.outline.learningOutcomes.map((item: unknown) => String(item).trim()).filter(Boolean) : [],
          modules: Array.isArray(body.outline.modules) ? body.outline.modules : [],
          assessment: String(body.outline.assessment || '').trim(),
          instructorNotes: String(body.outline.instructorNotes || '').trim(),
          markdown: String(body.outline.markdown || '').trim(),
          sourceUrl: String(body.outline.sourceUrl || '').trim(),
        }
      : undefined,
  });

  await course.save();
  return json({ success: true, course }, 201);
}
