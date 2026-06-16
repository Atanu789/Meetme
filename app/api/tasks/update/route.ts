import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import Task from '../../../../models/Task';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, ownerEmail, ownerName } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db();
    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (status) task.status = status;
    if (ownerEmail !== undefined) task.ownerEmail = ownerEmail;
    if (ownerName !== undefined) task.ownerName = ownerName;
    await task.save();
    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
