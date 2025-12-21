---
title: Wellbeing Guard (AHK v2)
description: Este script es una utilidad de bienestar digital diseñada para Windows, replicando las mejores características de salud de sistemas como GNOME (Linux) o Android. Su objetivo es proteger tu vista y tu postura sin interrumpir tu flujo de trabajo de manera molesta, pero asegurando que tomes los descansos necesarios.
pubDate: Dec 21 2025
---
# 🛡️ Wellbeing Guard (AHK v2)

> Tu guardián de salud digital invisible.

Este script es una utilidad de bienestar digital diseñada para **Windows**, replicando las mejores características de salud de sistemas como GNOME (Linux) o Android. Su objetivo es proteger tu vista y tu postura sin interrumpir tu flujo de trabajo de manera molesta, pero asegurando que tomes los descansos necesarios.

### 🌟 Características Principales

#### 1. ⏱️ Monitor de Tiempo de Pantalla (Screen Time)

- **Qué hace:** Rastrea silenciosamente cuánto tiempo real pasas usando la computadora cada día.
    
- **Inteligencia:** No cuenta el tiempo si dejaste la PC prendida y te fuiste. Solo suma segundos si detecta actividad (teclado/mouse) o si estás leyendo activamente (menos de 5 minutos de inactividad total).
    
- **Persistencia:** Guarda tu progreso diario en un archivo local (WellbeingStats.ini), por lo que si reinicias la PC, no pierdes tu cuenta del día.
    

#### 2. 👁️ Protector Visual (Regla 20-20-20)

- **Frecuencia:** Cada **20 minutos** de uso activo.
    
- **Acción:** Muestra una alerta suave recordándote mirar a un punto lejano (6 metros / 20 pies) durante 20 segundos.
    
- **Beneficio:** Previene la fatiga visual digital y la sequedad ocular.
    

#### 3. 🚶 Recordatorio de Movimiento

- **Frecuencia:** Cada **60 minutos** (1 hora).
    
- **Acción:** Te sugiere levantarte, estirar las piernas y caminar un poco.
    
- **Beneficio:** Combate el sedentarismo y problemas circulatorios derivados de estar sentado mucho tiempo.
    

#### 4. 🛑 Sistema Anti-Bloqueo Inteligente (Smart Keep-Awake)

- **El Problema:** Normalmente, si te alejas de la PC para cumplir con el ejercicio de caminar, Windows podría bloquearse o apagar la pantalla, interrumpiendo tu música o descargas.
    
- **La Solución:** Cuando salta una alerta de Wellbeing, el script activa un modo especial (ES_DISPLAY_REQUIRED) que **fuerza a la pantalla a mantenerse encendida**.
    
- **Regreso:** Al volver y dar clic en "Listo, continuar", el script devuelve el control de energía a Windows, permitiendo que se bloquee normalmente si vuelves a irte.
    

#### 5. 📊 Dashboard de Estadísticas

- **Interfaz:** Una ventana moderna y limpia (GUI) que muestra:
    
    - Tiempo total de hoy.
        
    - Barra de progreso (meta de 8 horas).
        
    - Estado de los próximos recordatorios.
        
- **Acceso:** Accesible desde el ícono en la bandeja del sistema (al lado del reloj).
    

#### 6. 🧠 Lógica de "No Molestar"

- El script respeta tu ausencia. Si detecta que no has tocado el mouse o teclado en el último minuto justo cuando iba a saltar una alerta, asume que no estás frente a la pantalla y **pospone la alerta** para no acumular ventanas molestas ni mantener la pantalla encendida innecesariamente.
    

---

### 🛠️ Resumen Técnico (Para el usuario avanzado)

- **Lenguaje:** AutoHotkey v2.0+
    
- **API Calls:** Utiliza DllCall("SetThreadExecutionState") para la gestión de energía.
    
- **Recursos:** Extremadamente ligero (~2-3 MB de RAM), no consume CPU mientras espera.
    
- **Portabilidad:** Es un solo archivo .ahk (o .exe si lo compilas), no requiere instalación.


``` ahkv2
#Requires AutoHotkey v2.0

#SingleInstance Force

Persistent

  

; ==============================================================================

; CONFIGURACIÓN Y VARIABLES GLOBALES

; ==============================================================================

global APP_NAME := "Wellbeing Guard"

global LOG_FILE := "WellbeingStats.ini"

global TODAY_DATE := FormatTime(, "yyyyMMdd")

  

; Tiempos en milisegundos

global EYE_INTERVAL  := 20 * 60 * 1000  ; 20 Minutos (Ojos)

global MOVE_INTERVAL := 60 * 60 * 1000  ; 60 Minutos (Cuerpo)

  

; Estado

global ScreenTimeSeconds := 0

global IsPaused := false

global AlertOpen := false ; Bandera para saber si hay una alerta activa

  

; Cargar datos previos

IniPath := A_ScriptDir "\" LOG_FILE

try {

    SavedTime := IniRead(IniPath, "DailyStats", TODAY_DATE, "0")

    ScreenTimeSeconds := Integer(SavedTime)

} catch {

    ScreenTimeSeconds := 0

}

  

; ==============================================================================

; TRAY MENU

; ==============================================================================

A_IconTip := APP_NAME " - Monitoreo Activo"

TraySetIcon("shell32.dll", 239) ; Icono de reloj/escudo

  

MainTray := A_TrayMenu

MainTray.Delete()

MainTray.Add("📊 Abrir Dashboard", ShowDashboard)

MainTray.Add("⏸️ Pausar/Reanudar", TogglePause)

MainTray.Add()

MainTray.Add("❌ Salir", ExitAppFunc)

MainTray.Default := "📊 Abrir Dashboard"

  

; Iniciar Timers

SetTimer(UpdateScreenTime, 1000)

SetTimer(CheckEyeAlert, EYE_INTERVAL)

SetTimer(CheckMoveAlert, MOVE_INTERVAL)

  

; Mostrar Dashboard al inicio

ShowDashboard()

  

return ; Fin sección auto-execute

  

; ==============================================================================

; GUI PRINCIPAL (DASHBOARD)

; ==============================================================================

ShowDashboard(*) {

    if WinExist(APP_NAME " Dashboard") {

        WinActivate(APP_NAME " Dashboard")

        return

    }

  

    global MyGui := Gui("+MinimizeBox", APP_NAME " Dashboard")

    MyGui.SetFont("s10", "Segoe UI")

    MyGui.Add("Text", "w350 Center vDateTitle", "Estadísticas para: " FormatTime(, "LongDate"))

    ; --- GRUPO TIEMPO ---

    MyGui.Add("GroupBox", "w370 h130 Section", "Tiempo de Pantalla Hoy")

    ; CORRECCIÓN AQUÍ: Usar SetFont antes del control

    MyGui.SetFont("s25 bold c0066cc")

    MyGui.Add("Text", "xs+10 ys+30 w350 Center vTimeDisplay", FormatSeconds(ScreenTimeSeconds))

    MyGui.SetFont("s10 norm cDefault") ; Restablecer fuente normal

    MyGui.Add("Progress", "xs+10 ys+90 w350 h20 c00cc66 vDayProgress", 0)

    ; --- GRUPO RECORDATORIOS ---

    MyGui.Add("GroupBox", "w370 h100 xs Section", "Próximos Descansos")

    MyGui.Add("Text", "xs+20 ys+30 w150 vNextEye", "👁️ Ojos: Calculando...")

    MyGui.Add("Text", "x+20 ys+30 w150 vNextMove", "🚶 Cuerpo: Calculando...")

    MyGui.Add("Button", "xs+135 ys+65 w100", "Ocultar").OnEvent("Click", (*) => MyGui.Destroy())

  

    MyGui.Show()

    UpdateDashboardUI()

}

  

UpdateDashboardUI() {

    try {

        if !IsSet(MyGui) || !WinExist(APP_NAME " Dashboard")

            return

        MyGui["TimeDisplay"].Text := FormatSeconds(ScreenTimeSeconds)

        ; Barra de progreso (Meta de 8 horas = 28800 segundos)

        percent := (ScreenTimeSeconds / 28800) * 100

        MyGui["DayProgress"].Value := percent

        if (IsPaused) {

            MyGui["NextEye"].Text := "👁️ Ojos: PAUSADO"

            MyGui["NextMove"].Text := "🚶 Cuerpo: PAUSADO"

        } else {

            MyGui["NextEye"].Text := "👁️ Ojos: Activo"

            MyGui["NextMove"].Text := "🚶 Cuerpo: Activo"

        }

    }

}

  

; ==============================================================================

; LÓGICA DE TIEMPO

; ==============================================================================

UpdateScreenTime() {

    if (IsPaused || AlertOpen)

        return

  

    ; Si el usuario no mueve el mouse/teclado por 5 min, no contamos

    if (A_TimeIdlePhysical > 300000)

        return

  

    global ScreenTimeSeconds += 1

    ; Guardar cada minuto

    if (Mod(ScreenTimeSeconds, 60) = 0)

        IniWrite(ScreenTimeSeconds, IniPath, "DailyStats", TODAY_DATE)

    UpdateDashboardUI()

}

  

FormatSeconds(s) {

    hours := s // 3600

    rem := Mod(s, 3600)

    mins := rem // 60

    secs := Mod(rem, 60)

    return Format("{:02}:{:02}:{:02}", hours, mins, secs)

}

  

; ==============================================================================

; ALERTAS Y KEEP AWAKE

; ==============================================================================

CheckEyeAlert() {

    ; Si está pausado, o hay alerta abierta, o el usuario lleva 1 min inactivo, no molestar

    if (IsPaused || AlertOpen || A_TimeIdlePhysical > 60000)

        return

    ShowAlert("👁️ Descanso Visual (20-20-20)", "Mira a un punto lejano (6m) durante 20 segundos.", "Eyes")

}

  

CheckMoveAlert() {

    if (IsPaused || AlertOpen || A_TimeIdlePhysical > 120000)

        return

  

    ShowAlert("🚶 Hora de Moverse", "Llevas 1 hora sentado.`nLevántate y camina un poco.", "Move")

}

  

ShowAlert(Title, Msg, Type) {

    global AlertOpen := true

    ; 1. PREVENIR BLOQUEO DE PANTALLA

    PreventSleep(true)

    SoundBeep(800, 200)

  

    global AlertGui := Gui("+AlwaysOnTop +ToolWindow -MinimizeBox", Title)

    AlertGui.SetFont("s12", "Segoe UI")

    AlertGui.BackColor := "White"

    AlertGui.Add("Text", "w400 Center cBlack", Msg)

    ; Botón aceptar

    AlertGui.SetFont("s11 bold")

    Btn := AlertGui.Add("Button", "w200 h40 x110 y+20 Default", "✅ Listo, continuar")

    Btn.OnEvent("Click", (*) => CloseAlert(AlertGui, Type))

    AlertGui.Show()

}

  

CloseAlert(thisGui, Type) {

    thisGui.Destroy()

    ; 2. PERMITIR BLOQUEO NUEVAMENTE

    PreventSleep(false)

    global AlertOpen := false

    ; Reiniciar el contador específico

    if (Type = "Eyes")

        SetTimer(CheckEyeAlert, EYE_INTERVAL)

    else if (Type = "Move")

        SetTimer(CheckMoveAlert, MOVE_INTERVAL)

}

  

; ==============================================================================

; FUNCIÓN CRÍTICA: GESTIÓN DE ENERGÍA

; ==============================================================================

PreventSleep(enable) {

    if (enable) {

        ; ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED

        ; 0x80000003 fuerza a Windows a no apagar pantalla ni dormir

        DllCall("SetThreadExecutionState", "UInt", 0x80000003)

    } else {

        ; ES_CONTINUOUS (0x80000000) restaura el estado normal

        DllCall("SetThreadExecutionState", "UInt", 0x80000000)

    }

}

  

; ==============================================================================

; UTILIDADES

; ==============================================================================

TogglePause(*) {

    global IsPaused := !IsPaused

    UpdateDashboardUI()

    if IsPaused

        TrayTip("Pausado", "Wellbeing no te enviará alertas.")

    else

        TrayTip("Reanudado", "Monitoreo de salud activo.")

}

  

ExitAppFunc(*) {

    IniWrite(ScreenTimeSeconds, IniPath, "DailyStats", TODAY_DATE)

    ExitApp

}
```