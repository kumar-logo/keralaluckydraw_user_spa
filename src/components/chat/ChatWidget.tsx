import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useAppConfigStore } from '../../stores/configStore'
import { useChatStore } from '../../stores/chatStore'
import { emitChatTyping } from '../../hooks/useChatSocket'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { decodeJwtUserId } from '../../utils/jwt'
import { resolveAvatarUrl, DEFAULT_AVATAR_URL } from '../../utils/helpers'
import { toast } from '../../utils/toast'
import { MessageKind, TickState, JoinPolicy, PostPolicy, GroupType, SenderRole, RecState } from '../../services/chatTypes'
import { VoiceBubble } from './VoiceBubble'
import {
  chatMediaUrl,
  uploadChatImage,
  getChatReaders,
  getDmReceipts,
  type ChatGroup,
  type ChatDm,
  type DiscoverGroup,
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
const MicGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
)
const ReplyGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M10 9V5l-7 7 7 7v-4c5 0 8 1.5 9 5 .5-6-2-11-9-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
)
const XGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
)
const DiscoverGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M15.5 8.5l-2 5-5 2 2-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
)
const SupportGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M5 13v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><rect x="3.5" y="12.5" width="3.5" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" /><rect x="17" y="12.5" width="3.5" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" /><path d="M19 18v.4a3 3 0 0 1-3 3h-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
)
const ClockTick = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M8 5v3.2l2 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const SingleTick = () => (
  <svg viewBox="0 0 16 12" width="15" height="11" fill="none"><path d="M2 6.4l3.2 3.3L14 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const DoubleTick = () => (
  <svg viewBox="0 0 17 11" width="17" height="11" fill="none"><path d="M1 5.6l2.6 2.7L9 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.2 5.6l2.6 2.7L14.2 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

const Ticks = ({ state }: { state: TickState }) => {
  if (state === TickState.Pending) return <span className="kc-ticks"><ClockTick /></span>
  if (state === TickState.Sent) return <span className="kc-ticks"><SingleTick /></span>
  if (state === TickState.Delivered) return <span className="kc-ticks"><DoubleTick /></span>
  return <span className="kc-ticks kc-ticks-seen"><DoubleTick /></span>
}

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
const MUTED_NOTICE = 'You are muted — you cannot send messages'
const muteNotice = (until: string | null): string => {
  if (until === null) return MUTED_NOTICE
  const d = new Date(until)
  if (Number.isNaN(d.getTime())) return MUTED_NOTICE
  return `You are muted until ${dateLabel(until)} ${formatTime(until)}`
}

const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const previewText = (kind: string, content: string, hasImage: boolean): string => {
  if (kind === MessageKind.Voice) return 'Voice message'
  if (content !== '') return content
  if (hasImage) return 'Photo'
  return ''
}

const Avatar = ({ src, name, size }: { src: string; name: string; size: number }) => (
  <div className="kc-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
    {src ? (
      <img
        src={resolveAvatarUrl(src)}
        alt={name}
        onError={(e) => {
          const el = e.currentTarget
          if (el.dataset.fallback) return
          el.dataset.fallback = '1'
          el.src = DEFAULT_AVATAR_URL
        }}
      />
    ) : (
      <span>{(name || '#').charAt(0).toUpperCase()}</span>
    )}
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
        mine: myUserId !== '' && m.userId === myUserId && m.senderRole === SenderRole.User,
        isAdmin: m.senderRole === SenderRole.Admin,
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
  tick,
  onReply,
  onImage,
  onQuoteClick,
}: {
  msg: ChatMessage
  mine: boolean
  isAdmin: boolean
  tick: TickState | null
  onReply: (m: ChatMessage) => void
  onImage: (url: string) => void
  onQuoteClick: (id: number) => void
}) => {
  const cls = mine ? 'kc-bubble kc-bubble-me' : isAdmin ? 'kc-bubble kc-bubble-admin' : 'kc-bubble kc-bubble-other'
  const reply = msg.replyTo
  const image = msg.imageUrl
  const isVoice = msg.kind === MessageKind.Voice && msg.audioUrl !== null && msg.audioUrl !== ''
  return (
    <div className="kc-bubble-wrap">
      <div className={cls}>
        {reply && (
          <button type="button" className="kc-quote" onClick={() => onQuoteClick(reply.id)}>
            <span className="kc-quote-name">{reply.senderName || 'Player'}</span>
            <span className="kc-quote-text">
              {previewText(reply.kind, reply.content, reply.imageUrl !== null)}
            </span>
          </button>
        )}
        {isVoice ? (
          <VoiceBubble audioUrl={msg.audioUrl ?? ''} durationMs={msg.durationMs} waveform={msg.audioWaveform} mine={mine} />
        ) : (
          <>
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
          </>
        )}
        <span className="kc-t">
          {formatTime(msg.createdAt)}
          {mine && tick !== null && <Ticks state={tick} />}
        </span>
      </div>
      <button type="button" className="kc-reply-btn" onClick={() => onReply(msg)} aria-label="Reply">
        <ReplyGlyph />
      </button>
    </div>
  )
}

const RunView = ({
  block,
  getTick,
  onReply,
  onImage,
  onQuoteClick,
}: {
  block: RunBlock
  getTick: (m: ChatMessage) => TickState
  onReply: (m: ChatMessage) => void
  onImage: (url: string) => void
  onQuoteClick: (id: number) => void
}) => {
  if (block.mine) {
    return (
      <div className="kc-run kc-me">
        {block.items.map((m) => (
          <div className="kc-line" key={m.id} data-mid={m.id}>
            <Bubble msg={m} mine isAdmin={false} tick={getTick(m)} onReply={onReply} onImage={onImage} onQuoteClick={onQuoteClick} />
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
          <Bubble msg={m} mine={false} isAdmin={block.isAdmin} tick={null} onReply={onReply} onImage={onImage} onQuoteClick={onQuoteClick} />
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
  getTick,
  onReachTop,
  onReply,
  onImage,
}: {
  messages: ChatMessage[]
  myUserId: string
  loading: boolean
  loadingMore: boolean
  getTick: (m: ChatMessage) => TickState
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
            <RunView key={b.key} block={b} getTick={getTick} onReply={onReply} onImage={onImage} onQuoteClick={quoteScroll} />
          ),
        )
      )}
      <div ref={bottomRef} />
    </div>
  )
}

const Composer = ({
  sending,
  imageEnabled,
  participants,
  onSend,
  onVoice,
  onTyping,
}: {
  sending: boolean
  imageEnabled: boolean
  participants: Participant[]
  onSend: (payload: { content: string; imageUrl?: string; mentions?: string[] }) => Promise<boolean>
  onVoice: (blob: Blob, durationMs: number, waveform: string) => Promise<boolean>
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
  const recorder = useVoiceRecorder()

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

  const stopAndSend = async () => {
    const result = await recorder.stop()
    if (result === null) return
    void onVoice(result.blob, result.durationMs, result.waveform)
  }

  const suggestions =
    mentionQuery !== null
      ? participants
          .filter((p) => p.name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
          .slice(0, 6)
      : []

  const recActive =
    recorder.state === RecState.Requesting ||
    recorder.state === RecState.Recording ||
    recorder.state === RecState.Encoding
  const showMic = recorder.supported && text.trim() === '' && staged === ''

  return (
    <div className="kc-composer-wrap">
      {emojiOpen && !recActive && (
        <div className="kc-emoji">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className="kc-emoji-item" onClick={() => insertEmoji(e)}>{e}</button>
          ))}
        </div>
      )}
      {suggestions.length > 0 && !recActive && (
        <div className="kc-mentions">
          {suggestions.map((p) => (
            <button key={p.userId} type="button" className="kc-mention-item" onClick={() => pickMention(p)}>
              <Avatar src={p.avatar} name={p.name} size={26} />
              <span>{p.name || 'Player'}</span>
            </button>
          ))}
        </div>
      )}
      {staged !== '' && !recActive && (
        <div className="kc-staged">
          <img src={chatMediaUrl(staged)} alt="" />
          <button type="button" className="kc-staged-x" onClick={() => setStaged('')}><XGlyph /></button>
        </div>
      )}
      {recActive ? (
        <div className="kc-composer kc-rec">
          <button type="button" className="kc-comp-btn kc-rec-cancel" onClick={recorder.cancel} aria-label="Cancel recording"><XGlyph /></button>
          <div className="kc-rec-main">
            <span className="kc-rec-dot" />
            <span className="kc-rec-label">
              {recorder.state === RecState.Requesting
                ? 'Starting…'
                : recorder.state === RecState.Encoding
                  ? 'Processing…'
                  : formatDuration(recorder.elapsedMs)}
            </span>
          </div>
          <button
            type="button"
            className="kc-send"
            onClick={() => void stopAndSend()}
            disabled={recorder.state !== RecState.Recording}
            aria-label="Send voice"
          >
            {recorder.state === RecState.Encoding ? <Spinner size={20} onPrimary /> : <SendGlyph />}
          </button>
        </div>
      ) : (
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
          {showMic ? (
            <button type="button" className="kc-send kc-mic" onClick={() => void recorder.start()} aria-label="Record voice"><MicGlyph /></button>
          ) : (
            <button type="button" onClick={() => void submit()} disabled={sending || uploading || (text.trim() === '' && staged === '')} className="kc-send">
              {sending ? <Spinner size={20} onPrimary /> : <SendGlyph />}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const GroupRow = ({ group, unread, mention, onOpen }: { group: ChatGroup; unread: number; mention: number; onOpen: () => void }) => {
  const preview = group.lastMessage
    ? previewText(group.lastMessage.kind, group.lastMessage.content, group.lastMessage.imageUrl !== null)
    : group.type === GroupType.Private
      ? 'Private group'
      : 'Public group'
  return (
    <button type="button" onClick={onOpen} className="kc-grouprow">
      <Avatar src={group.avatar} name={group.name} size={48} />
      <div className="kc-grouprow-main">
        <span className="kc-grouprow-name">
          {group.name}
          {group.type === GroupType.Private && <span className="kc-tag">Private</span>}
        </span>
        <span className="kc-grouprow-sub">
          {group.lastMessage && group.lastMessage.senderName ? `${group.lastMessage.senderName}: ` : ''}
          {preview}
        </span>
      </div>
      <div className="kc-pill-col">
        {mention > 0 && <span className="kc-pill kc-pill-mention">@{mention > 99 ? '99+' : mention}</span>}
        {unread > 0 && <span className="kc-pill">{unread > 99 ? '99+' : unread}</span>}
      </div>
    </button>
  )
}

const DmRow = ({ dm, unread, onOpen }: { dm: ChatDm; unread: number; onOpen: () => void }) => {
  const name = dm.peer.name !== '' ? dm.peer.name : 'Support'
  const preview = dm.lastMessage
    ? previewText(dm.lastMessage.kind, dm.lastMessage.content, dm.lastMessage.imageUrl !== null)
    : 'Chat with support'
  return (
    <button type="button" onClick={onOpen} className="kc-grouprow">
      <Avatar src={dm.peer.avatar} name={name} size={48} />
      <div className="kc-grouprow-main">
        <span className="kc-grouprow-name">
          {name}
          <span className="kc-tag kc-tag-support">Support</span>
        </span>
        <span className="kc-grouprow-sub">
          {dm.lastMessage && dm.lastMessage.senderName ? `${dm.lastMessage.senderName}: ` : ''}
          {preview}
        </span>
      </div>
      <div className="kc-pill-col">
        {unread > 0 && <span className="kc-pill">{unread > 99 ? '99+' : unread}</span>}
      </div>
    </button>
  )
}

const DiscoverRow = ({ group, joining, onJoin, onPreview }: { group: DiscoverGroup; joining: boolean; onJoin: () => void; onPreview: () => void }) => (
  <div className="kc-discoverrow">
    <button type="button" className="kc-discoverrow-main" onClick={onPreview}>
      <Avatar src={group.avatar} name={group.name} size={44} />
      <div className="kc-grouprow-main">
        <span className="kc-grouprow-name">{group.name}</span>
        <span className="kc-grouprow-sub">
          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          {group.description !== '' ? ` · ${group.description}` : ''}
        </span>
      </div>
    </button>
    {group.joined ? (
      <span className="kc-join-done">Joined</span>
    ) : (
      <button type="button" className="kc-join-btn" onClick={onJoin} disabled={joining}>
        {joining ? <Spinner size={16} onPrimary /> : 'Join'}
      </button>
    )}
  </div>
)

interface ActiveConv {
  id: number
  name: string
  avatar: string
  type: string
  isDm: boolean
  joined: boolean
  joinPolicy: string
  postPolicy: string
  sub: string
  preview: boolean
}

const ChatPanel = ({ onClose }: { onClose: () => void }) => {
  const groups = useChatStore((s) => s.groups)
  const groupsLoaded = useChatStore((s) => s.groupsLoaded)
  const dms = useChatStore((s) => s.dms)
  const discover = useChatStore((s) => s.discover)
  const discoverLoaded = useChatStore((s) => s.discoverLoaded)
  const loadingDiscover = useChatStore((s) => s.loadingDiscover)
  const discoverCursor = useChatStore((s) => s.discoverCursor)
  const joiningId = useChatStore((s) => s.joiningId)
  const previewId = useChatStore((s) => s.previewId)
  const inRoom = useChatStore((s) => s.inRoom)
  const activeGroupId = useChatStore((s) => s.activeGroupId)
  const messagesByGroup = useChatStore((s) => s.messagesByGroup)
  const unread = useChatStore((s) => s.unread)
  const mentionUnread = useChatStore((s) => s.mentionUnread)
  const typing = useChatStore((s) => s.typing)
  const reads = useChatStore((s) => s.reads)
  const deliveries = useChatStore((s) => s.deliveries)
  const reply = useChatStore((s) => s.reply)
  const loadingHistory = useChatStore((s) => s.loadingHistory)
  const loadingMore = useChatStore((s) => s.loadingMore)
  const sending = useChatStore((s) => s.sending)
  const muted = useChatStore((s) => s.muted)
  const mutedUntil = useChatStore((s) => s.mutedUntil)
  const enterRoom = useChatStore((s) => s.enterRoom)
  const backToList = useChatStore((s) => s.backToList)
  const loadMore = useChatStore((s) => s.loadMore)
  const send = useChatStore((s) => s.send)
  const sendVoice = useChatStore((s) => s.sendVoice)
  const setReply = useChatStore((s) => s.setReply)
  const receiveRead = useChatStore((s) => s.receiveRead)
  const seedDmReceipts = useChatStore((s) => s.seedDmReceipts)
  const loadDiscover = useChatStore((s) => s.loadDiscover)
  const join = useChatStore((s) => s.join)
  const openSupport = useChatStore((s) => s.openSupport)
  const previewDiscover = useChatStore((s) => s.previewDiscover)

  const imageEnabled = useAppConfigStore((s) => s.groupChatImageEnabled)
  const token = useAuthStore((s) => s.token)
  const myUserId = useMemo(() => decodeJwtUserId(token), [token])

  const [lightbox, setLightbox] = useState<string>('')
  const [listMode, setListMode] = useState<'home' | 'discover'>('home')
  const [openingSupport, setOpeningSupport] = useState(false)
  const typingRef = useRef(0)

  const activeConv = useMemo<ActiveConv | null>(() => {
    if (activeGroupId === null) return null
    const g = groups.find((x) => x.id === activeGroupId)
    if (g !== undefined) {
      return {
        id: g.id,
        name: g.name,
        avatar: g.avatar,
        type: g.type,
        isDm: false,
        joined: g.joined,
        joinPolicy: g.joinPolicy,
        postPolicy: g.postPolicy,
        sub: g.type === GroupType.Private ? 'Private group' : 'Public group',
        preview: false,
      }
    }
    const d = dms.find((x) => x.id === activeGroupId)
    if (d !== undefined) {
      const name = d.peer.name !== '' ? d.peer.name : 'Support'
      return {
        id: d.id,
        name,
        avatar: d.peer.avatar,
        type: GroupType.Private,
        isDm: true,
        joined: true,
        joinPolicy: JoinPolicy.Invite,
        postPolicy: PostPolicy.All,
        sub: 'Support',
        preview: false,
      }
    }
    const dg = discover.find((x) => x.id === activeGroupId)
    if (dg !== undefined) {
      return {
        id: dg.id,
        name: dg.name,
        avatar: dg.avatar,
        type: GroupType.Public,
        isDm: false,
        joined: dg.joined,
        joinPolicy: dg.joinPolicy,
        postPolicy: dg.postPolicy,
        sub: `${dg.memberCount} ${dg.memberCount === 1 ? 'member' : 'members'}`,
        preview: previewId === dg.id,
      }
    }
    return null
  }, [activeGroupId, groups, dms, discover, previewId])

  const showList = !inRoom || activeConv === null
  const isPreview = activeConv !== null && activeConv.preview
  const readOnly = activeConv !== null && activeConv.postPolicy === PostPolicy.AdminOnly
  const receiptsConv = activeConv !== null && (activeConv.isDm || activeConv.type === GroupType.Private)

  const messages = useMemo(
    () => (activeGroupId !== null ? (messagesByGroup[activeGroupId] ?? []) : []),
    [activeGroupId, messagesByGroup],
  )

  const participants = useMemo<Participant[]>(() => {
    const map = new Map<string, Participant>()
    for (const m of messages) {
      if (m.senderRole === SenderRole.User && m.userId !== myUserId && !map.has(m.userId)) {
        map.set(m.userId, { userId: m.userId, name: m.senderName, avatar: m.senderAvatar })
      }
    }
    return Array.from(map.values())
  }, [messages, myUserId])

  const ownLast = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].userId === myUserId && messages[i].senderRole === SenderRole.User) return messages[i]
    }
    return null
  }, [messages, myUserId])

  useEffect(() => {
    if (!inRoom || activeConv === null || activeConv.isDm || activeConv.type !== GroupType.Private || !ownLast) return
    getChatReaders(activeConv.id, ownLast.id)
      .then((r) => {
        for (const reader of r.readers) receiveRead(activeConv.id, reader.userId, ownLast.id)
      })
      .catch(() => undefined)
  }, [inRoom, activeConv, ownLast, receiveRead])

  useEffect(() => {
    if (!inRoom || activeConv === null || !activeConv.isDm || !ownLast) return
    getDmReceipts(activeConv.id)
      .then((r) => seedDmReceipts(activeConv.id, r.peerDeliveredId, r.peerReadId))
      .catch(() => undefined)
  }, [inRoom, activeConv, ownLast, seedDmReceipts])

  const maxRead = useMemo(() => {
    if (activeGroupId === null) return 0
    const map = reads[activeGroupId]
    if (map === undefined) return 0
    let max = 0
    for (const [uid, v] of Object.entries(map)) if (uid !== myUserId && v > max) max = v
    return max
  }, [activeGroupId, reads, myUserId])

  const maxDelivered = useMemo(() => {
    if (activeGroupId === null) return 0
    const map = deliveries[activeGroupId]
    if (map === undefined) return 0
    let max = 0
    for (const [uid, v] of Object.entries(map)) if (uid !== myUserId && v > max) max = v
    return max
  }, [activeGroupId, deliveries, myUserId])

  const getTick = (m: ChatMessage): TickState => {
    if (m.pending === true || m.id < 0) return TickState.Pending
    if (!receiptsConv) return TickState.Sent
    if (maxRead >= m.id) return TickState.Seen
    if (maxDelivered >= m.id) return TickState.Delivered
    return TickState.Sent
  }

  const emitTyping = () => {
    if (activeGroupId === null) return
    const now = Date.now()
    if (now - typingRef.current < TYPING_EMIT_MS) return
    typingRef.current = now
    emitChatTyping(activeGroupId)
  }

  const openDiscover = () => {
    setListMode('discover')
    if (!discoverLoaded) void loadDiscover(true)
  }

  const openSupportThread = async () => {
    if (openingSupport) return
    setOpeningSupport(true)
    const id = await openSupport()
    setOpeningSupport(false)
    if (id !== null) void enterRoom(id)
  }

  const goBack = () => {
    if (inRoom && activeConv !== null) {
      backToList()
      return
    }
    setListMode('home')
  }

  const typingName = activeGroupId !== null ? (typing[activeGroupId] ?? '') : ''
  const showBack = (inRoom && activeConv !== null) || listMode === 'discover'

  return (
    <div className="kc-root">
      <div className="kc-backdrop" onClick={onClose} />
      <div className="kc-panel">
        <div className="kc-header">
          <div className="kc-header-grip" />
          {showBack && (
            <button type="button" onClick={goBack} className="kc-icon-btn"><BackGlyph /></button>
          )}
          {showList ? (
            listMode === 'discover' ? (
              <>
                <span className="kc-icon-btn kc-accent"><DiscoverGlyph /></span>
                <div className="kc-header-info">
                  <span className="kc-header-title">Join groups</span>
                  <span className="kc-header-sub">Find and join communities</span>
                </div>
              </>
            ) : (
              <>
                <span className="kc-icon-btn kc-accent"><ChatGlyph /></span>
                <div className="kc-header-info">
                  <span className="kc-header-title">Community Chat</span>
                  <span className="kc-header-sub">{groups.length} {groups.length === 1 ? 'group' : 'groups'}</span>
                </div>
              </>
            )
          ) : (
            <>
              <Avatar src={activeConv?.avatar ?? ''} name={activeConv?.name ?? ''} size={40} />
              <div className="kc-header-info">
                <span className="kc-header-title">{activeConv?.name}</span>
                <span className="kc-header-sub">
                  {typingName !== '' ? `${typingName} is typing…` : activeConv?.sub}
                </span>
              </div>
            </>
          )}
          <button type="button" onClick={onClose} className="kc-icon-btn"><CloseGlyph /></button>
        </div>

        {showList && listMode === 'home' && (
          <div className="kc-body">
            <div className="kc-list-actions">
              <button type="button" className="kc-action-btn" onClick={openDiscover}>
                <span className="kc-action-ic"><DiscoverGlyph /></span>
                <span>Join groups</span>
              </button>
              <button type="button" className="kc-action-btn" onClick={() => void openSupportThread()} disabled={openingSupport}>
                <span className="kc-action-ic">{openingSupport ? <Spinner size={18} /> : <SupportGlyph />}</span>
                <span>Support</span>
              </button>
            </div>
            {!groupsLoaded ? (
              <div className="kc-center" style={{ padding: '32px 0' }}><Spinner size={28} /></div>
            ) : (
              <>
                {dms.length > 0 && <div className="kc-list-section">Direct messages</div>}
                {dms.map((d) => (
                  <DmRow key={d.id} dm={d} unread={unread[d.id] ?? d.unread} onOpen={() => void enterRoom(d.id)} />
                ))}
                {groups.length > 0 && dms.length > 0 && <div className="kc-list-section">Groups</div>}
                {groups.length === 0 && dms.length === 0 ? (
                  <div className="kc-empty" style={{ padding: '32px 40px' }}>
                    <div className="kc-empty-ic"><ChatGlyph /></div>
                    <span className="kc-empty-title">No chats yet</span>
                    <span className="kc-empty-sub">Join a group or message support</span>
                  </div>
                ) : (
                  groups.map((g) => (
                    <GroupRow key={g.id} group={g} unread={unread[g.id] ?? 0} mention={mentionUnread[g.id] ?? 0} onOpen={() => void enterRoom(g.id)} />
                  ))
                )}
              </>
            )}
          </div>
        )}

        {showList && listMode === 'discover' && (
          <div className="kc-body">
            {!discoverLoaded ? (
              <div className="kc-center" style={{ height: '100%' }}><Spinner size={28} /></div>
            ) : discover.length === 0 ? (
              <div className="kc-empty" style={{ height: '100%' }}>
                <div className="kc-empty-ic"><DiscoverGlyph /></div>
                <span className="kc-empty-title">No groups to discover</span>
              </div>
            ) : (
              <>
                {discover.map((g) => (
                  <DiscoverRow
                    key={g.id}
                    group={g}
                    joining={joiningId === g.id}
                    onJoin={() => void join(g.id).then((ok) => { if (ok) void enterRoom(g.id) })}
                    onPreview={() => previewDiscover(g)}
                  />
                ))}
                {discoverCursor !== null && (
                  <button type="button" className="kc-loadmore" onClick={() => void loadDiscover(false)} disabled={loadingDiscover}>
                    {loadingDiscover ? <Spinner size={18} /> : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {!showList && (
          <>
            <MessageList
              messages={messages}
              myUserId={myUserId}
              loading={loadingHistory && messages.length === 0 && !isPreview}
              loadingMore={loadingMore}
              getTick={getTick}
              onReachTop={() => void loadMore()}
              onReply={(m) => setReply(m)}
              onImage={(url) => setLightbox(url)}
            />
            {isPreview ? (
              <div className="kc-join-cta">
                <span className="kc-join-cta-text">Join this group to send messages</span>
                <button
                  type="button"
                  className="kc-join-btn kc-join-btn-lg"
                  onClick={() => activeConv !== null && void join(activeConv.id).then((ok) => { if (ok) void enterRoom(activeConv.id) })}
                  disabled={activeConv !== null && joiningId === activeConv.id}
                >
                  {activeConv !== null && joiningId === activeConv.id ? <Spinner size={18} onPrimary /> : 'Join group'}
                </button>
              </div>
            ) : muted ? (
              <div className="kc-readonly">
                <span className="kc-readonly-ic"><ChatGlyph /></span>
                <span className="kc-readonly-text">{muteNotice(mutedUntil)}</span>
              </div>
            ) : readOnly ? (
              <div className="kc-readonly">
                <span className="kc-readonly-ic"><ChatGlyph /></span>
                <span className="kc-readonly-text">Only admins can post here</span>
              </div>
            ) : (
              <>
                {reply && (
                  <div className="kc-reply-bar">
                    <div className="kc-reply-info">
                      <span className="kc-reply-name">{reply.senderName || 'Player'}</span>
                      <span className="kc-reply-text">{previewText(reply.kind, reply.content, reply.imageUrl !== null)}</span>
                    </div>
                    <button type="button" className="kc-icon-btn" onClick={() => setReply(null)}><XGlyph /></button>
                  </div>
                )}
                <Composer
                  sending={sending}
                  imageEnabled={imageEnabled}
                  participants={participants}
                  onSend={(p) => send({ ...p, replyToId: reply ? reply.id : undefined })}
                  onVoice={(blob, durationMs, waveform) => sendVoice(blob, durationMs, waveform)}
                  onTyping={emitTyping}
                />
              </>
            )}
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
  const closePanel = useChatStore((s) => s.closePanel)

  useEffect(() => {
    if ((!enabled || !token) && open) closePanel()
  }, [enabled, token, open, closePanel])

  if (!enabled || !token) return null

  return open ? <ChatPanel onClose={closePanel} /> : null
}
