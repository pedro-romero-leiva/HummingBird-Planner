
"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, SubTask } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Clock, GripVertical, CheckCircle2, CheckCircle, Play, Hourglass, ArrowRight, Timer, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTimelineProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onStartFocus: (task: Task) => void;
  startHour: number;
  endHour: number;
  onUpdateHours: (start: number, end: number) => void;
}

const PIXELS_PER_HOUR = 240; 
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60; // 4px per minute

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ 
  tasks, 
  onToggleComplete,
  onDelete,
  onSelectTask,
  onUpdateTask,
  onStartFocus,
  startHour,
  endHour,
  onUpdateHours
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  if (!mounted) return <div className="h-64 animate-pulse bg-muted/5 rounded-[2rem]" />;

  const hoursList = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  const getTaskLeft = (startTime: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutesFromStart = (h - startHour) * 60 + m;
    return totalMinutesFromStart * PIXELS_PER_MINUTE;
  };

  const handleToggleSubtask = (e: React.MouseEvent, task: Task, subId: string) => {
    e.stopPropagation();
    const updatedSubtasks = task.subtasks.map(s => 
      s.id === subId ? { ...s, completed: !s.completed, completedAt: !s.completed ? Date.now() : undefined } : s
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const totalMinutesFromGridStart = Math.floor(x / PIXELS_PER_MINUTE);
      const snappedMinutes = Math.round(totalMinutesFromGridStart / 15) * 15;
      setDragX(snappedMinutes * PIXELS_PER_MINUTE);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    setDragX(null);
    
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (!task || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dropX = e.clientX - rect.left + containerRef.current.scrollLeft;
    
    const totalMinutesFromGridStart = Math.floor(dropX / PIXELS_PER_MINUTE);
    
    let newHour = Math.floor(totalMinutesFromGridStart / 60) + startHour;
    let newMinute = Math.round((totalMinutesFromGridStart % 60) / 15) * 15;

    if (newMinute === 60) {
      newHour += 1;
      newMinute = 0;
    }

    if (newHour < 0) newHour = 0;
    if (newHour > 23) newHour = 23;

    const startTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
    onUpdateTask({ ...task, startTime });
  };

  return (
    <div className="space-y-4 timeline-box">
      <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Itinerario de hoy</h3>
          </div>
          
          <div className="flex items-center gap-2 overflow-hidden">
            {activeTask && !activeTask.completed && timeRemainingActive && (
              <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1 rounded-full shrink-0 border border-accent/10">
                <Hourglass className="w-3 h-3 text-accent" />
                <span className="text-[9px] font-black uppercase text-accent tracking-tighter">
                  Termina en {timeRemainingActive}m
                </span>
              </div>
            )}
            
            {nextTask && timeUntilNext && (
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full border shrink-0 transition-all",
                timeUntilNext <= 5 
                  ? "bg-destructive/10 border-destructive text-destructive animate-pulse" 
                  : "bg-secondary/40 border-transparent text-muted-foreground"
              )}>
                <ArrowRight className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[150px]">
                  Siguiente: {nextTask.title} en {timeUntilNext}m
                </span>
              </div>
            )}
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="text-[9px] h-7 font-black text-muted-foreground uppercase bg-white px-3 py-1 rounded-full border shadow-sm self-start md:self-auto hover:bg-primary/5 hover:text-primary transition-all group"
            >
              <Settings2 className="w-2.5 h-2.5 mr-2 opacity-40 group-hover:opacity-100" />
              {startHour}:00 — {endHour}:00
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4 rounded-2xl shadow-2xl border-2">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Ajustar Jornada</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-primary/60">Inicia</label>
                  <Select value={startHour.toString()} onValueChange={(val) => onUpdateHours(parseInt(val), endHour)}>
                    <SelectTrigger className="h-8 rounded-lg text-[10px] font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()} className="text-[10px] font-black">{i}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-accent/60">Finaliza</label>
                  <Select value={endHour.toString()} onValueChange={(val) => onUpdateHours(startHour, parseInt(val))}>
                    <SelectTrigger className="h-8 rounded-lg text-[10px] font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()} className="text-[10px] font-black">{i}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[8px] font-bold text-muted-foreground/60 text-center pt-2">El itinerario se ajustará automáticamente.</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div 
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={() => {
          setIsOver(false);
          setDragX(null);
        }}
        className={cn(
          "relative bg-white border-2 rounded-[2.5rem] shadow-xl overflow-x-auto horizontal-scrollbar h-[340px] transition-all duration-300",
          isOver ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-primary/10"
        )}
      >
        <div 
          className="relative h-full timeline-grid pointer-events-none" 
          style={{ width: `${(endHour - startHour + 1) * PIXELS_PER_HOUR}px`, minWidth: '100%', backgroundSize: `${PIXELS_PER_HOUR}px 100%` }}
        >
          {hoursList.map((hour) => (
            <div 
              key={hour} 
              className="absolute h-full border-l border-dashed border-muted/20 pointer-events-none"
              style={{ left: `${(hour - startHour) * PIXELS_PER_HOUR}px` }}
            >
              <span className="inline-block mt-4 ml-3 text-[10px] font-black text-muted-foreground/30 font-mono">
                {hour}:00
              </span>
              <div className="absolute top-0 bottom-0 left-[60px] border-l border-dotted border-muted/5" />
              <div className="absolute top-0 bottom-0 left-[120px] border-l border-dotted border-muted/5" />
              <div className="absolute top-0 bottom-0 left-[180px] border-l border-dotted border-muted/5" />
            </div>
          ))}

          {dragX !== null && (
            <div 
              className="absolute top-0 bottom-0 w-1 bg-primary/20 transition-all duration-75 z-40"
              style={{ left: `${dragX}px` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-primary rounded-full shadow-lg" />
            </div>
          )}

          {scheduledTasks.map((task) => {
            const left = getTaskLeft(task.startTime!);
            const width = task.duration * PIXELS_PER_MINUTE;
            const completedSubs = task.subtasks.filter(s => s.completed).length;
            const isShort = task.duration < 45;
            
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('taskId', task.id);
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.opacity = '0.5';
                  }
                }}
                onDragEnd={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                className="absolute top-1/2 -translate-y-1/2 transition-transform hover:z-30 group pointer-events-auto"
                style={{ 
                  left: `${left}px`, 
                  width: `${width}px`,
                  height: '180px'
                }}
              >
                <Card 
                  className={cn(
                    "h-full w-full border-none shadow-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] group-hover:ring-4 ring-white/50 flex flex-col task-card-item",
                    task.completed && "opacity-60 grayscale scale-95"
                  )}
                  style={{ backgroundColor: task.color }}
                  onClick={() => onSelectTask(task)}
                >
                  <CardContent className="p-3 h-full flex flex-col text-white relative">
                    <div className="flex justify-between items-start mb-2 gap-1">
                      <div className="bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                        <GripVertical className="w-2.5 h-2.5 opacity-50" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">
                          {task.startTime}
                        </span>
                      </div>
                      <div className="flex gap-0.5 items-center">
                        {!task.completed && !isShort && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                            onClick={(e) => { e.stopPropagation(); onStartFocus(task); }}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-6 w-6 rounded-full transition-colors",
                            task.completed ? "bg-white text-primary" : "text-white/50 hover:text-white hover:bg-white/20"
                          )}
                          onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                        >
                          {task.completed ? <CheckCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-white/50 hover:text-white hover:bg-destructive/80 rounded-full transition-colors z-[40]"
                          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <h4 className={cn(
                        "text-[10px] font-black truncate leading-tight",
                        task.completed && "line-through opacity-50"
                      )}>
                        {task.title}
                      </h4>
                      {!isShort && <p className="text-[7px] font-bold uppercase opacity-60 tracking-[0.1em]">{task.parentCategory}</p>}
                    </div>

                    {!isShort && (
                      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                        {task.subtasks.map((sub) => (
                          <div 
                            key={sub.id} 
                            className="flex items-center gap-2 group/sub cursor-pointer"
                            onClick={(e) => handleToggleSubtask(e, task, sub.id)}
                          >
                            <div className={cn(
                              "w-3 h-3 rounded-md border border-white/40 flex items-center justify-center shrink-0 transition-colors",
                              sub.completed ? "bg-white border-white" : "hover:border-white"
                            )}>
                              {sub.completed && <CheckCircle2 className="w-2.5 h-2.5 text-current" style={{ color: task.color }} />}
                            </div>
                            <span className={cn(
                              "text-[8px] font-bold truncate leading-none",
                              sub.completed ? "line-through opacity-40" : "opacity-90"
                            )}>
                              {sub.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2">
                       <div className="flex items-center gap-1">
                          <div className="h-0.5 w-8 bg-black/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white/60 transition-all duration-500" 
                              style={{ width: `${task.subtasks.length > 0 ? (completedSubs / task.subtasks.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[7px] font-black opacity-40">{completedSubs}/{task.subtasks.length}</span>
                       </div>
                       <span className="text-[8px] font-black uppercase opacity-40">{task.duration}m</span>
                    </div>

                    {!task.completed && (
                      <div className="absolute bottom-0 left-0 h-1 bg-black/5 w-full overflow-hidden">
                        <div className="h-full bg-white/20 animate-shimmer" style={{ width: '100%' }} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="w-1 h-1 rounded-full bg-primary/30" />
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">
          Toca el horario para ajustar jornada • Arrastra para acomodar bloques
        </p>
        <div className="w-1 h-1 rounded-full bg-primary/30" />
      </div>
    </div>
  );
};
