'use client'

import { useRef, useEffect } from 'react'

interface RichEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
}

export default function RichEditor({ value, onChange, placeholder, rows = 5 }: RichEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Set initial content
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value
    }
  }, [value])

  const exec = (command: string) => {
    ref.current?.focus()
    document.execCommand(command, false)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const btn = (label: string, command: string, style?: React.CSSProperties) => (
    <button
      type="button"
      onClick={() => exec(command)}
      title={command}
      style={{
        width: 28, height: 28,
        borderRadius: 6,
        border: '1px solid #f3c6d0',
        backgroundColor: 'white',
        color: 'var(--bonnie-muted)',
        cursor: 'pointer',
        fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}>
      {label}
    </button>
  )

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#f3c6d0' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ borderColor: '#f3c6d0', backgroundColor: 'var(--bonnie-cream)' }}>
        {btn('B', 'bold', { fontWeight: 'bold' })}
        {btn('I', 'italic', { fontStyle: 'italic' })}
        {btn('U', 'underline', { textDecoration: 'underline' })}
      </div>

      {/* Editable content area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className="text-sm p-3 focus:outline-none"
        style={{
          color: 'var(--bonnie-dark)',
          backgroundColor: 'white',
          minHeight: `${rows * 26}px`,
          lineHeight: '1.6',
        }}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #b0919a;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  )
}
