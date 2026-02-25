
export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number;
}

export interface Task {
  id: string;
  title: string;
  duration: number; // en minutos
  startTime?: string; // Formato "HH:mm" - Opcional para tareas en el backlog
  completed: boolean;
  parentCategory: string;
  color: string;
  createdAt: number;
  date: string; // Formato YYYY-MM-DD
  subtasks: SubTask[];
}

export type NewTask = Omit<Task, 'id' | 'completed' | 'createdAt' | 'subtasks' | 'startTime' | 'date'>;
