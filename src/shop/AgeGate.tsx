import { Flame, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui'

const KEY = 'brasa-age-ok'

const readOk = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function AgeGate({ storeName }: { storeName: string }) {
  const [ok, setOk] = useState(readOk)
  const [denied, setDenied] = useState(false)
  if (ok) return null

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* navegação privada: só não lembra */
    }
    setOk(true)
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-stone-950/95 p-6 backdrop-blur-md">
      <div className="smoke absolute inset-0" />
      <div className="animate-rise relative w-full max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
          <Flame className="size-7" />
        </span>
        <h2 className="mt-5 font-display text-3xl text-stone-50">{storeName}</h2>
        {denied ? (
          <p className="mt-4 text-sm text-stone-400">
            Que pena! A venda destes produtos é proibida para menores de 18 anos. Volte quando puder. 👋
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-stone-400">
              Este site comercializa produtos de tabacaria. Para continuar, confirme que você tem 18 anos ou mais.
            </p>
            <div className="mt-6 grid gap-2">
              <Button variant="primary" size="lg" icon={ShieldCheck} onClick={accept}>
                Tenho 18 anos ou mais
              </Button>
              <Button variant="ghost" onClick={() => setDenied(true)}>
                Sou menor de idade
              </Button>
            </div>
          </>
        )}
        <p className="mt-8 text-[11px] leading-relaxed text-stone-500">
          O Ministério da Saúde adverte: fumar causa câncer e outras doenças graves.
        </p>
      </div>
    </div>
  )
}
