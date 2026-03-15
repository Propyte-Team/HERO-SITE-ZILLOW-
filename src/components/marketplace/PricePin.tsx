interface PricePinProps {
  price: string;
  isActive?: boolean;
}

export default function PricePin({ price, isActive = false }: PricePinProps) {
  return (
    <div className={`relative inline-block cursor-pointer transition-transform ${isActive ? 'scale-110 z-10' : ''}`}>
      <div className={`px-2 py-1 rounded text-xs font-bold text-white whitespace-nowrap shadow-[0_2px_6px_rgba(0,0,0,0.2)] ${isActive ? 'bg-[#00B4C8]' : 'bg-[#1E3A5F]'}`}>
        {price}
      </div>
      <div className={`absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${isActive ? 'border-t-[#00B4C8]' : 'border-t-[#1E3A5F]'}`} />
    </div>
  );
}
