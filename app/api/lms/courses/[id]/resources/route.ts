import { NextRequest } from 'next/server';
import { canManageCourse, canViewCourse, getCourseOr404, getLmsContext, json } from '../../../_shared';
import { LMS_STORAGE_BUCKET, buildLmsStoragePath, getLmsStorageRoot } from '@/lib/lms-storage';
import { supabaseServer } from '@/lib/supabaseServer';
import { requireFeatureAccess } from '@/lib/membership';

function getCourseScope(courseId: string) {
  return getLmsStorageRoot('course', courseId);
}

async function listResources(courseId: string) {
  const scope = getCourseScope(courseId);
  const { data, error } = await supabaseServer.storage.from(LMS_STORAGE_BUCKET).list(scope, { limit: 100 });

  if (error) {
    throw error;
  }

  const files = await Promise.all(
    (data || [])
      .filter((file: any) => file && file.name)
      .map(async (file: any) => {
        const path = `${scope}/${file.name}`;
        const signed = await supabaseServer.storage.from(LMS_STORAGE_BUCKET).createSignedUrl(path, 60 * 10);

        return {
          name: file.name,
          path,
          url: signed.data?.signedUrl || '',
          updatedAt: file.updated_at || null,
        };
      })
  );

  return files;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canViewCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const resources = await listResources(params.id);
  return json({ success: true, resources });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canManageCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  if (context.lmsRole !== 'admin') {
    const membershipCheck = await requireFeatureAccess(context.userEmail, 'files');
    if (!membershipCheck.ok) {
      return json(
        { error: membershipCheck.error, code: membershipCheck.code, membership: membershipCheck.membership || null },
        membershipCheck.status
      );
    }
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return json({ error: 'File is required' }, 400);
  }

  const scope = getCourseScope(params.id);
  const path = buildLmsStoragePath('course', params.id, file.name);
  const { error } = await supabaseServer.storage.from(LMS_STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    return json({ error: error.message }, 500);
  }

  const signed = await supabaseServer.storage.from(LMS_STORAGE_BUCKET).createSignedUrl(path, 60 * 10);

  return json(
    {
      success: true,
      resource: {
        name: file.name,
        path,
        url: signed.data?.signedUrl || '',
        folder: scope,
      },
    },
    201
  );
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canManageCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await req.json();
  const path = String(body?.path || '').trim();

  if (!path) {
    return json({ error: 'Resource path is required' }, 400);
  }

  const { error } = await supabaseServer.storage.from(LMS_STORAGE_BUCKET).remove([path]);
  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ success: true });
}
