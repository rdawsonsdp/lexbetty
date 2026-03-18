interface ProductImagePlaceholderProps {
  title: string;
  className?: string;
}

export default function ProductImagePlaceholder({ title, className = '' }: ProductImagePlaceholderProps) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-[#1A1A1A] p-3 ${className}`}
    >
      <span className="font-oswald font-bold text-[#E8621A] text-center text-sm sm:text-base leading-tight tracking-wide uppercase">
        {title}
      </span>
    </div>
  );
}
