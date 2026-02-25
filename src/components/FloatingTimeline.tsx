
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, CheckCircle, Info, ListChecks, Timer, Hourglass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingTimelineProps {
  tasks: Task[];
  onClose: () => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  externalWindow?: any;
}

const PIXELS_PER_MINUTE = 4;

export const FloatingTimeline: React.FC<FloatingTimelineProps> = ({ tasks, onClose, onToggleComplete, onUpdateTask, externalWindow }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const win = externalWindow || window;
    const updateSize = () => {
      setDimensions({ width: win.innerWidth, height: win.innerHeight });
    };
    updateSize();
    win.addEventListener('resize', updateSize);
    return () => win.removeEventListener('resize', updateSize);
  }, [externalWindow]);

  const scheduledTasks = useMemo(() => {
    return tasks
      .filter(t => t.startTime)
      .sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  }, [tasks]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  const activeTask = useMemo(() => {
    return scheduledTasks.find(t => {
      const [h, m] = t.startTime!.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + t.duration;
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
  }, [scheduledTasks, currentMinutes]);

  const nextTask = useMemo(() => {
    return scheduledTasks.find(t => {
      const [h, m] = t.startTime!.split(':').map(Number);
      const startMinutes = h * 60 + m;
      return startMinutes > currentMinutes;
    });
  }, [scheduledTasks, currentMinutes]);

  const timeRemainingActive = useMemo(() => {
    if (!activeTask) return null;
    const [h, m] = activeTask.startTime!.split(':').map(Number);
    const endMinutes = h * 60 + m + activeTask.duration;
    const diff = endMinutes - currentMinutes;
    return diff > 0 ? diff : null;
  }, [activeTask, currentMinutes]);

  const timeUntilNext = useMemo(() => {
    if (!nextTask) return null;
    const [h, m] = nextTask.startTime!.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const diff = startMinutes - currentMinutes;
    return diff > 0 ? diff : null;
  }, [nextTask, currentMinutes]);

  const getPosition = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60 + m) * PIXELS_PER_MINUTE;
  };

  const nowPosition = currentMinutes * PIXELS_PER_MINUTE;

  const handleToggleSubtask = (task: Task, subId: string) => {
    const updatedSubtasks = task.subtasks.map(s => 
      s.id === subId ? { ...s, completed: !s.completed, completedAt: !s.completed ? Date.now() : undefined } : s
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const isUltraCompact = dimensions.height < 140;
  const showTimeline = dimensions.height >= 140 && dimensions.height < 240;
  const showSubtasks = dimensions.height >= 240;

  const content = (
    <div className={cn(
      "w-full h-full flex flex-col p-0 select-none bg-white overflow-hidden font-sans",
      !externalWindow && "fixed bottom-6 left-6 w-[340px] max-h-[400px] z-[200] rounded-[2rem] border border-black/5 shadow-2xl bg-white/95"
    )}>
      <div className={cn(
        "flex justify-between items-center px-4 py-2 shrink-0 border-b border-slate-50 transition-all",
        isUltraCompact && "bg-primary text-white border-none py-3"
      )}>
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {isUltraCompact ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Timer className="w-3.5 h-3.5 shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <h5 className="text-[10px] font-black truncate uppercase tracking-tight leading-none mb-0.5">
                  {activeTask ? activeTask.title : 'Sin tarea activa'}
                </h5>
                <div className="flex items-center gap-2">
                  {timeRemainingActive && (
                    <span className="text-[8px] font-black opacity-80 uppercase tracking-widest flex items-center gap-1">
                      <Hourglass className="w-2 h-2" /> {timeRemainingActive}m
                    </span>
                  )}
                  {nextTask && timeUntilNext && (
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                      timeUntilNext <= 5 ? "text-yellow-200 animate-pulse" : "opacity-60"
                    )}>
                      <ArrowRight className="w-2 h-2" /> {nextTask.title.substring(0, 10)}... en {timeUntilNext}m
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono font-black text-primary tracking-widest uppercase">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {activeTask && !activeTask.completed && (
                  <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[8px] font-black uppercase text-primary tracking-tighter">En progreso</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                {timeRemainingActive && !activeTask?.completed && (
                  <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                    <Hourglass className="w-2.5 h-2.5 text-accent" />
                    <span className="text-[9px] font-black uppercase text-accent tracking-tighter">
                      {timeRemainingActive}m
                    </span>
                  </div>
                )}
                
                {nextTask && timeUntilNext && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full truncate",
                    timeUntilNext <= 5 
                      ? "bg-destructive/10 text-destructive animate-pulse" 
                      : "bg-slate-100 text-slate-500"
                  )}>
                    <ArrowRight className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter truncate">
                      Siguiente: {nextTask.title} en {timeUntilNext}m
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isUltraCompact && activeTask && (
             <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg bg-white/20 text-white hover:bg-white/40"
                onClick={() => onToggleComplete(activeTask.id)}
              >
                {activeTask.completed ? <CheckCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className={cn(
              "h-6 w-6 rounded-full bg-slate-50 hover:bg-destructive/10 border border-slate-200",
              isUltraCompact && "bg-white/10 border-transparent text-white hover:bg-white/20"
            )}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {(showTimeline || showSubtasks) && (
        <div className="relative w-full h-24 flex items-center overflow-hidden shrink-0 border-b border-slate-50 bg-slate-50/30">
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-primary z-30 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-primary rounded-full" />
          </div>

          <div 
            className="relative flex-1 flex items-center transition-transform duration-1000 ease-in-out"
            style={{ 
              transform: `translateX(calc(50% - ${nowPosition}px))`,
            }}
          >
            {scheduledTasks.length === 0 ? (
              <div className="absolute left-[3264px] -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
                 <Info className="w-4 h-4 text-slate-400" />
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sin tareas</span>
              </div>
            ) : (
              scheduledTasks.map((task) => {
                const taskStartPos = getPosition(task.startTime!);
                const [h, m] = task.startTime!.split(':').map(Number);
                const taskStartMinutes = h * 60 + m;
                const taskEndMinutes = taskStartMinutes + task.duration;
                
                const isPast = taskEndMinutes <= currentMinutes;
                const isFuture = taskStartMinutes > currentMinutes;
                const isActive = !isPast && !isFuture;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "absolute h-14 rounded-xl flex items-center justify-between px-3 transition-all duration-700 border-2",
                      (isPast || task.completed) && "opacity-20 blur-[1px] scale-90",
                      isFuture && "opacity-50 scale-95",
                      isActive && !task.completed && "opacity-100 scale-100 z-10 shadow-md border-white"
                    )}
                    style={{ 
                      left: `${taskStartPos}px`, 
                      width: `${task.duration * PIXELS_PER_MINUTE}px`,
                      backgroundColor: task.completed ? '#F1F5F9' : task.color,
                      borderColor: task.completed ? 'transparent' : `${task.color}44`,
                      color: 'white'
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <h5 className={cn(
                        "text-[10px] font-black truncate uppercase tracking-tight",
                        task.completed && "line-through opacity-50 text-slate-500"
                      )}>
                        {task.title}
                      </h5>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7 rounded-lg shrink-0 transition-all",
                        task.completed ? "bg-black/10 text-slate-600" : "hover:bg-white/30 bg-white/10 text-white"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task.id);
                      }}
                    >
                      {task.completed ? <CheckCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </Button>
                  </div>
                );
              })
            )}

            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute top-1/2 -translate-y-1/2 h-4 border-l border-slate-200"
                style={{ left: `${i * 60 * PIXELS_PER_MINUTE}px` }}
              >
                <span className="text-[7px] font-black text-slate-300 -mt-8 block font-mono">{i}:00</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white pointer-events-none z-20" />
        </div>
      )}

      {showSubtasks && (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-4">
          {activeTask && !activeTask.completed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-3 h-3 text-primary" />
                  <h4 className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Pasos de: {activeTask.title}</h4>
                </div>
                {timeRemainingActive && (
                   <span className="text-[8px] font-black text-accent uppercase tracking-tighter">Termina en {timeRemainingActive}m</span>
                )}
              </div>
              
              {activeTask.subtasks.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Sin subtareas definidas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {activeTask.subtasks.map(sub => (
                    <div 
                      key={sub.id}
                      onClick={() => handleToggleSubtask(activeTask, sub.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                        sub.completed 
                          ? "bg-slate-50 border-transparent opacity-40" 
                          : "bg-white border-slate-100 hover:border-primary/40 hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                        sub.completed ? "bg-primary border-primary" : "border-slate-200 group-hover:border-primary/40"
                      )}>
                        {sub.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-black flex-1 truncate",
                        sub.completed ? "line-through text-slate-400" : "text-slate-700"
                      )}>
                        {sub.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
              <ListChecks className="w-8 h-8 text-slate-200" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                {activeTask?.completed ? 'Tarea completada' : 'No hay tarea activa ahora'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (externalWindow) {
    const container = externalWindow.document.getElementById('pip-root');
    if (container) {
      return createPortal(content, container);
    }
  }

  return content;
};
