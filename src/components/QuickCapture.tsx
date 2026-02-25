
"use client"

import React, { useState } from 'react';
import { NewTask, Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Send, Timer, CalendarDays } from 'lucide-react';

interface QuickCaptureProps {
  onAddTask: (task: NewTask, forTomorrow?: boolean) => void;
  categories: string[];
  tasks: Task[];
}

export const QuickCapture: React.FC<QuickCaptureProps> = ({ onAddTask, categories }) => {
  const [title, setTitle] = useState('');
  const [durHours, setDurHours] = useState('1');
  const [durMinutes, setDurMinutes] = useState('0');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSubmit = (e?: React.FormEvent, forTomorrow: boolean = false) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;
    
    const h = parseInt(durHours) || 0;
    const m = parseInt(durMinutes) || 0;
    const totalMinutes = (h * 60) + m;
    
    if (totalMinutes <= 0) return;

    const finalCategory = showCustom ? (customCategory.trim() || 'General') : category;
    
    const colors = [
      '#3495C0', '#66CCBD', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#EC4899', '#10B981', '#6366F1'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    onAddTask({
      title: title.trim(),
      duration: totalMinutes,
      parentCategory: finalCategory,
      color: color,
    }, forTomorrow);
    
    setTitle('');
    setShowCustom(false);
    setCustomCategory('');
    setDurHours('1');
    setDurMinutes('0');
  };

  return (
    <div className="w-full max-w-4xl quick-capture-box">
      <form onSubmit={(e) => handleSubmit(e)} className="bg-white border-2 border-primary/10 shadow-xl rounded-[2.5rem] p-6 md:p-8 space-y-6">
        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Nuevo Enfoque</label>
          <Input
            placeholder="¿En qué vas a trabajar?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl md:text-2xl h-12 border-none bg-transparent focus-visible:ring-0 text-center placeholder:text-muted-foreground/20 font-black"
            autoFocus
          />
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-dashed">
          <div className="flex items-center gap-3 min-w-[300px]">
            <div className="flex items-center gap-6 bg-secondary/40 px-8 py-2.5 rounded-2xl border-2 border-transparent focus-within:border-primary/20 w-full justify-center">
              <Timer className="w-4 h-4 text-primary/60" />
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  value={durHours}
                  onChange={(e) => setDurHours(e.target.value)}
                  className="bg-transparent w-10 text-lg font-black focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase ml-1">h</span>
              </div>
              <span className="text-muted-foreground/20 font-black text-lg">:</span>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durMinutes}
                  onChange={(e) => setDurMinutes(e.target.value)}
                  className="bg-transparent w-10 text-lg font-black focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase ml-1">m</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showCustom ? (
              <Select value={category} onValueChange={(val) => {
                if (val === 'new') setShowCustom(true);
                else setCategory(val);
              }}>
                <SelectTrigger className="h-10 rounded-2xl bg-secondary/40 border-none text-[10px] font-black px-5 min-w-[140px] uppercase shadow-sm">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-[10px] font-black uppercase">{cat}</SelectItem>
                  ))}
                  <SelectItem value="new" className="text-primary font-black text-[10px] uppercase">+ Nueva</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Categoría..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="h-10 w-32 rounded-2xl text-[10px] font-black bg-secondary/40 border-none uppercase shadow-sm"
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowCustom(false)} className="h-8 w-8 rounded-full">X</Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={() => handleSubmit(undefined, true)}
              className="rounded-2xl h-10 px-5 font-black uppercase border-2 text-[10px] hover:bg-secondary/20"
              disabled={!title.trim()}
            >
              <CalendarDays className="w-3.5 h-3.5 mr-2 text-accent" />
              Para Mañana
            </Button>

            <Button 
              type="submit" 
              className="rounded-2xl h-10 px-8 font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary text-white text-[10px]"
              disabled={!title.trim()}
            >
              Hoy
              <Send className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
