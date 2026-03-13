import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import TaskList from "@/components/tasks/TaskList";

export const metadata: Metadata = {
  title: "Task Board",
  description: "Browse all Agent tasks, filter by mode and status.",
};

export default function TasksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        title="Task Board"
        description="Browse and manage Agent tasks with various filters"
      />
      <TaskList />
    </div>
  );
}
