
"use client"

import React, { useState, useEffect } from 'react';
import { Task, SubTask } from '@/types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Clock, Timer, Layers, ChevronRight, ArrowRight } from 'lucide-react';

interface TaskDetailProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveToTomorrow: (task: Task) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, isOpen, onClose, onUpdate, onDelete, onMoveToTomorrow }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [editH, setEditH] = useState('0');
  const [editM, setEditM] = useState('0');
  const [startH, setStartH] = useState('08');
  const [startM, setStartM] = useState('00');

  useEffect(() => {
    if (task) {
      setEditH(Math.floor(task.duration / 60).toString());
      setEditM((task.duration % 60).toString());
      if (task.startTime) {
        const [h, m] = task.startTime.split(':');
        setStartH(h);
        setStartM(m);
      } else {
        setStartH('08');
        setStartM('00');
      }
    }
  }, [task]);

  if (!task) return null;

  const handleUpdateDuration = (h: string, m: string) => {
    const hours = Math.max(0, parseInt(h) || 0);
    const minutes = Math.max(0, Math.min(59, parseInt(m) || 0));
    setEditH(hours.toString());
    setEditM(minutes.toString());
    const total = hours * 60 + minutes;
    if (total > 0) {
      onUpdate({ ...task, duration: total });
    }
  };

  const handleUpdateStartTime = (h: string, m: string) => {
    let hour = Math.max(0, Math.min(23, parseInt(h) || 0));
    let minute = Math.max(0, Math.min(59, parseInt(m) || 0));

    const formattedH = String(hour).padStart(2, '0');
    const formattedM = String(minute).padStart(2, '0');
    
    setStartH(formattedH);
    setStartM(formattedM);
    
    onUpdate({ ...task, startTime: `${formattedH}:${formattedM}` });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    const sub: SubTask = {
      id: Math.random().toString(36).substr(2, 9),
      text: newSubtask.trim(),
      completed: false
    };

    onUpdate({
      ...task,
      subtasks: [...task.subtasks, sub]
    });
    setNewSubtask('');
  };

  const toggleSubtask = (subId: string) => {
    const updatedSubtasks = task.subtasks.map(sub => {
      if (sub.id === subId) {
        const completed = !sub.completed;
        return {
          ...sub,
          completed,
          completedAt: completed ? Date.now() : undefined
        };
      }
      return sub;
    });
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const deleteSubtask = (subId: string) => {
    onUpdate({
      ...task,
      subtasks: task.subtasks.filter(s => s.id !== subId)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-[#FDFDFD]">
        <div className="bg-primary p-8 text-white">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{task.parentCategory}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onMoveToTomorrow(task)}
                  className="text-white hover:bg-white/10 font-black uppercase text-[9px] tracking-widest h-8 rounded-full"
                >
                  <ArrowRight className="w-3.5 h-3.5 mr-2" />
                  Mover a Mañana
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(task.id)}
                  className="text-white hover:bg-destructive/80 font-black uppercase text-[9px] tracking-widest h-8 rounded-full"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
            <DialogTitle className="text-3xl font-black leading-tight drop-shadow-sm">{task.title}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Timer className="w-3 h-3 text-primary" /> Duración
              </Label>
              <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-3xl border-2 border-transparent focus-within:border-primary/20 transition-all">
                <div className="flex flex-col items-center flex-1">
                  <Input 
                    type="number" 
                    value={editH} 
                    onChange={(e) => handleUpdateDuration(e.target.value, editM)}
                    className="h-12 text-2xl font-black text-center border-none bg-transparent focus-visible:ring-0 p-0"
                  />
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Horas</span>
                </div>
                <span className="text-2xl font-black text-muted-foreground/30 mb-4">:</span>
                <div className="flex flex-col items-center flex-1">
                  <Input 
                    type="number" 
                    value={editM} 
                    onChange={(e) => handleUpdateDuration(editH, e.target.value)}
                    className="h-12 text-2xl font-black text-center border-none bg-transparent focus-visible:ring-0 p-0"
                  />
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Minutos</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3 text-accent" /> Inicio
              </Label>
              <div className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all ${task.startTime ? 'bg-accent/5 border-accent/20 focus-within:border-accent' : 'bg-secondary/10 border-dashed grayscale opacity-40'}`}>
                <div className="flex flex-col items-center flex-1">
                  <Input 
                    type="number" 
                    value={startH} 
                    disabled={!task.startTime}
                    onChange={(e) => handleUpdateStartTime(e.target.value, startM)}
                    className="h-12 text-2xl font-black text-center border-none bg-transparent focus-visible:ring-0 p-0"
                  />
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Hora</span>
                </div>
                <span className="text-2xl font-black text-muted-foreground/30 mb-4">:</span>
                <div className="flex flex-col items-center flex-1">
                  <Input 
                    type="number" 
                    value={startM} 
                    disabled={!task.startTime}
                    onChange={(e) => handleUpdateStartTime(startH, e.target.value)}
                    className="h-12 text-2xl font-black text-center border-none bg-transparent focus-visible:ring-0 p-0"
                  />
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pasos para completar</h4>
              <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full">
                {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length}
              </span>
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-3">
              <Input 
                placeholder="¿Qué sigue para completar esto?" 
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="text-sm rounded-2xl h-14 bg-secondary/20 border-none px-6 font-medium focus-visible:ring-primary/20"
              />
              <Button type="submit" size="icon" className="rounded-2xl h-14 w-14 shrink-0 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                <Plus className="w-6 h-6 text-white" />
              </Button>
            </form>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {task.subtasks.length === 0 ? (
                <div className="py-12 text-center bg-secondary/10 rounded-[2rem] border-2 border-dashed border-secondary/50 flex flex-col items-center gap-3">
                  <Plus className="w-6 h-6 text-muted-foreground/30" />
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Añade subtareas arriba</p>
                </div>
              ) : (
                task.subtasks.map((sub) => (
                  <div key={sub.id} className="group flex items-center justify-between gap-4 p-5 rounded-2xl border bg-white hover:border-primary/40 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={sub.completed} 
                        onCheckedChange={() => toggleSubtask(sub.id)}
                        className="rounded-lg w-7 h-7 border-2 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      />
                      <div className="flex flex-col">
                        <span className={`text-[13px] font-black ${sub.completed ? 'line-through text-muted-foreground opacity-50' : 'text-foreground'}`}>
                          {sub.text}
                        </span>
                        {sub.completedAt && (
                          <span className="text-[9px] text-accent flex items-center gap-1.5 font-black mt-1.5 uppercase tracking-tighter">
                            <ChevronRight className="w-3 h-3" />
                            Completado {new Date(sub.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => deleteSubtask(sub.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
