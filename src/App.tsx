import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { EmptyState } from './components/EmptyState'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { notes, activeNote, activeId, setActiveId, addNote, updateNote, deleteNote } = useNotes()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        notes={notes}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={addNote}
        onDelete={deleteNote}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {activeNote ? (
        <Editor note={activeNote} onUpdate={updateNote} onDelete={deleteNote} />
      ) : (
        <EmptyState onAdd={addNote} />
      )}
    </div>
  )
}
