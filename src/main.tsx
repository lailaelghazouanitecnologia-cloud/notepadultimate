import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { NotesProvider, useNotesContext } from './contexts/NotesContext'
import { AgentsProvider } from './contexts/AgentsContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { UIProvider } from './contexts/UIContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Bridge component to pass publishedNotes from NotesContext to AgentsProvider
function AgentsBridge({ children }: { children: React.ReactNode }) {
  const { publishedNotes } = useNotesContext()
  return (
    <AgentsProvider publishedNotes={publishedNotes}>
      {children}
    </AgentsProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <NotesProvider>
          <AgentsBridge>
            <ProjectProvider>
              <UIProvider>
                <App />
              </UIProvider>
            </ProjectProvider>
          </AgentsBridge>
        </NotesProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
