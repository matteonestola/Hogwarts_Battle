export default function HealthTracker({ current, max }) {
  const pct = Math.max(0, (current / max) * 100)
  const color = pct > 60 ? 'bg-green-500' : pct > 30 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-mono text-hogwarts-parchment/70">{current}/{max}</span>
      <div className="w-16 bg-hogwarts-dark/50 rounded-full h-1.5 border border-hogwarts-parchment/10">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
