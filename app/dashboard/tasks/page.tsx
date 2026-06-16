'use client';

import React from 'react';
import TaskList from '../../../../components/TaskList';

export default function MyTasksPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Tasks</h2>
      <div className="max-w-3xl">
        <TaskList />
      </div>
    </div>
  );
}
