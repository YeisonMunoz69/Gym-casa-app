const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

/** Día de la semana "de hoy" (0=Domingo...6=Sábado, igual que Date.getDay())
 *  calculado siempre en la zona horaria de Colombia (America/Bogota).
 *
 *  App de uso personal/familiar en Colombia — no hay selector de región.
 *  Usar Date.getDay() directo es incorrecto: ese método usa la zona horaria
 *  configurada en el dispositivo, no la de Colombia. Si el dispositivo tiene
 *  mal configurada la zona (o el reloj está cerca de la medianoche UTC, que
 *  cae a las 7pm en Bogotá por el offset de -5h), Date.getDay() puede
 *  devolver el día siguiente aunque en Colombia todavía sea el día anterior.
 *  Intl.DateTimeFormat con `timeZone` fijo calcula el día real en Bogotá
 *  sin depender de la configuración del dispositivo. */
export function getTodayWeekdayBogota(): number {
  const shortDay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
  }).format(new Date())

  return WEEKDAY_INDEX[shortDay] ?? new Date().getDay()
}
