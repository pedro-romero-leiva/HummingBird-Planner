
"use client"

import React, { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Play, Pause, RotateCcw, ChevronRight, Minimize2, Maximize2, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  task: Task;
  onClose: () => void;
  onComplete: (taskId: string) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ task, onClose, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(task.duration * 60);
  const [isActive, setIsActive] = useState(true);
  const [isMini, setIsMini] = useState(false);
  
  const totalSeconds = task.duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete(task.id);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, task.id, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMini) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] group animate-in slide-in-from-bottom-10">
        <Card className="bg-white/80 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-[1.5rem] w-[280px] overflow-hidden">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
               <svg className="absolute inset-0 w-full h-full -rotate-90 scale-90">
                <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-secondary" />
                <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={2 * Math.PI * 21} strokeDashoffset={2 * Math.PI * 21 * (1 - progress / 100)} strokeLinecap="round" className="text-primary transition-all duration-1000 ease-linear" />
              </svg>
              <Timer className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px] font-mono font-black text-primary">{formatTime(timeLeft)}</span>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => setIsMini(false)} className="h-5 w-5 rounded-full hover:bg-primary/10">
                    <Maximize2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-5 w-5 rounded-full hover:bg-destructive/10 text-destructive">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <h4 className="text-[10px] font-black truncate uppercase tracking-tight leading-none text-muted-foreground/80">{task.title}</h4>
            </div>

            <Button 
              size="icon" 
              className={cn(
                "h-8 w-8 rounded-full shrink-0 shadow-sm",
                isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary text-white"
              )}
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
          </CardContent>
          <div className="h-0.5 bg-secondary/50 w-full">
            <div className="h-full bg-primary transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-lg bg-card shadow-2xl overflow-hidden border-none rounded-[3rem]">
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 bg-primary/5 px-4 py-1.5 rounded-full">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Modo Enfoque</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMini(true)} className="rounded-full hover:bg-secondary">
              <Minimize2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <CardContent className="flex flex-col items-center pb-12">
          <div className="text-center mb-10 px-6">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3 opacity-60 text-primary">En progreso</h2>
            <h3 className="text-3xl font-black leading-tight">{task.title}</h3>
            <span className="inline-block mt-4 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-4 py-1 rounded-full">
              {task.parentCategory}
            </span>
          </div>
          
          <div className="relative w-72 h-72 mb-10 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary/30" />
              <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 130} strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)} strokeLinecap="round" className="text-primary transition-all duration-1000 ease-linear drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]" />
            </svg>
            
            <div className="flex flex-col items-center">
              <span className="text-6xl font-mono font-black tracking-tighter text-primary">{formatTime(timeLeft)}</span>
              {isActive && (
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">Enfocado</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => {
                setTimeLeft(totalSeconds);
                setIsActive(false);
              }}
              className="rounded-full w-14 h-14 p-0 border-2 hover:bg-secondary/50"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            
            <Button 
              size="lg" 
              className={cn(
                "rounded-full w-20 h-20 p-0 shadow-2xl transition-all scale-110",
                isActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
              )}
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1.5" />}
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => onComplete(task.id)}
              className="rounded-full h-14 px-8 font-black uppercase text-[10px] tracking-widest border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
            >
              Finalizar
            </Button>
          </div>
          
          <div className="w-full mt-14 px-12">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              <span>{Math.round(progress)}% Completado</span>
              <span>{task.duration}m Total</span>
            </div>
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
               <div className="h-full bg-primary transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
