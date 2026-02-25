
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Task, NewTask } from '@/types/task';
import { QuickCapture } from '@/components/QuickCapture';
import { TaskTimeline } from '@/components/TaskTimeline';
import { TaskDetail } from '@/components/TaskDetail';
import { FocusTimer } from '@/components/FocusTimer';
import { FloatingTimeline } from '@/components/FloatingTimeline';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, ListTodo, Layers, Calendar as CalendarIcon, Loader2, MonitorPlay, Trash2, Settings, Plus, X as CloseIcon, Palette, Upload, Code, Coffee, Utensils, Settings2, History, ArrowRight, Share2, ClipboardCheck, ClipboardPaste } from 'lucide-react';
import { exportTasksToCSV } from '@/lib/export';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchPublicCalendarEvents } from '@/app/actions/calendar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_CATEGORIES = ['General', 'Trabajo', 'Personal', 'Focus', 'Reuniones'];

const CSS_TEMPLATE = `/* 
  PLANTILLA DE ESTILO AVANZADA - Humming-Bird Planner 
  Usa esta guía para personalizar cada rincón de tu planificador.
*/

:root {
  /* 1. COLORES GLOBALES (Formato HSL) */
  --background: 197 33% 94%;
  --foreground: 199 60% 10%;
  --primary: 199 57% 48%;
  --primary-foreground: 0 0% 100%;
  --accent: 172 50% 60%;
  --accent-foreground: 199 60% 10%;
  --secondary: 197 20% 88%;
  --muted: 197 20% 88%;
  --muted-foreground: 199 20% 45%;
  --border: 199 20% 85%;
  --radius: 1rem;
}

/* 2. CAJA DE "QUÉ CHAMBEO" (QUICK CAPTURE) */
.quick-capture-box {
  /* background: white !important; */
  /* border: 3px solid hsl(var(--primary)) !important; */
  /* box-shadow: 0 20px 40px -20px rgba(0,0,0,0.1) !important; */
}

/* 3. ITINERARIO / LÍNEA DE TIEMPO (TIMELINE) */
.timeline-box {
  /* border-radius: 3rem !important; */
  /* background: white !important; */
}

.timeline-grid {
  /* Personaliza las líneas de la cuadrícula */
  /* background-image: linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px) !important; */
}

/* 4. BANCO DE TAREAS (BACKLOGS) */
.backlog-box {
  /* background: hsl(var(--secondary) / 0.2) !important; */
  /* border-radius: 2rem !important; */
}

/* 5. TARJETAS DE TAREA (TASK CARDS) */
.task-card-item {
  /* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; */
}

.task-card-item:hover {
  /* transform: scale(1.02) translateY(-2px) !important; */
  /* box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1) !important; */
}

/* 6. MODALES Y DETALLES */
.task-detail-dialog {
  /* background: #fdfdfd !important; */
}

/* Ejemplo: Cambiar el fondo del cuerpo */
body {
  /* background-image: radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.05) 1px, transparent 0); */
  /* background-size: 40px 40px; */
}`;

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userCategories, setUserCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPiPOpen, setIsPiPOpen] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [pipWindowInstance, setPipWindowInstance] = useState<any>(null);
  const [workHours, setWorkHours] = useState({ start: 8, end: 19 });
  const [customCSS, setCustomCSS] = useState('');
  const [isRoutineActive, setIsRoutineActive] = useState(false);
  const [transferCode, setTransferCode] = useState('');
  const { toast } = useToast();

  const getDateString = (offset: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const todayStr = useMemo(() => getDateString(0), []);
  const yesterdayStr = useMemo(() => getDateString(-1), []);
  const tomorrowStr = useMemo(() => getDateString(1), []);

  useEffect(() => {
    const savedTasks = localStorage.getItem('tiempodiario_v7_tasks');
    const savedUrl = localStorage.getItem('tiempodiario_gcal_url');
    const savedHours = localStorage.getItem('tiempodiario_work_hours');
    const savedCats = localStorage.getItem('tiempodiario_user_categories');
    const savedCSS = localStorage.getItem('tiempodiario_custom_css');
    const savedRoutine = localStorage.getItem('tiempodiario_routine_active') === 'true';
    
    let currentTasks: Task[] = [];
    if (savedTasks) {
      try {
        currentTasks = JSON.parse(savedTasks);
        const allowedDates = [yesterdayStr, todayStr, tomorrowStr];
        currentTasks = currentTasks.filter(t => allowedDates.includes(t.date));
        setTasks(currentTasks);
      } catch (e) {
        console.error("Error al cargar tareas", e);
      }
    }

    if (savedUrl) setCalendarUrl(savedUrl);
    if (savedHours) {
      try {
        setWorkHours(JSON.parse(savedHours));
      } catch (e) {
        console.error("Error al cargar horas", e);
      }
    }
    if (savedCats) {
      try {
        setUserCategories(JSON.parse(savedCats));
      } catch (e) {
        console.error("Error al cargar categorías", e);
      }
    }
    if (savedCSS) setCustomCSS(savedCSS);
    
    setIsRoutineActive(savedRoutine);

    if (savedRoutine) {
      const lastLoad = localStorage.getItem('tiempodiario_last_routine_date');
      if (lastLoad !== todayStr) {
        const routine: Task[] = [
          { id: Math.random().toString(36).substr(2, 9), title: "Almuerzo", duration: 60, completed: false, parentCategory: "Personal", color: "#F59E0B", createdAt: Date.now(), date: todayStr, subtasks: [] },
          { id: Math.random().toString(36).substr(2, 9), title: "Café", duration: 15, completed: false, parentCategory: "Personal", color: "#8B5CF6", createdAt: Date.now(), date: todayStr, subtasks: [] },
          { id: Math.random().toString(36).substr(2, 9), title: "Café", duration: 15, completed: false, parentCategory: "Personal", color: "#8B5CF6", createdAt: Date.now(), date: todayStr, subtasks: [] },
        ];
        
        setTasks(prev => [...prev, ...routine]);
        localStorage.setItem('tiempodiario_last_routine_date', todayStr);
        
        setTimeout(() => {
          toast({ title: "Rutina diaria cargada", description: "Se han añadido tus bloques de almuerzo y café para hoy." });
        }, 100);
      }
    }

    return () => {
      if (pipWindowInstance) pipWindowInstance.close();
    };
  }, [yesterdayStr, todayStr, tomorrowStr, toast]);

  useEffect(() => {
    localStorage.setItem('tiempodiario_v7_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tiempodiario_work_hours', JSON.stringify(workHours));
  }, [workHours]);

  useEffect(() => {
    localStorage.setItem('tiempodiario_user_categories', JSON.stringify(userCategories));
  }, [userCategories]);

  useEffect(() => {
    localStorage.setItem('tiempodiario_routine_active', String(isRoutineActive));
  }, [isRoutineActive]);

  useEffect(() => {
    const styleId = 'custom-app-theme';
    if (customCSS) {
      localStorage.setItem('tiempodiario_custom_css', customCSS);
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.textContent = customCSS;
      } else {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = customCSS;
        document.head.appendChild(style);
      }
    } else {
      localStorage.removeItem('tiempodiario_custom_css');
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();
    }
  }, [customCSS]);

  const categories = useMemo(() => {
    const cats = new Set(userCategories);
    tasks.forEach(t => cats.add(t.parentCategory));
    return Array.from(cats);
  }, [tasks, userCategories]);

  const backlogToday = useMemo(() => tasks.filter(t => t.date === todayStr && !t.startTime), [tasks, todayStr]);
  const backlogYesterdayPendings = useMemo(() => tasks.filter(t => t.date === yesterdayStr && !t.completed), [tasks, yesterdayStr]);
  const backlogTomorrow = useMemo(() => tasks.filter(t => t.date === tomorrowStr), [tasks, tomorrowStr]);

  const handleAddTask = (newTask: NewTask, forTomorrow: boolean = false) => {
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      createdAt: Date.now(),
      date: forTomorrow ? tomorrowStr : todayStr,
      subtasks: [],
    };
    setTasks((prev) => [...prev, task]);
    setTimeout(() => {
      toast({ 
        title: forTomorrow ? "Agendado para mañana" : "Bloque creado", 
        description: forTomorrow ? "Disponible en el banco de mañana." : "Disponible en el banco de hoy." 
      });
    }, 0);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
    if (activeFocusTask?.id === updatedTask.id) setActiveFocusTask(updatedTask);
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setIsDetailOpen(false);
      setSelectedTask(null);
    }
    setTimeout(() => {
      toast({ variant: "destructive", title: "Bloque eliminado" });
    }, 0);
  };

  const handleMoveToTomorrow = (task: Task) => {
    handleUpdateTask({ ...task, date: tomorrowStr, startTime: undefined });
    setIsDetailOpen(false);
    setTimeout(() => {
      toast({ title: "Movida a mañana", description: "La tarea y sus subtareas se han guardado para mañana." });
    }, 0);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    if (userCategories.includes(newCatName.trim())) {
      setTimeout(() => {
        toast({ variant: "destructive", title: "La categoría ya existe" });
      }, 0);
      return;
    }
    setUserCategories(prev => [...prev, newCatName.trim()]);
    setNewCatName('');
    setTimeout(() => {
      toast({ title: "Categoría añadida" });
    }, 0);
  };

  const handleDeleteCategory = (cat: string) => {
    setUserCategories(prev => prev.filter(c => c !== cat));
    setTimeout(() => {
      toast({ title: "Categoría eliminada" });
    }, 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCustomCSS(content);
      setTimeout(() => {
        toast({ title: "Tema aplicado", description: "El diseño se ha actualizado correctamente." });
      }, 0);
    };
    reader.readAsText(file);
  };

  const handleGoogleSync = async () => {
    let finalId = calendarUrl.trim();
    if (finalId.includes('src=')) {
      const match = finalId.match(/src=([^&]+)/);
      if (match) finalId = decodeURIComponent(match[1]);
    }
    if (!finalId) {
      setTimeout(() => {
        toast({ variant: "destructive", title: "ID de calendario inválido" });
      }, 0);
      return;
    }
    setIsSyncing(true);
    localStorage.setItem('tiempodiario_gcal_url', calendarUrl);
    try {
      const importedTasks = await fetchPublicCalendarEvents(finalId);
      if (importedTasks.length === 0) {
        toast({ title: "Sin eventos", description: "No hay eventos públicos hoy." });
      } else {
        setTasks(prev => {
          const formattedImported = importedTasks.map(t => ({ ...t, date: todayStr }));
          const existingKeys = new Set(prev.map(t => t.title + t.startTime + t.date));
          const newOnes = formattedImported.filter(t => !existingKeys.has(t.title + t.startTime + todayStr));
          return [...prev, ...newOnes];
        });
        toast({ title: "¡Sincronizado!", description: `${importedTasks.length} eventos añadidos.` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTogglePiP = async () => {
    if (pipWindowInstance) {
      pipWindowInstance.close();
      setPipWindowInstance(null);
      setIsPiPOpen(false);
      return;
    }

    const anyWindow = window as any;
    const isSupported = !!anyWindow.documentPictureInPicture;

    if (!isSupported) {
      setIsPiPOpen(!isPiPOpen);
      return;
    }

    try {
      const pipWindow = await anyWindow.documentPictureInPicture.requestWindow({
        width: 380,
        height: 320,
      });

      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = (styleSheet as any).href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      if (customCSS) {
        const style = document.createElement('style');
        style.textContent = customCSS;
        pipWindow.document.head.appendChild(style);
      }

      const fonts = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
      fonts.forEach(font => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = (font as HTMLLinkElement).href;
        pipWindow.document.head.appendChild(link);
      });

      pipWindow.document.body.style.backgroundColor = '#FFFFFF';
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.overflow = 'hidden';

      const pipRoot = pipWindow.document.createElement('div');
      pipRoot.id = 'pip-root';
      pipRoot.style.width = '100vw';
      pipRoot.style.height = '100vh';
      pipRoot.style.backgroundColor = '#FFFFFF';
      pipWindow.document.body.appendChild(pipRoot);

      pipWindow.addEventListener('pagehide', () => {
        setPipWindowInstance(null);
        setIsPiPOpen(false);
      });

      setPipWindowInstance(pipWindow);
      setIsPiPOpen(true);
    } catch (error: any) {
      console.warn('PiP fallido:', error);
      setIsPiPOpen(true);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSS_TEMPLATE], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hummingbird-planner-original.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDataCode = () => {
    const data = {
      tasks,
      categories: userCategories,
      hours: workHours,
      routine: isRoutineActive
    };
    try {
      const code = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data))));
      setTransferCode(code);
      navigator.clipboard.writeText(code);
      toast({ title: "¡Código Copiado!", description: "Pégalo en otra computadora para importar tus datos." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al exportar", description: "No se pudo generar el código." });
    }
  };

  const handleImportDataCode = () => {
    if (!transferCode.trim()) return;
    try {
      const decoded = new TextDecoder().decode(Uint8Array.from(atob(transferCode), c => c.charCodeAt(0)));
      const data = JSON.parse(decoded);
      
      if (data.tasks) setTasks(data.tasks);
      if (data.categories) setUserCategories(data.categories);
      if (data.hours) setWorkHours(data.hours);
      if (data.routine !== undefined) setIsRoutineActive(data.routine);
      
      setTransferCode('');
      toast({ title: "Datos Importados", description: "Se han actualizado tus bloques y configuración." });
    } catch (e) {
      toast({ variant: "destructive", title: "Código Inválido", description: "Verifica que el código de transferencia sea correcto." });
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-primary/10 flex flex-col items-center py-10 px-6">
      <div className="w-full max-w-7xl space-y-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary">
                Humming-Bird <span className="text-accent">Planner</span>
              </h1>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">A day tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={isPiPOpen ? "default" : "outline"} 
              size="sm" 
              className="h-9 rounded-xl font-black text-[9px] uppercase tracking-widest border-2"
              onClick={handleTogglePiP}
            >
              <MonitorPlay className="w-3.5 h-3.5 mr-2" />
              Live PiP
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl font-black text-[9px] uppercase tracking-widest border-2">
                  <CalendarIcon className="w-3.5 h-3.5 mr-2 text-primary" />
                  Link Google
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl p-5 border-2 shadow-2xl space-y-4">
                <div className="space-y-3">
                  <Input 
                    placeholder="Enlace o ID de calendario..."
                    value={calendarUrl}
                    onChange={(e) => setCalendarUrl(e.target.value)}
                    className="text-[10px] h-9 rounded-lg bg-secondary/20 border-none"
                  />
                  <Button 
                    className="w-full h-9 rounded-lg text-[9px] font-black uppercase tracking-widest"
                    onClick={handleGoogleSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? <Loader2 className="animate-spin w-3 h-3 mr-2" /> : 'Sincronizar'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 rounded-xl font-black text-[9px] uppercase tracking-widest border-2"
              onClick={() => exportTasksToCSV(tasks)}
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              CSV
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-3xl p-0 border-2 shadow-2xl overflow-hidden">
                <Tabs defaultValue="categories" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 rounded-none bg-secondary/20 h-10">
                    <TabsTrigger value="categories" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-none">
                      <Layers className="w-3 h-3 mr-1" />
                      Cats
                    </TabsTrigger>
                    <TabsTrigger value="theme" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-none">
                      <Palette className="w-3 h-3 mr-1" />
                      Tema
                    </TabsTrigger>
                    <TabsTrigger value="config" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-none">
                      <Settings2 className="w-3 h-3 mr-1" />
                      Ajustes
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="p-6">
                    <TabsContent value="categories" className="mt-0 space-y-4">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Nueva..."
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="text-[10px] h-8 rounded-lg bg-secondary/20 border-none"
                          />
                          <Button size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={handleAddCategory}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {userCategories.map(cat => (
                            <div key={cat} className="flex items-center justify-between group bg-secondary/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-primary/10">
                              <span className="text-[9px] font-black uppercase tracking-tight text-muted-foreground">{cat}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 rounded-md text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteCategory(cat)}
                              >
                                <CloseIcon className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="theme" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-col items-center gap-4 py-2">
                          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                            <Code className="w-6 h-6 text-accent" />
                          </div>
                          <div className="text-center space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Inyección CSS</h4>
                            <p className="text-[8px] font-bold text-muted-foreground leading-relaxed uppercase opacity-60">Sube tu archivo .css para personalizar la app.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            variant="outline" 
                            className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border-dashed border-2 bg-secondary/10 relative overflow-hidden group"
                            asChild
                          >
                            <label className="cursor-pointer">
                              <Upload className="w-3.5 h-3.5 mr-2" />
                              Subir CSS
                              <input type="file" accept=".css" className="hidden" onChange={handleFileUpload} />
                            </label>
                          </Button>

                          <Button 
                            variant="ghost" 
                            className="h-8 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
                            onClick={downloadTemplate}
                          >
                            Descargar Plantilla Original
                          </Button>
                        </div>

                        {customCSS && (
                          <div className="flex items-center justify-between pt-2 border-t border-dashed">
                             <span className="text-[8px] font-black uppercase text-accent">Tema Activo</span>
                             <Button 
                               variant="ghost" 
                               className="h-6 text-[8px] font-black text-destructive uppercase tracking-widest"
                               onClick={() => setCustomCSS('')}
                             >
                               Borrar Tema
                             </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="config" className="mt-0 space-y-6">
                      <div className="space-y-5">
                        <div className="bg-secondary/10 p-5 rounded-2xl border-2 border-dashed border-primary/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-[9px] font-black uppercase tracking-tight">Rutina Automática</Label>
                              <p className="text-[7px] font-bold text-muted-foreground uppercase">Carga diaria: 1 Almuerzo, 2 Cafés</p>
                            </div>
                            <Switch 
                              checked={isRoutineActive} 
                              onCheckedChange={setIsRoutineActive}
                            />
                          </div>

                          <div className="flex justify-center gap-4 pt-2">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Utensils className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-[7px] font-black text-muted-foreground uppercase">1 Almuerzo</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Coffee className="w-4 h-4 text-accent" />
                              </div>
                              <span className="text-[7px] font-black text-muted-foreground uppercase">2 Cafés</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-dashed">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Transferir Datos</h4>
                          <div className="space-y-2">
                            <Textarea 
                              placeholder="Pega aquí tu código de transferencia..."
                              value={transferCode}
                              onChange={(e) => setTransferCode(e.target.value)}
                              className="text-[9px] font-mono h-20 rounded-xl bg-secondary/20 border-none resize-none focus-visible:ring-primary/20"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleExportDataCode}
                                className="text-[8px] font-black uppercase tracking-widest h-8 rounded-lg border-2"
                              >
                                <Share2 className="w-3 h-3 mr-2 text-primary" />
                                Exportar
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={handleImportDataCode}
                                className="text-[8px] font-black uppercase tracking-widest h-8 rounded-lg"
                                disabled={!transferCode.trim()}
                              >
                                <ClipboardPaste className="w-3 h-3 mr-2" />
                                Importar
                              </Button>
                            </div>
                          </div>
                          <p className="text-[7px] font-bold text-muted-foreground/50 text-center uppercase">Usa este código para mover tus bloques de una PC a otra.</p>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <section className="flex flex-col items-center">
          <QuickCapture onAddTask={handleAddTask} categories={categories} tasks={tasks} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-3 space-y-8">
            <div className="space-y-6 backlog-box">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-3.5 h-3.5 text-primary" />
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Banco de Hoy</h3>
                </div>
                <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{backlogToday.length}</span>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {backlogToday.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-3xl border-2 border-dashed border-primary/5 flex flex-col items-center gap-3">
                    <Layers className="w-4 h-4 text-muted-foreground/30" />
                    <p className="text-[8px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">Añade tareas para hoy</p>
                  </div>
                ) : (
                  backlogToday.map(task => (
                    <TaskCard key={task.id} task={task} onSelect={setSelectedTask} onOpenDetail={setIsDetailOpen} onDelete={handleDeleteTask} />
                  ))
                )}
              </div>
            </div>

            {backlogYesterdayPendings.length > 0 && (
              <div className="space-y-6 backlog-box">
                <Separator className="bg-destructive/10" />
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-destructive" />
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-destructive/60">Pendientes de Ayer</h3>
                  </div>
                  <span className="text-[9px] font-black text-destructive bg-destructive/5 px-2 py-0.5 rounded-full">{backlogYesterdayPendings.length}</span>
                </div>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar p-1">
                  {backlogYesterdayPendings.map(task => (
                    <div 
                      key={task.id}
                      className="group relative"
                    >
                      <TaskCard task={task} onSelect={setSelectedTask} onOpenDetail={setIsDetailOpen} onDelete={handleDeleteTask} />
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-6 rounded-full text-[8px] font-black uppercase shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleUpdateTask({ ...task, date: todayStr, startTime: undefined })}
                      >
                        Traer a Hoy
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6 backlog-box">
              <Separator className="bg-accent/10" />
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-accent/60">Agendado Mañana</h3>
                </div>
                <span className="text-[9px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-full">{backlogTomorrow.length}</span>
              </div>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {backlogTomorrow.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-accent/5 flex flex-col items-center gap-3">
                    <p className="text-[8px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">Nada planeado aún</p>
                  </div>
                ) : (
                  backlogTomorrow.map(task => (
                    <TaskCard key={task.id} task={task} onSelect={setSelectedTask} onOpenDetail={setIsDetailOpen} onDelete={handleDeleteTask} />
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9">
            <TaskTimeline 
              tasks={tasks.filter(t => t.date === todayStr)} 
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              onSelectTask={(task) => {
                setSelectedTask(task);
                setIsDetailOpen(true);
              }}
              onStartFocus={(task) => setActiveFocusTask(task)}
              startHour={workHours.start}
              endHour={workHours.end}
              onUpdateHours={(start, end) => setWorkHours({ start, end })}
            />
          </section>
        </div>
      </div>

      <TaskDetail 
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onMoveToTomorrow={handleMoveToTomorrow}
      />

      {activeFocusTask && (
        <FocusTimer 
          task={activeFocusTask} 
          onClose={() => setActiveFocusTask(null)}
          onComplete={(taskId) => {
            handleToggleComplete(taskId);
            setActiveFocusTask(null);
          }}
        />
      )}

      {isPiPOpen && (
        <FloatingTimeline 
          tasks={tasks.filter(t => t.date === todayStr)} 
          onClose={() => {
            if (pipWindowInstance) pipWindowInstance.close();
            setIsPiPOpen(false);
          }}
          onToggleComplete={handleToggleComplete}
          onUpdateTask={handleUpdateTask}
          externalWindow={pipWindowInstance}
        />
      )}

      <Toaster />
    </main>
  );
}

function TaskCard({ task, onSelect, onOpenDetail, onDelete }: { task: Task, onSelect: (t: Task) => void, onOpenDetail: (o: boolean) => void, onDelete: (id: string) => void }) {
  return (
    <Card 
      draggable 
      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
      className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-l-4 group task-card-item"
      style={{ borderLeftColor: task.color }}
    >
      <CardContent className="p-4 flex items-center justify-between gap-2" onClick={() => { onSelect(task); onOpenDetail(true); }}>
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-black truncate mb-1">{task.title}</h4>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-muted-foreground/60">{task.duration}m</span>
            <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">{task.parentCategory}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-destructive/40 hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
