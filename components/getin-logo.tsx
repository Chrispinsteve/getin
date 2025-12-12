import Link from "next/link"

interface GetInLogoProps {
  className?: string
  showText?: boolean
}

export function GetInLogo({ className = "", showText = true }: GetInLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
        <span className="text-lg font-bold text-primary-foreground">G</span>
      </div>
      {showText && <span className="text-xl font-semibold text-foreground">GetIn</span>}
    </Link>
  )
}
