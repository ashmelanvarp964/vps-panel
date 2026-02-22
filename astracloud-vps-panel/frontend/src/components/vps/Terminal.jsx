import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { getWebSocketURL } from '../../services/api'
import 'xterm/css/xterm.css'

const Terminal = ({ vpsId, type = 'ssh' }) => {
  const terminalRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const fitAddonRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState(null)

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setStatus('connecting')
    setError(null)

    const token = localStorage.getItem('token')
    const wsPath = type === 'ssh' ? 'terminal' : 'vnc'
    const wsUrl = `${getWebSocketURL(`${wsPath}/${vpsId}`)}?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'status':
            setStatus('connecting')
            break
          case 'connected':
            setStatus('connected')
            break
          case 'output':
            if (termRef.current && msg.data) {
              const text = atob(msg.data)
              termRef.current.write(text)
            }
            break
          case 'error':
            setStatus('error')
            setError(msg.message)
            break
          case 'closed':
            setStatus('disconnected')
            break
          case 'timeout':
            setStatus('timeout')
            setError(msg.message)
            break
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }

    ws.onerror = () => {
      setStatus('error')
      setError('WebSocket connection failed')
    }

    ws.onclose = () => {
      if (status === 'connected') {
        setStatus('disconnected')
      }
    }
  }, [vpsId, type, status])

  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize xterm
    const term = new XTerm({
      theme: {
        background: '#0a0a0f',
        foreground: '#ffffff',
        cursor: '#6366f1',
        cursorAccent: '#0a0a0f',
        selection: 'rgba(99, 102, 241, 0.3)',
        black: '#1e1e2e',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#94e2d5',
        white: '#cdd6f4',
        brightBlack: '#45475a',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#cba6f7',
        brightCyan: '#94e2d5',
        brightWhite: '#ffffff'
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block'
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(terminalRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    // Handle input
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'input',
          data: btoa(data)
        }))
      }
    })

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows
          }))
        }
      }
    }

    window.addEventListener('resize', handleResize)

    // Connect to WebSocket
    connect()

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(pingInterval)
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (termRef.current) {
        termRef.current.dispose()
      }
    }
  }, [vpsId])

  return (
    <div className="h-full flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark-200 border-b border-primary-500/20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-500' :
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`} />
          <span className="text-sm text-gray-400 capitalize">{status}</span>
        </div>
        {(status === 'disconnected' || status === 'error' || status === 'timeout') && (
          <button
            onClick={connect}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            Reconnect
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Terminal */}
      <div ref={terminalRef} className="flex-1 terminal-container" />
    </div>
  )
}

export default Terminal
