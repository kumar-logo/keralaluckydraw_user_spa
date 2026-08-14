import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useAppConfigStore } from '../../stores/configStore'
import { useChatStore, useTotalUnread } from '../../stores/chatStore'
import { emitChatTyping } from '../../hooks/useChatSocket'
import { decodeJwtUserId } from '../../utils/jwt'
import { toast } from '../../utils/toast'
import {
  chatMediaUrl,
  uploadChatImage,
  getChatReaders,
  type ChatGroup,
  type ChatMessage,
} from '../../services/chatApi'

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤩', '🥳',
  '😇', '🙂', '😉', '😌', '😜', '🤗', '🤔', '😐', '😴', '😭',
  '😤', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '✨', '🎉',
  '🎊', '💯', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💰',
  '💵', '🤑', '🍀', '⚽', '🎰', '🎲', '🏆', '🚀', '⭐', '🌟',
  '✅', '❌', '⚠️', '🎁', '👀', '🙌', '🤝', '😅', '😆', '🥺',
  '😏', '🤫', '😱', '🤯', '💎', '💥', '🎯', '📈', '📉', '👋',
]

const TYPING_EMIT_MS = 1500

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const ChatGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} width="24" height="24">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="9.5" r="1" fill="currentColor" />
    <circle cx="12.5" cy="9.5" r="1" fill="currentColor" />
    <circle cx="16" cy="9.5" r="1" fill="currentColor" />
  </svg>
)
const CloseGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
)
const BackGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const SendGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M4 12l16-8-6 16-3-6-7-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
)
const SmileGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M8.5 14c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="15" cy="10" r="1" fill="currentColor" /></svg>
)
const AttachGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5" /><path d="M4 17l4.5-4 3 2.5L15 11l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const ReplyGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M10 9V5l-7 7 7 7v-4c5 0 8 1.5 9 5 .5-6-2-11-9-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
)
const XGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
)

const Spinner = ({ size = 28, onPrimary = false }: { size?: number; onPrimary?: boolean }) => (
  <div className={onPrimary ? 'kc-spin kc-spin-on-primary' : 'kc-spin'} style={{ width: size, height: size }} />
)

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const dateKey = (iso: string): number => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 0 : startOfDay(d)
}
const dateLabel = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const today = startOfDay(new Date())
  const that = startOfDay(d)
  if (that === today) return 'Today'
  if (that === today - 86400000) return 'Yesterday'
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}
const formatTime = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const Avatar = ({ src, name, size }: { src: string; name: string; size: number }) => (
  <div className="kc-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
    {src ? <img src={src} alt={name} /> : <span>{(name || '#').charAt(0).toUpperCase()}</span>}
  </div>
)

const MentionText = ({ text }: { text: string }) => {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('@') && p.length > 1 ? (
          <span key={i} className="kc-mention">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

interface Participant {
  userId: string
  name: string
  avatar: string
}

interface RunBlock {
  kind: 'run'
  key: string
  mine: boolean
  isAdmin: boolean
  name: string
  avatar: string
  items: ChatMessage[]
}
interface SepBlock {
  kind: 'sep'
  key: string
  label: string
}
type Block = RunBlock | SepBlock

const buildBlocks = (messages: ChatMessage[], myUserId: string): Block[] => {
  const blocks: Block[] = []
  let lastDay = -1
  let currentKey = ''
  let run: RunBlock | null = null
  for (const m of messages) {
    const day = dateKey(m.createdAt)
    if (day !== lastDay) {
      blocks.push({ kind: 'sep', key: `sep-${day}-${m.id}`, label: dateLabel(m.createdAt) })
      lastDay = day
      currentKey = ''
      run = null
    }
    const senderKey = `${day}|${m.userId}|${m.senderRole}`
    if (senderKey !== currentKey || run === null) {
      currentKey = senderKey
      run = {
        kind: 'run',
        key: `run-${m.id}`,
        mine: myUserId !== '' && m.userId === myUserId && m.senderRole === 'user',
        isAdmin: m.senderRole === 'admin',
        name: m.senderName,
        avatar: m.senderAvatar,
        items: [],
      }
      blocks.push(run)
    }
    run.items.push(m)
  }
  return blocks
}

const Bubble = ({
  msg,
  mine,
  isAdmin,
  onReply,
  onImage,
  onQuoteClick,
}: {
  msg: ChatMessage
  mine: boolean
  isAdmin: boolean
  onReply: (m: ChatMessage) => void
  onImage: (url: string) => void
  onQuoteClick: (id: number) => void
}) => {
  const cls = mine ? 'kc-bubble kc-bubble-me' : isAdmin ? 'kc-bubble kc-bubble-admin' : 'kc-bubble kc-bubble-other'
  const reply = msg.replyTo
  const image = msg.imageUrl
  return (
    <div className="kc-bubble-wrap">
      <div className={cls}>
        {reply && (
          <button type="button" className="kc-quote" onClick={() => onQuoteClick(reply.id)}>
            <span className="kc-quote-name">{reply.senderName || 'Player'}</span>
            <span className="kc-quote-text">
              {reply.imageUrl && !reply.content ? 'Photo' : reply.content}
            </span>
          </button>
        )}
        {image && (
          <img
            className="kc-msg-img"
            src={chatMediaUrl(image)}
            alt=""
            onClick={() => onImage(chatMediaUrl(image))}
          />
        )}
        {msg.content && (
          <span className="kc-msg-text">
            <MentionText text={msg.content} />
          </span>
        )}
        <span className="kc-t">{formatTime(msg.createdAt)}</span>
      </div>
      <button type="button" className="kc-reply-btn" onClick={() => onReply(msg)} aria-label="Reply">
        <ReplyGlyph />
      </button>
    </div>
  )
}

const RunView = ({
  block,
  onReply,
  onImage,
  onQuoteClick,
}: {
  block: RunBlock
  onReply: (m: ChatMessage) => void
  onImage: (url: string) => void
  onQuoteClick: (id: number) => void
}) => {
  if (block.mine) {
    return (
      <div className="kc-run kc-me">
        {block.items.map((m) => (
          <div className="kc-line" key={m.id} data-mid={m.id}>
            <Bubble msg={m} mine isAdmin={false} onReply={onReply} onImage={onImage} onQuoteClick={onQuoteClick} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="kc-run kc-other">
      <div className={block.isAdmin ? 'kc-run-name kc-admin' : 'kc-run-name'}>
        {block.name || 'Player'}
        {block.isAdmin && <span className="kc-tag">Admin</span>}
      </div>
      {block.items.map((m, i) => (
        <div className="kc-line" key={m.id} data-mid={m.id}>
          <div className="kc-ava-slot">
            {i === block.items.length - 1 && <Avatar src={m.senderAvatar} name={m.senderName} size={30} />}
          </div>
          <Bubble msg={m} mine={false} isAdmin={block.isAdmin} onReply={onReply} onImage={onImage} onQuoteClick={onQuoteClick} />
        </div>
      ))}
    </div>
  )
}

const MessageList = ({
  messages,
  myUserId,
  loading,
  loadingMore,
  seenLabel,
  ownLastId,
  onReachTop,
  onReply,
  onImage,
}: {
  messages: ChatMessage[]
  myUserId: string
  loading: boolean
  loadingMore: boolean
  seenLabel: string
  ownLastId: number
  onReachTop: () => void
  onReply: (m: ChatMessage) => void
  onImage: (url: string) => void
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLen = useRef(0)
  const prevFirstId = useRef<number | null>(null)
  const lastScrollTop = useRef(0)
  const anchor = useRef<{ h: number; t: number } | null>(null)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const firstId = messages[0]?.id ?? null
    const prepended = anchor.current !== null && firstId !== prevFirstId.current && messages.length > prevLen.current
    if (prepended && anchor.current) {
      el.scrollTop = el.scrollHeight - anchor.current.h + anchor.current.t
      anchor.current = null
    } else {
      const grewAtEnd = messages.length > prevLen.current && prevFirstId.current === firstId
      if (prevLen.current === 0 || grewAtEnd) {
        bottomRef.current?.scrollIntoView({ behavior: prevLen.current === 0 ? 'auto' : 'smooth' })
      }
    }
    prevLen.current = messages.length
    prevFirstId.current = firstId
  }, [messages])

  const quoteScroll = (id: number) => {
    const el = scrollRef.current?.querySelector(`[data-mid="${id}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const goingUp = el.scrollTop < lastScrollTop.current
    lastScrollTop.current = el.scrollTop
    if (el.scrollTop < 48 && goingUp) {
      anchor.current = { h: el.scrollHeight, t: el.scrollTop }
      onReachTop()
    }
  }

  if (loading) {
    return (
      <div className="kc-center"><Spinner size={28} /></div>
    )
  }

  const blocks = buildBlocks(messages, myUserId)

  return (
    <div ref={scrollRef} onScroll={onScroll} className="kc-msgs">
      {loadingMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}><Spinner size={20} /></div>
      )}
      {messages.length === 0 ? (
        <div className="kc-empty">
          <div className="kc-empty-ic"><ChatGlyph /></div>
          <span className="kc-empty-title">No messages yet</span>
        </div>
      ) : (
        blocks.map((b) =>
          b.kind === 'sep' ? (
            <div className="kc-sep" key={b.key}>{b.label}</div>
          ) : (
            <RunView key={b.key} block={b} onReply={onReply} onImage={onImage} onQuoteClick={quoteScroll} />
          ),
        )
      )}
      {seenLabel !== '' && ownLastId > 0 && <div className="kc-seen">{seenLabel}</div>}
      <div ref={bottomRef} />
    </div>
  )
}

const Composer = ({
  sending,
  imageEnabled,
  participants,
  onSend,
  onTyping,
}: {
  sending: boolean
  imageEnabled: boolean
  participants: Participant[]
  onSend: (payload: { content: string; imageUrl?: string; mentions?: string[] }) => Promise<boolean>
  onTyping: () => void
}) => {
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [staged, setStaged] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const mentionPicks = useRef<Array<{ userId: string; nick: string }>>([])
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const detectMention = (value: string, caret: number) => {
    const upto = value.slice(0, caret)
    const match = upto.match(/@([A-Za-z0-9_]*)$/)
    setMentionQuery(match ? match[1] : null)
  }

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length)
    onTyping()
  }

  const insertEmoji = (emoji: string) => {
    const el = areaRef.current
    const caret = el?.selectionStart ?? text.length
    const next = text.slice(0, caret) + emoji + text.slice(caret)
    setText(next)
    setEmojiOpen(false)
    requestAnimationFrame(() => {
      if (el) {
        el.focus()
        el.selectionStart = el.selectionEnd = caret + emoji.length
      }
    })
  }

  const pickMention = (p: Participant) => {
    const el = areaRef.current
    const caret = el?.selectionStart ?? text.length
    const upto = text.slice(0, caret)
    const rest = text.slice(caret)
    const replaced = upto.replace(/@([A-Za-z0-9_]*)$/, `@${p.name} `)
    if (!mentionPicks.current.some((e) => e.userId === p.userId && e.nick === p.name)) {
      mentionPicks.current.push({ userId: p.userId, nick: p.name })
    }
    const next = replaced + rest
    setText(next)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      if (el) {
        el.focus()
        el.selectionStart = el.selectionEnd = replaced.length
      }
    })
  }

  const doUpload = async (file: File) => {
    setUploading(true)
    try {
      const res = await uploadChatImage(file)
      setStaged(res.url)
    } catch (err) {
      toast.warning(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void doUpload(file)
    e.target.value = ''
  }

  const onPaste = (e: React.ClipboardEvent) => {
    if (!imageEnabled) return
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    const file = item?.getAsFile()
    if (file) {
      e.preventDefault()
      void doUpload(file)
    }
  }

  const resolveMentions = (content: string): string[] => {
    const out: string[] = []
    for (const { userId, nick } of mentionPicks.current) {
      if (out.includes(userId)) continue
      const boundary = new RegExp(`(?:^|\\s)@${escapeRegExp(nick)}(?![A-Za-z0-9_])`)
      if (boundary.test(content)) out.push(userId)
    }
    return out
  }

  const submit = async () => {
    const value = text.trim()
    if ((value === '' && staged === '') || sending || uploading) return
    const ok = await onSend({
      content: value,
      imageUrl: staged !== '' ? staged : undefined,
      mentions: resolveMentions(value),
    })
    if (ok) {
      setText('')
      setStaged('')
      setEmojiOpen(false)
      mentionPicks.current = []
    }
  }

  const suggestions =
    mentionQuery !== null
      ? participants
          .filter((p) => p.name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
          .slice(0, 6)
      : []

  return (
    <div className="kc-composer-wrap">
      {emojiOpen && (
        <div className="kc-emoji">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className="kc-emoji-item" onClick={() => insertEmoji(e)}>{e}</button>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="kc-mentions">
          {suggestions.map((p) => (
            <button key={p.userId} type="button" className="kc-mention-item" onClick={() => pickMention(p)}>
              <Avatar src={p.avatar} name={p.name} size={26} />
              <span>{p.name || 'Player'}</span>
            </button>
          ))}
        </div>
      )}
      {staged !== '' && (
        <div className="kc-staged">
          <img src={chatMediaUrl(staged)} alt="" />
          <button type="button" className="kc-staged-x" onClick={() => setStaged('')}><XGlyph /></button>
        </div>
      )}
      <div className="kc-composer">
        <button type="button" className="kc-comp-btn" onClick={() => setEmojiOpen((v) => !v)} aria-label="Emoji"><SmileGlyph /></button>
        {imageEnabled && (
          <button type="button" className="kc-comp-btn" onClick={() => fileRef.current?.click()} aria-label="Attach">
            {uploading ? <Spinner size={20} /> : <AttachGlyph />}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onFile} />
        <textarea
          ref={areaRef}
          value={text}
          onChange={onChange}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Message"
          className="kc-input"
        />
        <button type="button" onClick={() => void submit()} disabled={sending || uploading || (text.trim() === '' && staged === '')} className="kc-send">
          {sending ? <Spinner size={20} onPrimary /> : <SendGlyph />}
        </button>
      </div>
    </div>
  )
}

const GroupRow = ({ group, unread, onOpen }: { group: ChatGroup; unread: number; onOpen: () => void }) => {
  const preview = group.lastMessage
    ? group.lastMessage.imageUrl && !group.lastMessage.content
      ? 'Photo'
      : group.lastMessage.content
    : group.type === 'private'
      ? 'Private group'
      : 'Public group'
  return (
    <button type="button" onClick={onOpen} className="kc-grouprow">
      <Avatar src={group.avatar} name={group.name} size={48} />
      <div className="kc-grouprow-main">
        <span className="kc-grouprow-name">
          {group.name}
          {group.type === 'private' && <span className="kc-tag">Private</span>}
        </span>
        <span className="kc-grouprow-sub">
          {group.lastMessage && group.lastMessage.senderName ? `${group.lastMessage.senderName}: ` : ''}
          {preview}
        </span>
      </div>
      {unread > 0 && <span className="kc-pill">{unread > 99 ? '99+' : unread}</span>}
    </button>
  )
}

const ChatPanel = ({ onClose }: { onClose: () => void }) => {
  const groups = useChatStore((s) => s.groups)
  const groupsLoaded = useChatStore((s) => s.groupsLoaded)
  const inRoom = useChatStore((s) => s.inRoom)
  const activeGroupId = useChatStore((s) => s.activeGroupId)
  const messagesByGroup = useChatStore((s) => s.messagesByGroup)
  const unread = useChatStore((s) => s.unread)
  const typing = useChatStore((s) => s.typing)
  const reads = useChatStore((s) => s.reads)
  const reply = useChatStore((s) => s.reply)
  const loadingHistory = useChatStore((s) => s.loadingHistory)
  const loadingMore = useChatStore((s) => s.loadingMore)
  const sending = useChatStore((s) => s.sending)
  const enterRoom = useChatStore((s) => s.enterRoom)
  const backToList = useChatStore((s) => s.backToList)
  const loadMore = useChatStore((s) => s.loadMore)
  const send = useChatStore((s) => s.send)
  const setReply = useChatStore((s) => s.setReply)
  const receiveRead = useChatStore((s) => s.receiveRead)

  const imageEnabled = useAppConfigStore((s) => s.groupChatImageEnabled)
  const token = useAuthStore((s) => s.token)
  const myUserId = useMemo(() => decodeJwtUserId(token), [token])

  const [lightbox, setLightbox] = useState<string>('')
  const typingRef = useRef(0)

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null
  const messages = useMemo(
    () => (activeGroupId !== null ? (messagesByGroup[activeGroupId] ?? []) : []),
    [activeGroupId, messagesByGroup],
  )
  const showList = !inRoom || activeGroup === null

  const participants = useMemo<Participant[]>(() => {
    const map = new Map<string, Participant>()
    for (const m of messages) {
      if (m.senderRole === 'user' && m.userId !== myUserId && !map.has(m.userId)) {
        map.set(m.userId, { userId: m.userId, name: m.senderName, avatar: m.senderAvatar })
      }
    }
    return Array.from(map.values())
  }, [messages, myUserId])

  const ownLast = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].userId === myUserId && messages[i].senderRole === 'user') return messages[i]
    }
    return null
  }, [messages, myUserId])

  useEffect(() => {
    if (!inRoom || !activeGroup || activeGroup.type !== 'private' || !ownLast) return
    getChatReaders(activeGroup.id, ownLast.id)
      .then((r) => {
        for (const reader of r.readers) receiveRead(activeGroup.id, reader.userId, ownLast.id)
      })
      .catch(() => undefined)
  }, [inRoom, activeGroup, ownLast, receiveRead])

  const seenLabel = useMemo(() => {
    if (!activeGroup || activeGroup.type !== 'private' || !ownLast) return ''
    const groupReads = reads[activeGroup.id] ?? {}
    const count = Object.entries(groupReads).filter(
      ([uid, last]) => uid !== myUserId && last >= ownLast.id,
    ).length
    if (count === 0) return ''
    return count === 1 ? 'Seen' : `Seen by ${count}`
  }, [activeGroup, ownLast, reads, myUserId])

  const emitTyping = () => {
    if (activeGroupId === null) return
    const now = Date.now()
    if (now - typingRef.current < TYPING_EMIT_MS) return
    typingRef.current = now
    emitChatTyping(activeGroupId)
  }

  const typingName = activeGroupId !== null ? (typing[activeGroupId] ?? '') : ''

  return (
    <div className="kc-root">
      <div className="kc-backdrop" onClick={onClose} />
      <div className="kc-panel">
        <div className="kc-header">
          <div className="kc-header-grip" />
          {!showList && groups.length > 1 && (
            <button type="button" onClick={backToList} className="kc-icon-btn"><BackGlyph /></button>
          )}
          {showList ? (
            <>
              <span className="kc-icon-btn kc-accent"><ChatGlyph /></span>
              <div className="kc-header-info">
                <span className="kc-header-title">Community Chat</span>
                <span className="kc-header-sub">{groups.length} {groups.length === 1 ? 'group' : 'groups'}</span>
              </div>
            </>
          ) : (
            <>
              <Avatar src={activeGroup?.avatar ?? ''} name={activeGroup?.name ?? ''} size={40} />
              <div className="kc-header-info">
                <span className="kc-header-title">{activeGroup?.name}</span>
                <span className="kc-header-sub">
                  {typingName !== '' ? `${typingName} is typing…` : activeGroup?.type === 'private' ? 'Private group' : 'Public group'}
                </span>
              </div>
            </>
          )}
          <button type="button" onClick={onClose} className="kc-icon-btn"><CloseGlyph /></button>
        </div>

        {showList ? (
          <div className="kc-body">
            {!groupsLoaded ? (
              <div className="kc-center" style={{ height: '100%' }}><Spinner size={28} /></div>
            ) : groups.length === 0 ? (
              <div className="kc-empty" style={{ height: '100%' }}>
                <div className="kc-empty-ic"><ChatGlyph /></div>
                <span className="kc-empty-title">No chats yet</span>
              </div>
            ) : (
              groups.map((g) => (
                <GroupRow key={g.id} group={g} unread={unread[g.id] ?? 0} onOpen={() => void enterRoom(g.id)} />
              ))
            )}
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              myUserId={myUserId}
              loading={loadingHistory && messages.length === 0}
              loadingMore={loadingMore}
              seenLabel={seenLabel}
              ownLastId={ownLast?.id ?? 0}
              onReachTop={() => void loadMore()}
              onReply={(m) => setReply(m)}
              onImage={(url) => setLightbox(url)}
            />
            {reply && (
              <div className="kc-reply-bar">
                <div className="kc-reply-info">
                  <span className="kc-reply-name">{reply.senderName || 'Player'}</span>
                  <span className="kc-reply-text">{reply.imageUrl && !reply.content ? 'Photo' : reply.content}</span>
                </div>
                <button type="button" className="kc-icon-btn" onClick={() => setReply(null)}><XGlyph /></button>
              </div>
            )}
            <Composer
              sending={sending}
              imageEnabled={imageEnabled}
              participants={participants}
              onSend={(p) => send({ ...p, replyToId: reply ? reply.id : undefined })}
              onTyping={emitTyping}
            />
          </>
        )}
      </div>
      {lightbox !== '' && (
        <div className="kc-lightbox" onClick={() => setLightbox('')}>
          <img src={lightbox} alt="" />
        </div>
      )}
    </div>
  )
}

export const ChatWidget = () => {
  const enabled = useAppConfigStore((s) => s.groupChatEnabled)
  const token = useAuthStore((s) => s.token)
  const open = useChatStore((s) => s.open)
  const openPanel = useChatStore((s) => s.openPanel)
  const closePanel = useChatStore((s) => s.closePanel)
  const totalUnread = useTotalUnread()

  useEffect(() => {
    if ((!enabled || !token) && open) closePanel()
  }, [enabled, token, open, closePanel])

  if (!enabled || !token) return null

  return (
    <div className="kc-root">
      <div className="kc-fab-wrap">
        <button type="button" onClick={openPanel} aria-label="Open community chat" className="kc-fab">
          <ChatGlyph className="" />
          {totalUnread > 0 && <span className="kc-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>}
        </button>
      </div>
      {open && <ChatPanel onClose={closePanel} />}
    </div>
  )
}
