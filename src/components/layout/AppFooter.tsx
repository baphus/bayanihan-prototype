const footerLinks = ['Privacy Policy', 'Terms of Service', 'Accessibility', 'Contact Support']

export default function AppFooter() {
  return (
    <footer className="w-full border-t-4 border-sky-900 bg-slate-100 dark:border-sky-700 dark:bg-slate-900">
      <div className="flex w-full flex-col items-center justify-between gap-8 px-12 py-12 md:flex-row">
        <div className="flex max-w-md flex-col gap-4">
          <span className="font-headline text-lg font-bold text-sky-900 dark:text-sky-200">Bayanihan One Window System</span>
          <p className="text-[12px] leading-relaxed text-slate-500">
            A centralized digital infrastructure for the Bureau of Migrant Workers, enhancing the Philippine government&apos;s commitment to the welfare of overseas workers.
          </p>
          <p className="mt-2 text-[10px] font-medium tracking-tight text-slate-400">
            In compliance with the Data Privacy Act of 2012 (RA 10173).
          </p>
        </div>

        <div className="flex flex-col gap-6 md:items-end">
          <div className="flex flex-wrap justify-center gap-6 md:justify-end">
            {footerLinks.map((linkLabel) => (
              <a
                key={linkLabel}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-sky-700 dark:text-slate-500 dark:hover:text-sky-200"
                href="#"
              >
                {linkLabel}
              </a>
            ))}
          </div>
          <div className="text-center text-[9px] uppercase tracking-widest text-slate-500 md:text-right">
            © 2026 Bayanihan One Window System. All Rights Reserved. Bureau of Migrant Workers.
          </div>
        </div>
      </div>
    </footer>
  )
}
