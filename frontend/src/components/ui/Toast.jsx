import { useToastStore } from '../../hooks/useToast'

export default function Toast() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
            t.type === 'error'
              ? 'bg-red-900/90 border border-red-700 text-red-100'
              : 'bg-green-900/90 border border-green-700 text-green-100'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
