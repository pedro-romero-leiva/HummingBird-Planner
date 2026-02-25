
import { Task } from '@/types/task';

/**
 * Extrae eventos de un feed público de Google Calendar (.ics)
 * sin necesidad de API Key, procesando el texto iCal.
 */
export async function fetchPublicCalendarEvents(calendarId: string): Promise<Task[]> {
  try {
    // Formatear la URL del feed iCal público
    const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
    
    const response = await fetch(icalUrl);
    if (!response.ok) throw new Error('No se pudo acceder al calendario. Asegúrate de que sea público.');

    const icsText = await response.text();
    
    // Parseo básico de VEVENTs (Formato: BEGIN:VEVENT ... END:VEVENT)
    const events: Task[] = [];
    const veventBlocks = icsText.split('BEGIN:VEVENT');
    veventBlocks.shift(); // Eliminar el header del archivo

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0].replace(/-/g, '');

    veventBlocks.forEach((block) => {
      const summaryMatch = block.match(/SUMMARY:(.*)/);
      const dtStartMatch = block.match(/DTSTART(?:;VALUE=DATE|;TZID=.*)?:(\d{8}T?\d{0,6}Z?)/);
      const dtEndMatch = block.match(/DTEND(?:;VALUE=DATE|;TZID=.*)?:(\d{8}T?\d{0,6}Z?)/);

      if (summaryMatch && dtStartMatch && dtEndMatch) {
        const title = summaryMatch[1].trim();
        const startRaw = dtStartMatch[1];
        const endRaw = dtEndMatch[1];

        // Solo procesar si es de "hoy" (comparación básica de fecha YYYYMMDD)
        if (startRaw.startsWith(todayStr)) {
          // Extraer horas y minutos (Formato esperado: YYYYMMDDTHHMMSSZ)
          const startH = parseInt(startRaw.substring(9, 11));
          const startM = parseInt(startRaw.substring(11, 13));
          const endH = parseInt(endRaw.substring(9, 11));
          const endM = parseInt(endRaw.substring(11, 13));

          // Ajuste básico de zona horaria (Google ICS suele venir en UTC 'Z')
          // Para este prototipo, restamos 6 horas (Costa Rica UTC-6) si detectamos 'Z'
          let localStartH = startH;
          let localEndH = endH;
          if (startRaw.endsWith('Z')) {
            localStartH = (startH - 6 + 24) % 24;
            localEndH = (endH - 6 + 24) % 24;
          }

          const duration = (localEndH * 60 + endM) - (localStartH * 60 + startM);
          const startTime = `${String(localStartH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

          events.push({
            id: `gcal-${Math.random().toString(36).substr(2, 9)}`,
            title: title || 'Bloque Ocupado (Busy)',
            duration: duration > 0 ? duration : 30,
            startTime,
            completed: false,
            parentCategory: 'Reuniones',
            color: '#3495C0',
            createdAt: Date.now(),
            date: todayStr,
            subtasks: []
          });
        }
      }
    });

    return events;
  } catch (error) {
    console.error('Error fetching calendar:', error);
    throw error;
  }
}
