---
title: Edge Image Auto-Renamer PS1
description: Renombra automaticamente los archivos arrastrados a una carpeta que se denominan donwload.jpg
pubDate: Dec 20 2025
---
```ps1
#to use from PowerShell :

#cd "C:\Scripts"

#.\edge-image-autorenamer.ps1

$folder = "F:\"

  

$watcher = New-Object System.IO.FileSystemWatcher

$watcher.Path = $folder

$watcher.Filter = "*.*"

$watcher.EnableRaisingEvents = $true

  

Register-ObjectEvent $watcher Created -Action {

    Start-Sleep -Milliseconds 300

  

    $path = $Event.SourceEventArgs.FullPath

    $name = [System.IO.Path]::GetFileName($path)

    $ext  = [System.IO.Path]::GetExtension($path).ToLower()

  

    if ($name -match '^download\.(jpg|jpeg|png|webp)$') {

        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

        $dir = [System.IO.Path]::GetDirectoryName($path)

  

        $newName = "$timestamp$ext"

        $newPath = Join-Path $dir $newName

        $i = 1

  

        while (Test-Path $newPath) {

            $newName = "{0}_{1:D2}{2}" -f $timestamp, $i, $ext

            $newPath = Join-Path $dir $newName

            $i++

        }

  

        Rename-Item $path $newName -Force

    }

}

  

while ($true) { Start-Sleep 1 }
```

# Edge Image Auto-Renamer - Explicación del Script

## Descripción General
Este script de PowerShell monitorea una carpeta específica y renombra automáticamente las imágenes descargadas desde Microsoft Edge con una marca de tiempo, evitando conflictos de nombres.

## Propósito Principal
El script resuelve un problema común: cuando Edge descarga imágenes, las guarda como `download.jpg`, `download(1).jpg`, etc. Este script las renombra automáticamente con un formato de fecha y hora para mejor organización.

## Estructura del Script

### 1. Configuración Inicial
```powershell
$folder = "F:\"
```
Define la carpeta a monitorear. En este caso, `F:\`.

### 2. Creación del FileSystemWatcher
```powershell
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $folder
$watcher.Filter = "*.*"
$watcher.EnableRaisingEvents = $true
```
Crea un objeto que monitorea cambios en el sistema de archivos:
- **Path**: Ruta a monitorear (`F:\`)
- **Filter**: Filtra todos los archivos (`*.*`)
- **EnableRaisingEvents**: Activa la detección de eventos

### 3. Registro del Evento "Created"
```powershell
Register-ObjectEvent $watcher Created -Action {
    # Código ejecutado cuando se crea un archivo
}
```
Se ejecuta cuando se detecta un nuevo archivo en la carpeta.

### 4. Lógica de Renombrado
#### a) Espera inicial
```powershell
Start-Sleep -Milliseconds 300
```
Pausa breve para asegurar que el archivo esté completamente escrito.

#### b) Obtención de información del archivo
```powershell
$path = $Event.SourceEventArgs.FullPath
$name = [System.IO.Path]::GetFileName($path)
$ext  = [System.IO.Path]::GetExtension($path).ToLower()
```
Extrae: ruta completa, nombre del archivo y extensión (en minúsculas).

#### c) Validación del patrón
```powershell
if ($name -match '^download\.(jpg|jpeg|png|webp)$')
```
Verifica si el archivo coincide con el patrón de nombres de Edge:
- Nombre: `download`
- Extensiones válidas: jpg, jpeg, png, webp

#### d) Generación del nuevo nombre
```powershell
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$newName = "$timestamp$ext"
```
Crea un nombre con formato: `AAAA-MM-DD_HH-mm-ss.ext`

#### e) Manejo de duplicados
```powershell
while (Test-Path $newPath) {
    $newName = "{0}_{1:D2}{2}" -f $timestamp, $i, $ext
    $i++
}
```
Si ya existe un archivo con ese nombre, agrega un número secuencial: `AAAA-MM-DD_HH-mm-ss_01.ext`

#### f) Renombrado final
```powershell
Rename-Item $path $newName -Force
```
Renombra el archivo original con el nuevo nombre.

### 5. Bucle de Mantenimiento
```powershell
while ($true) { Start-Sleep 1 }
```
Mantiene el script en ejecución indefinidamente.

## Ejemplos de Transformación
- `download.jpg` → `2023-12-15_14-30-45.jpg`
- Si existe duplicado: `2023-12-15_14-30-45_01.jpg`

## Modo de Uso
1. Guardar como `edge-image-autorenamer.ps1`
2. Ejecutar desde PowerShell:
   ```powershell
   cd "C:\Scripts"
   .\edge-image-autorenamer.ps1
   ```

## Consideraciones Importantes
1. **Permisos**: Requiere permisos para leer/escribir en la carpeta monitoreada
2. **Ejecución continua**: El script debe permanecer abierto
3. **Especificidad**: Solo afecta a archivos que coincidan exactamente con `download.ext`
4. **Rendimiento**: Monitorea TODOS los archivos, pero solo procesa los que cumplen el patrón

## Posibles Mejoras
1. Cambiar `$folder` para usar rutas relativas o parámetros
2. Agregar logging para seguimiento de operaciones
3. Incluir más extensiones de imagen
4. Permitir configuración mediante archivo externo