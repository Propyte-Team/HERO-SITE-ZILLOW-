interface BadgeProps {
  type: 'preventa' | 'nuevo' | 'entrega_inmediata' | 'construccion';
  label: string;
  className?: string;
}

const badgeStyles = {
  preventa: 'bg-[#F5A623] text-white',
  nuevo: 'bg-[#00B4C8] text-white',
  entrega_inmediata: 'bg-[#22C55E] text-white',
  construccion: 'bg-[#1E3A5F] text-white',
};

export default function Badge({ type, label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded uppercase tracking-wide ${badgeStyles[type]} ${className}`}>
      {label}
    </span>
  );
}
