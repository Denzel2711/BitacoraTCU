'use client';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  tone?: 'cyan' | 'orange' | 'slate';
}

const toneStyles: Record<NonNullable<SectionHeaderProps['tone']>, string> = {
  cyan: 'from-cyan-700 via-cyan-600 to-cyan-500',
  orange: 'from-orange-700 via-orange-600 to-amber-500',
  slate: 'from-slate-700 via-slate-600 to-slate-500',
};

const SectionHeader = ({ title, subtitle, tone = 'cyan' }: SectionHeaderProps) => (
  <div className={`bg-gradient-to-r ${toneStyles[tone]} text-white p-8 md:p-10 relative overflow-hidden`}>
    <div className="absolute inset-0 bg-black opacity-10" />
    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm">{title}</h1>
        <p className="text-sm md:text-base text-white/90 max-w-2xl">{subtitle}</p>
      </div>
      <div className="bg-white/95 p-3 rounded-2xl shadow-lg w-fit">
        <img src="/tcu-logo.png" alt="Logo TCU" className="h-14 w-auto" />
      </div>
    </div>
  </div>
);

export default SectionHeader;