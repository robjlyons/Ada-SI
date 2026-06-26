import { useEffect, useLayoutEffect, useRef } from 'react'
import { SCROLL_THRESHOLD } from '../../constants'
import { useAppStore } from '../../state/store'
import type { FeedItem } from '../../types/events'
import { MessageRow } from './MessageRow'
import { ToolPlanCard } from '../tools/ToolPlanCard'
import { Welcome } from './Welcome'

type MessagesProps = {
  feed: FeedItem[]
}

export function Messages({ feed }: MessagesProps) {
  const messagesRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const pinnedToBottomRef = useRef(true)
  const wasSendingRef = useRef(false)

  const isSending = useAppStore((s) => s.isSending)
  const showScrollBottom = useAppStore((s) => s.showScrollBottom)
  const setShowScrollBottom = useAppStore((s) => s.setShowScrollBottom)

  useEffect(() => {
    if (isSending && !wasSendingRef.current) {
      pinnedToBottomRef.current = true
    }
    wasSendingRef.current = isSending
  }, [isSending])

  const distanceFromBottom = () => {
    const el = messagesRef.current
    if (!el) return 0
    return el.scrollHeight - el.scrollTop - el.clientHeight
  }

  const scrollToBottom = (force = false) => {
    const el = messagesRef.current
    if (!el) return

    const shouldScroll = force || pinnedToBottomRef.current
    if (!shouldScroll) {
      if (isSending) setShowScrollBottom(true)
      return
    }

    const applyScroll = () => {
      el.scrollTop = el.scrollHeight
    }

    applyScroll()
    requestAnimationFrame(() => {
      applyScroll()
      setShowScrollBottom(false)
    })
  }

  useLayoutEffect(() => {
    scrollToBottom()
  }, [feed, isSending])

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const observer = new ResizeObserver(() => {
      if (pinnedToBottomRef.current) {
        scrollToBottom()
      }
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  const onScroll = () => {
    const distance = distanceFromBottom()
    if (distance <= SCROLL_THRESHOLD) {
      pinnedToBottomRef.current = true
      setShowScrollBottom(false)
    } else {
      pinnedToBottomRef.current = false
      if (isSending) setShowScrollBottom(true)
    }
  }

  const handleScrollBottomClick = () => {
    pinnedToBottomRef.current = true
    scrollToBottom(true)
  }

  return (
    <div className="messages-wrap">
      <main
        ref={messagesRef}
        className="messages scroll-area"
        aria-live="polite"
        onScroll={onScroll}
      >
        <div ref={contentRef} className="messages-content">
          {feed.length === 0 && <Welcome />}
          {feed.map((item) => {
            if (item.type === 'tool-plan') {
              return <ToolPlanCard key={item.id} feedId={item.id} card={item.card} />
            }
            if (item.type === 'user') {
              return <MessageRow key={item.id} item={item} />
            }
            if (item.hidden) return null
            return <MessageRow key={item.id} item={item} />
          })}
        </div>
      </main>
      <button
        type="button"
        className={`scroll-bottom${showScrollBottom ? '' : ' hidden'}`}
        title="Scroll to latest"
        onClick={handleScrollBottomClick}
      >
        ↓ New intel
      </button>
    </div>
  )
}
