# Plan: Rediseño del Chat fiel al chatagent

Referencia: `chatagent/frontend` (branch `claude/mister-default-5RqzY`)

## Resumen

Reescribir completamente la vista chat de Zarnetti para que sea visualmente fiel al chatagent: input limpio sin card border, burbujas user compactas con fondo accent, respuestas AI sin burbuja (markdown directo), streaming con dots animados + cursor, toolbar minimalista, welcome centrado con logo + greeting.

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `src/components/HomeScreen.tsx` | Reescribir — vista home + chat fiel al chatagent |
| `src/index.css` | Reemplazar CSS del chat con clases `.zw-chat-*` del chatagent |
| `src/lib/icons.tsx` | Añadir iconos que falten (loader/spinner) |

## Pasos

### 1. Reescribir los estilos del chat en index.css

Reemplazar las clases actuales del chat por las del chatagent:

**Welcome screen:**
- `.zw-chat-welcome` — centrado vertical, flex column, padding top grande
- `.zw-chat-welcome-content` — max-width 500px, centrado
- `.zw-chat-welcome-logo-wrap` — 40x40 logo con borde subtle
- `.zw-chat-welcome-greeting` — h2, font-size 20px, weight 600, tracking tight
- `.zw-chat-welcome-sub` — font-size 14px, muted-foreground

**Input area (sin borde card — directamente textarea + toolbar):**
- `.zw-chat-input-area` — flex-shrink 0, padding 8px 12px 6px, border-top 1px solid border
- `.zw-chat-textarea` — sin border, fondo transparente, font-size 13px, min-height 60px, max-height 40vh, field-sizing content
- `.zw-chat-input-toolbar` — flex, justify space-between, padding 4px 0 2px

**Mensajes:**
- `.zw-chat-messages` — flex 1, overflow-y auto, padding 16px 12px 8px
- `.zw-chat-msg` — margin-bottom 6px
- `.zw-chat-msg-user` — flex, justify-content flex-end, margin-top 16px
- `.zw-chat-msg-ai` — flex, justify-content flex-start
- `.zw-chat-bubble-user` — max-width 85%, padding 8px 14px, background accent, border-radius 6px, font-size 12px
- `.zw-chat-bubble-ai` — padding 4px 8px, font-size 12px, sin fondo (markdown directo)

**Send button:**
- `.zw-chat-send-btn` — 28x28, border-radius 50%, fondo muted, opacity 0.4
- `.zw-chat-send-btn.active` — fondo zw-red, color white, opacity 1

**Actions (hover):**
- `.zw-msg-actions` — opacity 0, transición, aparece en hover del msg
- `.zw-msg-action-btn` — 22x22, border-radius 4px

**Toolbar buttons:**
- `.zw-toolbar-btn` — 22x22, transparent, muted-foreground, hover accent

**Loading/streaming:**
- `.zw-loading-block` — 5x10px block, red, bounce animation
- Cursor: inline-block pulsante para streaming text

**Footer:**
- `.zw-chat-footer` — height 24px, flex, border-top, font-size 10px
- Operation indicators (read/write/idle colored dots)

### 2. Reescribir HomeScreen.tsx — Vista chat

**Vista home (viewMode === 'home'):**
- Mantener exactamente como está (hero, search, toolbar, results, recent notes)

**Vista chat (viewMode === 'chat'):**
Reescribir para que sea fiel al chatagent:

```
┌─────────────────────────────┐
│ Thread header (back + title)│  ← chat-thread-header
├─────────────────────────────┤
│                             │
│  Messages scroll area       │  ← zw-chat-messages (max-width 720px, centered)
│                             │
│  [user msg]        ← right  │  ← zw-chat-msg-user + zw-chat-bubble-user
│  [ai response]    ← left    │  ← zw-chat-msg-ai + zw-chat-bubble-ai (no bg)
│  [streaming...]             │  ← loading dots → streaming text + cursor
│                             │
├─────────────────────────────┤
│ textarea (no border card)   │  ← zw-chat-input-area
│ [model] [attach] ... [send] │  ← zw-chat-input-toolbar
├─────────────────────────────┤
│ Zarnet · Chat · ~280 tokens │  ← zw-chat-footer
└─────────────────────────────┘
```

Cambios clave respecto al actual:
- **Input sin card/border** — textarea directamente con border-top separator, como chatagent
- **User bubble compacta** — max-width 85%, background accent, border-radius 6px, font-size 12px
- **AI sin burbuja** — padding 4px 8px, sin fondo, markdown renderizado con zn-preview
- **Streaming** — dots animados (3 blocks bouncing), luego texto con cursor pulsante inline
- **Actions en hover** — copy, retry, edit aparecen en hover del mensaje, no siempre visibles
- **Max-width 720px** centrado para los mensajes y el input
- **Font-size 12-13px** general (no 14px)

### 3. Añadir iconos faltantes

- `loader` — SVG spinner (circle con dash) para estado "connecting"
- Ya tenemos: arrowUp, arrowLeft, square, sparkles, paperclip, copy, plus, check

### 4. Iconos SVG

El repo athas usa `lucide-react` — los mismos iconos que ya tenemos inline en `icons.tsx`. No hay SVGs descargables. Mantenemos el sistema actual de iconos inline que es equivalente.

## Criterios de calidad

- El chat debe verse visualmente casi idéntico al chatagent
- Input limpio sin card border
- Burbujas user compactas, AI sin burbuja
- Streaming con dots + cursor
- Hover actions
- Max-width 720px centrado
- Font sizes 12-13px
- Transiciones suaves
