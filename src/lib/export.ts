import { Task } from "@/types/task";

export function exportTasksToCSV(tasks: Task[]) {
  const headers = ["ID", "Categoría", "Título", "Duración (min)", "Completada", "Subtarea", "Estado Subtarea", "Completado el"];
  
  const rows: string[][] = [];

  const sortedTasks = [...tasks].sort((a, b) => a.date.localeCompare(b.date));

  sortedTasks.forEach((task, index) => {
    const catPrefix = task.parentCategory.substring(0, 3).toUpperCase();
    const dateSuffix = task.date.replace(/-/g, "");
    const meaningfulId = `${catPrefix}-${String(index + 1).padStart(2, '0')}-${dateSuffix}`;

    if (task.subtasks.length === 0) {
      rows.push([
        meaningfulId,
        `"${task.parentCategory}"`,
        `"${task.title}"`,
        task.duration.toString(),
        task.completed ? "Sí" : "No",
        "N/A",
        "N/A",
        "N/A"
      ]);
    } else {
      task.subtasks.forEach(sub => {
        rows.push([
          meaningfulId,
          `"${task.parentCategory}"`,
          `"${task.title}"`,
          task.duration.toString(),
          task.completed ? "Sí" : "No",
          `"${sub.text}"`,
          sub.completed ? "Completada" : "Pendiente",
          sub.completedAt ? new Date(sub.completedAt).toLocaleString() : "N/A"
        ]);
      });
    }
  });

  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `hummingbird_planner_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
