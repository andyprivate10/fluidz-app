import { type ReactNode } from 'react'

export default function PageFadeIn({ children }: { children: ReactNode }) {
  return (
    <div className="page-enter">
      {children}
    </div>
  )
}
