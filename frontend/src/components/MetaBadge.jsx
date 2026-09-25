const VARIANTS = {
  default: 'bg-gray-800 text-gray-300 border-gray-700',
  danger: 'bg-red-900/40 text-red-300 border-red-800',
  success: 'bg-green-900/40 text-green-300 border-green-800',
}

export default function MetaBadge({ label, value, variant = 'default' }) {
  const classes = VARIANTS[variant] || VARIANTS.default

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${classes}`}>
      <span className="text-gray-500 font-medium">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  )
}
