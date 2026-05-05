import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'outline' | 'mint'
type ButtonSize = 'md' | 'lg'

type BaseButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
  icon?: string
}

type AppButtonProps = BaseButtonProps & ButtonHTMLAttributes<HTMLButtonElement>

type AppAnchorButtonProps = BaseButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    useRouterLink?: boolean
  }

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function buttonStyles({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}) {
  return joinClasses(
    'inline-flex items-center justify-center gap-2 font-bold transition-all rounded-none',
    size === 'md' ? 'px-6 py-2.5 text-[14px]' : 'px-8 py-4 text-base',
    variant === 'primary' && 'bg-[#005288] text-white hover:brightness-110 active:scale-95',
    variant === 'outline' && 'border border-[#c1c7d1] text-[#005288] hover:bg-slate-50',
    variant === 'mint' &&
      'bg-[#94f0df] text-[#006f62] hover:bg-[#7ad7c6] disabled:cursor-not-allowed disabled:opacity-60',
    fullWidth && 'w-full',
    className,
  )
}

function ButtonContent({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <>
      {icon ? (
        <span className="material-symbols-outlined" data-icon={icon}>
          {icon}
        </span>
      ) : null}
      {children}
    </>
  )
}

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  icon,
  type = 'button',
  ...buttonProps
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...buttonProps}
    >
      <ButtonContent icon={icon}>{children}</ButtonContent>
    </button>
  )
}

export function AppAnchorButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  icon,
  href,
  useRouterLink,
  ...anchorProps
}: AppAnchorButtonProps) {
  const classes = buttonStyles({ variant, size, fullWidth, className })

  if (useRouterLink) {
    return (
      <Link to={href} className={classes}>
        <ButtonContent icon={icon}>{children}</ButtonContent>
      </Link>
    )
  }

  return (
    <a href={href} className={classes} {...anchorProps}>
      <ButtonContent icon={icon}>{children}</ButtonContent>
    </a>
  )
}
