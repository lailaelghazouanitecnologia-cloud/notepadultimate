import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Icons } from '../../lib/icons'
import { ModelSelector } from './ModelSelector'
import { COMMANDS } from '../../types/chat'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isStreaming?: boolean
  model: string
  onModelChange: (model: string) => void
  placeholder?: string
}

export const ChatInput = memo(function ChatInput({
  value, onChange, onSend, onStop,
  isStreaming = false, model, onModelChange,
  placeholder = 'Message Zarnet...',
}: ChatInputProps) {
  const [showCommands, setShowCommands] = useState(false)
  const cmdRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!showCommands) return
    const handler = (e: MouseEvent) => {
      if (cmdRef.current && !cmdRef.current.contains(e.target as Node)) setShowCommands(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCommands])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }, [onSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [onChange])

  const selectCommand = (cmd: string) => {
    onChange(cmd + ' ')
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="zw-chat-input-box">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isStreaming}
        className="zw-chat-textarea"
        rows={1}
      />
      <div className="zw-chat-toolbar">
        <div className="zw-chat-toolbar-left">
          <ModelSelector selected={model} onSelect={onModelChange} />
          <button className="zw-chat-tool-btn" title="Attach file">{Icons.paperclip()}</button>
          <button className="zw-chat-tool-btn" title="Mention">{Icons.atSign()}</button>
          <button className="zw-chat-tool-btn" title="Search web">{Icons.globe()}</button>

          <div style={{ position: 'relative' }} ref={cmdRef}>
            <button className="zw-cmd-btn" onClick={() => setShowCommands(!showCommands)} title="Commands">
              <span className="zw-cmd-btn__slash">/</span>
            </button>
            {showCommands && (
              <div className="zw-cmd-menu">
                <div className="zw-cmd-menu__title">Commands</div>
                {COMMANDS.map((c) => (
                  <button key={c.cmd} className="zw-cmd-menu__item" onClick={() => selectCommand(c.cmd)}>
                    <span className="zw-cmd-menu__cmd">{c.cmd}</span>
                    {c.args && <span className="zw-cmd-menu__args">{c.args}</span>}
                    <span className="zw-cmd-menu__desc">{c.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="zw-chat-toolbar-right">
          {isStreaming ? (
            <button onClick={onStop} className="zw-send-btn active" title="Stop">
              {Icons.x()}
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!value.trim()}
              className={`zw-send-btn ${value.trim() ? 'active' : ''}`}
            >
              {Icons.arrowUp()}
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
