import { X, type LucideIcon } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { create } from 'zustand'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'whatsapp'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-amber-500 text-stone-950 hover:bg-amber-400 font-semibold',
  secondary: 'bg-white/5 text-stone-100 hover:bg-white/10 border border-white/10',
  ghost: 'text-stone-300 hover:bg-white/5 hover:text-white',
  danger: 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20',
  success: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold',
  whatsapp: 'bg-[#25D366] text-[#052e16] hover:brightness-110 font-semibold',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: LucideIcon }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        VARIANTS[variant],
        className,
      )}
    >
      {Icon && <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} />}
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-white/[0.06] bg-zinc-900/60', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div>
        <h3 className="text-sm font-semibold text-stone-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-stone-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type Tone = 'neutral' | 'amber' | 'green' | 'red' | 'blue' | 'violet'
const TONES: Record<Tone, string> = {
  neutral: 'bg-white/5 text-stone-300 ring-white/10',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  green: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  red: 'bg-rose-500/10 text-rose-300 ring-rose-500/25',
  blue: 'bg-sky-500/10 text-sky-300 ring-sky-500/25',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/25',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap', TONES[tone], className)}>
      {children}
    </span>
  )
}

const fieldCls =
  'w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 h-10 text-sm text-stone-100 placeholder:text-stone-500 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(fieldCls, className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(fieldCls, 'pr-8', className)}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cx(fieldCls, 'h-auto py-2 min-h-20', className)} />
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-stone-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-stone-500">{hint}</span>}
    </label>
  )
}

function useEsc(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = prev
    }
  }, [onClose])
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}) {
  if (!open) return null
  return <ModalInner {...{ onClose, title, children, size, footer }} />
}

function ModalInner({ onClose, title, children, size, footer }: { onClose: () => void; title?: ReactNode; children: ReactNode; size: string; footer?: ReactNode }) {
  useEsc(onClose)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cx(
          'animate-rise relative flex max-h-[94vh] w-full flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-lg',
          size === 'lg' && 'sm:max-w-2xl',
          size === 'xl' && 'sm:max-w-4xl',
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
            <div className="text-base font-semibold text-stone-100">{title}</div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-white/5 hover:text-white" aria-label="Fechar">
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/5 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children, footer, width = 'max-w-md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  if (!open) return null
  return <DrawerInner {...{ onClose, title, children, footer, width }} />
}

function DrawerInner({ onClose, title, children, footer, width }: { onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width: string }) {
  useEsc(onClose)
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cx('animate-slide-in relative flex h-full w-full flex-col border-l border-white/10 bg-zinc-900 shadow-2xl', width)}>
        <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
          <div className="text-base font-semibold text-stone-100">{title}</div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-white/5 hover:text-white" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-white/5 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  change,
  tone = 'amber',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: LucideIcon
  change?: number
  tone?: 'amber' | 'green' | 'red' | 'blue' | 'violet'
}) {
  const iconTone = {
    amber: 'bg-amber-500/10 text-amber-300',
    green: 'bg-emerald-500/10 text-emerald-300',
    red: 'bg-rose-500/10 text-rose-300',
    blue: 'bg-sky-500/10 text-sky-300',
    violet: 'bg-violet-500/10 text-violet-300',
  }[tone]
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-stone-400">{label}</p>
        {Icon && (
          <span className={cx('grid size-8 place-items-center rounded-lg', iconTone)}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-50 tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {change !== undefined && Number.isFinite(change) && (
          <span className={change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change * 100).toFixed(1).replace('.', ',')}%
          </span>
        )}
        {hint && <span className="text-stone-500">{hint}</span>}
      </div>
    </Card>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-zinc-950/60 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap',
            value === o.value ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-white/5 text-stone-400">
        <Icon className="size-6" />
      </span>
      <p className="mt-3 text-sm font-medium text-stone-200">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-stone-500">{text}</p>}
    </div>
  )
}

export const th = 'px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-stone-500 whitespace-nowrap'
export const td = 'px-4 py-3 text-sm text-stone-300 whitespace-nowrap'

// ---------- toast ----------
interface ToastState {
  items: { id: number; text: string; tone: 'ok' | 'err' }[]
  push: (text: string, tone?: 'ok' | 'err') => void
}
export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (text, tone = 'ok') => {
    const id = Date.now() + Math.random()
    set((s) => ({ items: [...s.items, { id, text, tone }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3200)
  },
}))
export const toast = (text: string, tone?: 'ok' | 'err') => useToast.getState().push(text, tone)

export function Toaster() {
  const items = useToast((s) => s.items)
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cx(
            'animate-rise rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl ring-1',
            t.tone === 'ok' ? 'bg-emerald-500 text-emerald-950 ring-emerald-300/40' : 'bg-rose-500 text-white ring-rose-300/40',
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
