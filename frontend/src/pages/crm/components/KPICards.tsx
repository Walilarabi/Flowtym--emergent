interface KPICardsProps {
  language?: 'fr' | 'en';
}

export default function KPICards({ language = 'fr' }: KPICardsProps) {
  const labels = {
    fr: {
      totalClients: 'Clients totaux',
      retentionRate: 'Taux de rétention',
      npsScore: 'Score NPS',
      revenuePerClient: 'CA par client',
      vsLastMonth: 'vs mois dernier'
    },
    en: {
      totalClients: 'Total Clients',
      retentionRate: 'Retention Rate',
      npsScore: 'NPS Score',
      revenuePerClient: 'Revenue per Client',
      vsLastMonth: 'vs last month'
    }
  }[language];

  const kpis = [
    {
      label: labels.totalClients,
      value: '1,247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: '👥',
      gradient: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50',
    },
    {
      label: labels.retentionRate,
      value: '68%',
      change: '-5%',
      changeType: 'negative' as const,
      icon: '🔄',
      gradient: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50',
    },
    {
      label: labels.npsScore,
      value: '72',
      change: '+8 pts',
      changeType: 'positive' as const,
      icon: '⭐',
      gradient: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50',
    },
    {
      label: labels.revenuePerClient,
      value: '1 850€',
      change: '+15%',
      changeType: 'positive' as const,
      icon: '💰',
      gradient: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all border border-slate-100 group">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
              {kpi.icon}
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              kpi.changeType === 'positive'
                ? 'bg-[#D1FAE5] text-[#065F46]'
                : 'bg-[#FEE2E2] text-[#991B1B]'
            }`}>
              {kpi.changeType === 'positive' ? '▲' : '▼'} {kpi.change}
            </span>
          </div>
          <div className="text-[32px] font-bold text-[#0F172A] mb-1 leading-none">
            {kpi.value}
          </div>
          <div className="text-sm text-slate-500 mt-1">{kpi.label}</div>
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${kpi.gradient} rounded-full`}
              style={{ width: kpi.changeType === 'positive' ? '70%' : '40%' }}>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-1">{labels.vsLastMonth}</div>
        </div>
      ))}
    </div>
  );
}
