# Plan: Rediseño del Sidebar

## Estado actual
- Sidebar: Logo → Nav (Home, Messages, **Graph**) → Post → divider → Panel contextual (Feed/Chat/**Files**) → Account
- Avatar menu: Settings, Theme, Spaces (list + new), Upgrade, Logout
- Graph y Files están duplicados (ya existen en el header)
- Logo pegado a los nav items, poco espacio
- Spacer debajo de Post demasiado grande
- No hay Download en el avatar menu
- Plugins (Agents) se accede desde un icono de puzzle en el header, no desde el avatar

---

## Cambios propuestos

### 1. Sidebar nav — quitar Graph y dejar solo Home + Messages
- **Quitar** `graph` del array `navItems` (ya está en el header)
- Sidebar nav queda: **Home** | **Messages**
- Esto hace el sidebar más limpio y evita duplicación con el header

### 2. Panel contextual — quitar SidebarFiles
- **Quitar** el panel `SidebarFiles` del sidebar (graph/editor ya se navegan desde el header)
- El sidebar contextual solo mostrará:
  - **Feed** → SidebarFeed (trends, who to follow, following)
  - **Chat** → SidebarChat (conversations)
  - **Graph/Editor** → nada (o el mismo SidebarFeed como fallback)
- Eliminar import de `SidebarFiles` en Sidebar.tsx (el componente sigue existiendo para uso futuro)

### 3. Espaciado — logo respira, spacer reducido
- Aumentar padding-bottom del logo: `padding: 4px 10px 8px` → `padding: 8px 10px 16px`
- Reducir el spacer después de Post: quitar el `zw-sb-divider` y usar un gap más natural
- El panel contextual usa `flex: 1` para llenar el espacio sin forzar un spacer artificial

### 4. Avatar menu — reorganizar
El menú del avatar tendrá esta estructura:

```
┌─────────────────────┐
│ User                │
│ @user               │
├─────────────────────┤
│ 🧩 Plugins          │  ← Abre página de plugins (agents + futuros)
│ ⬇️ Download         │  ← Descarga de datos/export
│ ⚙️ Settings          │
│ 🌙 Dark mode        │
├─────────────────────┤
│ SPACES              │
│ ✓ Space 1           │
│   Space 2           │
│ + Create new space  │  ← Renombrado de "New space"
├─────────────────────┤
│ ⭐ Upgrade plan      │
├─────────────────────┤
│ 🚪 Log out           │
└─────────────────────┘
```

Cambios concretos:
- **Añadir "Plugins"**: icono puzzle, al hacer click llama `onOpenPlugins()` (nueva prop) que navega a la página de plugins
- **Añadir "Download"**: icono download, placeholder por ahora
- **Renombrar** "New space" → "Create new space"
- Mantener Settings, Theme toggle, Spaces, Upgrade, Logout

### 5. Página de Plugins (nueva vista)
- Crear componente `PluginsView.tsx`
- Es una página completa (no un panel lateral)
- Muestra una **lista de plugins disponibles** con:
  - Card por plugin con icono, nombre, descripción, botón "Open" / "Add"
  - El primer plugin será "Agents" (el que ya existe)
  - Diseño preparado para añadir más plugins en el futuro
- Se accede desde el avatar menu → "Plugins"
- Se añade como un nuevo valor en `pluginPanel` o como vista separada

### 6. Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `Sidebar.tsx` | Quitar Graph de nav, quitar SidebarFiles, reorganizar avatar menu, nuevas props |
| `sidebar.css` | Ajustar espaciado logo, quitar divider/spacer excesivo |
| `App.tsx` | Pasar `onOpenPlugins` al sidebar, routing para PluginsView |
| `PluginsView.tsx` | **NUEVO** — página de lista de plugins |
| `plugins.css` | **NUEVO** — estilos para la página de plugins |
| `UIContext.tsx` | Añadir 'plugins' como opción de pluginPanel si es necesario |

---

## Lo que NO cambia
- Header mantiene sus botones (Feed/Chat/Graph)
- SidebarFeed y SidebarChat siguen igual
- SidebarFiles.tsx no se borra (puede usarse en otro sitio más adelante)
- El componente AgentsView sigue siendo la vista de agentes (se accederá desde PluginsView)
