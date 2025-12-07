---
title: Standard ASCII vs. Texture Mode
description: Breve descripción de qué va el tema.
pubDate: Dec 06 2025
---
# Diferencias Técnicas: Standard ASCII vs. Texture Mode

En **MAD-ASCII**, la conversión de píxeles a caracteres no es única. Existen dos motores matemáticos distintos dentro de core/ascii_math.py que interpretan la imagen de formas opuestas.

## 1. Método Standard ASCII (Mapeo de Luminancia)

Este es el método clásico. Su objetivo es replicar la **luz y sombra** de la imagen original. Trata a los caracteres como "manchas de tinta" con diferentes densidades.

### ⚙️ Cómo funciona (Algoritmo)

1. **Pre-procesamiento:** La imagen se convierte a escala de grises (
    
    ```
    0=Negro,255=Blanco0=Negro,255=Blanco
    ```
    
    ) y se redimensiona.
    
2. **Dithering (Opcional):** Se aplica la matriz de Bayer para dispersar el error de cuantización, suavizando los degradados.
    
3. **Cuantización Vectorial:** Se utiliza **NumPy/CuPy** para mapear el valor de brillo de cada píxel a un índice en la cadena de caracteres.
    

### 🧮 Lógica Matemática

La fórmula base normaliza el valor del píxel y lo multiplica por la longitud de la paleta de caracteres:

```
Iˊndice=⌊Pıˊxel255×(CantidadCaracteres−1)⌋Iˊndice=⌊255Pıˊxel​×(CantidadCaracteres−1)⌋
```

- **Píxel Oscuro (0):** Mapea al índice 0 (ej: @ o █).
    
- **Píxel Claro (255):** Mapea al último índice (ej: . o ).
    

### 💻 Snippet del Código (core/ascii_math.py)

codePython

```
def pixel_to_ascii_standard(image, charset, use_dither=False):
    # ... (código de dither) ...
    
    # Cálculo vectorial masivo (CPU o GPU)
    # Transforma 0-255 a 0-N
    indices = (img_arr / 255.0 * (len(chars)-1)).astype(int)
    
    # Reemplazo directo
    ascii_matrix = chars_np[indices]
    return ascii_matrix
```

---

## 2. Método Texture Mode (Mapeo Topológico)

Este método (implementado en la Fase 13.5) ignora la luz y se enfoca en la **Estructura y Geometría**. Su objetivo es dibujar los contornos como si fuera un plano arquitectónico o un wireframe.

### ⚙️ Cómo funciona (Algoritmo)

1. **Cálculo de Gradientes (Sobel):** Se calculan las derivadas de la imagen en los ejes X e Y para detectar cambios bruscos de contraste (bordes).
    
2. **Magnitud y Ángulo:**
    
    - **Magnitud:** ¿Qué tan fuerte es el borde?
        
    - **Ángulo:** ¿Hacia dónde apunta la línea? (0° a 360°).
        
3. **Detección de Esquinas (Harris):** Se utiliza el algoritmo Harris Corner Detection para encontrar puntos donde líneas se cruzan.
    
4. **Árbol de Decisión por Píxel:** El carácter se elige según la topología del área local.
    

### 🧮 Lógica de Selección

El algoritmo prioriza las formas geométricas sobre el brillo:

1. **¿Es una Esquina?** (Harris > Umbral) 
    
    ```
    →→
    ```
    
     Usa +, x, #.
    
2. **¿Es un Borde?** (Magnitud > Umbral). Se analiza el **Ángulo**:
    
    - Vertical (90°) 
        
        ```
        →→
        ```
        
         |
        
    - Horizontal (0°) 
        
        ```
        →→
        ```
        
         -
        
    - Diagonal A (45°) 
        
        ```
        →→
        ```
        
         /
        
    - Diagonal B (135°) 
        
        ```
        →→
        ```
        
         \
        
    - Curvas (según dirección del gradiente) 
        
        ```
        →→
        ```
        
         ^, v, (, )
        
3. **¿Es Relleno?** (Sin bordes) 
    
    ```
    →→
    ```
    
     Usa densidad simple (. o ).
    

### 💻 Snippet del Código (core/ascii_math.py)

codePython

```
def pixel_to_ascii_texture(image, sensitivity=0.6):
    # ... Cálculo de Sobel (gx, gy) y Harris ...
    mag, ang_rad = cv2.cartToPolar(gx, gy)
    ang_deg = np.degrees(ang_rad)

    # Lógica de decisión direccional
    if h_val > corner_thresh:
        char = '+' 
    elif m > edge_thresh:
        # Mapeo según el ángulo del vector gradiente
        if (22.5 <= a < 67.5): char = '/'
        elif (67.5 <= a < 112.5): char = '-'
        elif (112.5 <= a < 157.5): char = '\\'
        else: char = '|'
    # ...
```

---

## 🆚 Resumen Comparativo

|   |   |   |
|---|---|---|
|Característica|Standard ASCII|Texture Mode|
|**Base Lógica**|Brillo / Luminancia|Gradientes / Bordes|
|**Matemática**|Aritmética Simple (Normalización)|Cálculo Vectorial (Derivadas, Trigonometría)|
|**Caracteres**|Gradiente de densidad (@%#*+=-:.)|Geométricos (`/|
|**Estética**|Fotográfica, Shading suave|Técnica, Wireframe, "Matrix"|
|**Mejor para**|Retratos, Degradados, Sombras|Edificios, Logos, Texto, Formas definidas|

---

Standard usa brillo para elegir densidad. Texture usa cálculo vectorial para detectar bordes y ángulos, dibujando la estructura real. 📐✨