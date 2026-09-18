'use client'

export default function Boot() {
  return (
    <div className="os-boot">
      <div className="os-boot-logo">
        <i className="bi-windows" />
      </div>
      <p className="text-2xl font-semibold tracking-[0.35em] uppercase">browserOS</p>
      <div className="os-boot-dots">
        <i />
        <i />
        <i />
      </div>
      <p className="os-boot-caption">Powered by Next.js</p>
    </div>
  )
}