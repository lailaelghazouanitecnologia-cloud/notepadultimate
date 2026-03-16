// Inline SVG icons to avoid lucide-react dependency bloat
// All icons: 24x24 viewBox, stroke-based

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function ZarnettiLogo({ className }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zarnetti logo"
      className={className}
    >
      <defs>
        <linearGradient id="zarnetti-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d4d4d4" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M358.333 0C381.345 0 400 18.6548 400 41.6667V295.833C400 298.135 398.134 300 395.833 300H270.833C268.532 300 266.667 301.865 266.667 304.167V395.833C266.667 398.134 264.801 400 262.5 400H41.6667C18.6548 400 0 381.345 0 358.333V304.72C0 301.793 1.54269 299.081 4.05273 297.575L153.76 207.747C157.159 205.708 156.02 200.679 152.376 200.065L151.628 200H4.16667C1.86548 200 6.71103e-08 198.135 0 195.833V104.167C1.07376e-06 101.865 1.86548 100 4.16667 100H162.5C164.801 100 166.667 98.1345 166.667 95.8333V4.16667C166.667 1.86548 168.532 1.00666e-07 170.833 0H358.333ZM170.833 100C168.532 100 166.667 101.865 166.667 104.167V295.833C166.667 298.135 168.532 300 170.833 300H262.5C264.801 300 266.667 298.135 266.667 295.833V104.167C266.667 101.865 264.801 100 262.5 100H170.833Z"
        fill="url(#zarnetti-grad)"
      />
    </svg>
  )
}

/** GitHub-style 5x5 identicon avatar */
export function Identicon({ className }: { className?: string }) {
  // Symmetric 5x5 grid pattern (left half mirrored)
  const pattern = [
    [0,1,1,1,0],
    [1,0,1,0,1],
    [1,1,0,1,1],
    [0,1,1,1,0],
    [1,0,0,0,1],
  ]
  const size = 5
  const cell = 100 / size
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#2a2a2a" />
      {pattern.map((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#a882ff" /> : null
        )
      )}
    </svg>
  )
}

/* ── File type icons (vscode-material-icon-theme style) ── */
const fs = { width: 16, height: 16, flexShrink: 0 } as const

export function IconHtml() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={fs}>
      <path fill="#e65100" d="m4 4 2 22 10 2 10-2 2-22Zm19.72 7H11.28l.29 3h11.86l-.802 9.335L15.99 25l-6.635-1.646L8.93 19h3.02l.19 2 3.86.77 3.84-.77.29-4H8.84L8 8h16Z" />
    </svg>
  )
}

export function IconCss() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style={fs}>
      <path fill="#42a5f5" d="M2 2v12h12V2Zm4 6h1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1h1v1h1Zm3 0h2v1h-2v1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2v-1h2v-1h-1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
    </svg>
  )
}

export function IconJs() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style={fs}>
      <path fill="#ffca28" d="M2 2v12h12V2zm6 6h1v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1h1v1h1zm3 0h2v1h-2v1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2v-1h2v-1h-1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
    </svg>
  )
}

export function IconTs() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style={fs}>
      <path fill="#0288d1" d="M2 2v12h12V2zm4 6h3v1H8v4H7V9H6zm5 0h2v1h-2v1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2v-1h2v-1h-1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
    </svg>
  )
}

export function IconJson() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" style={fs}>
      <path fill="#f9a825" d="M560-160v-80h120q17 0 28.5-11.5T720-280v-80q0-38 22-69t58-44v-14q-36-13-58-44t-22-69v-80q0-17-11.5-28.5T680-720H560v-80h120q50 0 85 35t35 85v80q0 17 11.5 28.5T840-560h40v160h-40q-17 0-28.5 11.5T800-360v80q0 50-35 85t-85 35zm-280 0q-50 0-85-35t-35-85v-80q0-17-11.5-28.5T120-400H80v-160h40q17 0 28.5-11.5T160-600v-80q0-50 35-85t85-35h120v80H280q-17 0-28.5 11.5T240-680v80q0 38-22 69t-58 44v14q36 13 58 44t22 69v80q0 17 11.5 28.5T280-240h120v80z" />
    </svg>
  )
}

export function IconMarkdown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={fs}>
      <path fill="#42a5f5" d="m14 10-4 3.5L6 10H4v12h4v-6l2 2 2-2v6h4V10zm12 6v-6h-4v6h-4l6 8 6-8z" />
    </svg>
  )
}

export function IconPdf() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={fs}>
      <path fill="#ef5350" d="M13 9h5.5L13 3.5zM6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m4.93 10.44c.41.9.93 1.64 1.53 2.15l.41.32c-.87.16-2.07.44-3.34.93l-.11.04.5-1.04c.45-.87.78-1.66 1.01-2.4m6.48 3.81c.18-.18.27-.41.28-.66.03-.2-.02-.39-.12-.55-.29-.47-1.04-.69-2.28-.69l-1.29.07-.87-.58c-.63-.52-1.2-1.43-1.6-2.56l.04-.14c.33-1.33.64-2.94-.02-3.6a.85.85 0 0 0-.61-.24h-.24c-.37 0-.7.39-.79.77-.37 1.33-.15 2.06.22 3.27v.01c-.25.88-.57 1.9-1.08 2.93l-.96 1.8-.89.49c-1.2.75-1.77 1.59-1.88 2.12-.04.19-.02.36.05.54l.03.05.48.31.44.11c.81 0 1.73-.95 2.97-3.07l.18-.07c1.03-.33 2.31-.56 4.03-.75 1.03.51 2.24.74 3 .74.44 0 .74-.11.91-.3" />
    </svg>
  )
}

export function IconImage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style={fs}>
      <path fill="#26a69a" d="M8.5 6h4l-4-4zM3.875 1H9.5l4 4v8.6c0 .773-.616 1.4-1.375 1.4h-8.25c-.76 0-1.375-.627-1.375-1.4V2.4c0-.777.612-1.4 1.375-1.4M4 13.6h8V8l-2.625 2.8L8 9.4zm1.25-7.7c-.76 0-1.375.627-1.375 1.4s.616 1.4 1.375 1.4c.76 0 1.375-.627 1.375-1.4S6.009 5.9 5.25 5.9" />
    </svg>
  )
}

export function IconDoc() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={fs}>
      <path fill="#42a5f5" d="M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm4 18H6V4h7v5h5z" />
    </svg>
  )
}

export function IconFileGeneric() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={fs}>
      <path fill="currentColor" opacity="0.5" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm4 18H6V4h7v5h5z" />
    </svg>
  )
}

type FileType = 'html' | 'css' | 'js' | 'ts' | 'json' | 'md' | 'pdf' | 'img' | 'doc' | 'unknown'

const iconMap: Record<FileType, React.FC> = {
  html: IconHtml, css: IconCss, js: IconJs, ts: IconTs,
  json: IconJson, md: IconMarkdown, pdf: IconPdf,
  img: IconImage, doc: IconDoc, unknown: IconFileGeneric,
}

export function getFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, FileType> = {
    html: 'html', htm: 'html', css: 'css', scss: 'css', less: 'css',
    js: 'js', jsx: 'js', mjs: 'js', ts: 'ts', tsx: 'ts',
    json: 'json', md: 'md', mdx: 'md', markdown: 'md',
    pdf: 'pdf', png: 'img', jpg: 'img', jpeg: 'img', gif: 'img', svg: 'img', webp: 'img',
    doc: 'doc', docx: 'doc', txt: 'doc',
  }
  return map[ext] || 'unknown'
}

export function FileTypeIcon({ filename }: { filename: string }) {
  const ft = getFileType(filename)
  const Icon = iconMap[ft] || IconFileGeneric
  return <Icon />
}

export const Icons = {
  files: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>,
  search: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>,
  plus: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 4.5v15m7.5-7.5h-15"/></svg>,
  file: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>,
  edit: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/><path d="M19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>,
  eye: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  columns: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 4.5v15m6-15v15M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z"/></svg>,
  copy: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  arrowUp: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 19V5m-7 7l7-7 7 7"/></svg>,
  x: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>,
  messageCircle: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg>,
  chevronDown: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>,
  clock: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  rss: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1" fill="currentColor"/></svg>,
  upload: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>,
  check: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M20 6L9 17l-5-5"/></svg>,
  users: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  bot: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><circle cx="8" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1" fill="currentColor" stroke="none"/></svg>,
  bell: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  heart: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  arrowLeft: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M19 12H5m7-7l-7 7 7 7"/></svg>,
  link: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  puzzle: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 01-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 10-3.214 3.214c.446.166.855.497.925.968a.98.98 0 01-.276.837l-1.61 1.61a2.404 2.404 0 01-1.705.707 2.402 2.402 0 01-1.704-.706l-1.568-1.568a1.026 1.026 0 00-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 11-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 00-.289-.877l-1.568-1.568A2.402 2.402 0 011.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 103.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0112 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 113.237 3.237c-.464.18-.894.527-.967 1.02z"/></svg>,
  folder: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M2 7.5A2.5 2.5 0 014.5 5h4.586a1 1 0 01.707.293L11.5 7H19.5A2.5 2.5 0 0122 9.5v9a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 18.5v-11z"/></svg>,
  menu: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  network: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v6"/><circle cx="6" cy="18" r="3"/><path d="M9 6h6"/><path d="M9 18h6"/></svg>,
  panelLeft: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>,
  panelLeftClose: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M16 15l-3-3 3-3"/></svg>,
  settings: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logOut: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  fileText: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  moon: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  globe: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  sparkles: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>,
  paperclip: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  atSign: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg>,
  userPlus: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6m3-3h-6"/></svg>,
  command: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"/></svg>,
  filePlus: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  image: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  download: (p?: object) => <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M16.5 13C16.7761 13 17 13.2239 17 13.5V15.5C17 16.3284 16.3284 17 15.5 17H4.5C3.67157 17 3 16.3284 3 15.5V13.5C3 13.2239 3.22386 13 3.5 13C3.77614 13 4 13.2239 4 13.5V15.5C4 15.7761 4.22386 16 4.5 16H15.5C15.7761 16 16 15.7761 16 15.5V13.5C16 13.2239 16.2239 13 16.5 13ZM10 3C10.2761 3 10.5 3.22386 10.5 3.5V12.1855L13.626 8.66797C13.8094 8.46166 14.1256 8.44275 14.332 8.62598C14.5383 8.80936 14.5573 9.12563 14.374 9.33203L10.374 13.832L10.2949 13.9033C10.21 13.9654 10.107 14 10 14C9.85718 14 9.72086 13.9388 9.62598 13.832L5.62598 9.33203L5.56738 9.25C5.45079 9.04872 5.48735 8.78653 5.66797 8.62598C5.84854 8.46567 6.1127 8.46039 6.29883 8.59961L6.37402 8.66797L9.5 12.1855V3.5C9.5 3.22386 9.72386 3 10 3Z"/></svg>,
  crown: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><path d="M2 20h20"/><path d="M4 17l2-12 4 5 2-5 2 5 4-5 2 12z"/></svg>,
  sun: (p?: object) => <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
}
