import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import TaskList from "@/components/tasks/TaskList";

export const metadata: Metadata = {
  title: "任务看板",
  description: "浏览所有 Agent 任务，按模式和状态筛选。",
};

export default function TasksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        title="任务看板"
        description="浏览和管理 Agent 任务，支持多种模式与状态筛选"
      />
      <TaskList />
    </div>
  );
}
