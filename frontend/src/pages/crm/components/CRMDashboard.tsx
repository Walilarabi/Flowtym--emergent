import { useState, useEffect, useRef } from 'react';
import { mockGuests, mockSegments, mockCampaigns, mockWorkflows, mockConversations, mockAlerts, mockIntegrations, mockAutoReplies, Guest } from '../data/mockData';
import KPICards from './KPICards';
import GuestList from './GuestList';
import GuestDetail from './GuestDetail';
import Segmentation from './Segmentation';
import Communications from './Communications';
import Workflows from './Workflows';
import Campaigns from './Campaigns';
import Analytics from './Analytics';
import Alerts from './Alerts';
import Integrations from './Integrations';
import AutoReplies from './AutoReplies';
import Configuration from './crm/Configuration';
import Copilot from './crm/Copilot';
import UpsellEngine from './crm/UpsellEngine';
import LoyaltyProgram from './crm/LoyaltyProgram';
import MicroFeedback from './crm/MicroFeedback';
import Sustainability from './crm/Sustainability';
import Marketplace from './crm/Marketplace';
import VoiceConcierge from './crm/VoiceConcierge';
import PredictiveHousekeeping from './crm/PredictiveHousekeeping';
import Community from './crm/Community';

type TabId = 'clients' | 'segments' | 'communications' | 'auto-replies' | 'workflows' | 'campaigns' | 'analytics' | 'connectors' | 'configuration' | 'copilot' | 'upsells' | 'loyalty' | 'feedback' | 'sustainability' | 'marketplace' | 'voice' | 'housekeeping' | 'community';
type Language = 'fr' | 'en';

const innovationTabIds: TabId[] = ['copilot', 'upsells', 'loyalty', 'feedback', 'sustainability', 'marketplace', 'voice', 'housekeeping', 'community'];

const translations = {
  fr: {
    title: 'Flowtym CRM',
    subtitle: "Gestion de la relation client — L'OS qui pense, prédit et agit pour votre hôtel",
    showKPI: 'Afficher les KPI & Alertes',
    hideKPI: 'Masquer les KPI & Alertes',
    openCopilot: 'Ouvrir Flowtym Copilot',
    tabs: {
      clients: 'Clients', segments: 'Segmentation', communications: 'Inbox',
      'auto-replies': 'Réponses Auto', workflows: 'Workflows', campaigns: 'Campagnes',
      innovations: 'Intelligence', analytics: 'Analytics', connectors: 'Connecteurs',
      configuration: 'Configuration', copilot: 'Copilot IA', upsells: 'Upsells',
      loyalty: 'Fidélité', feedback: 'Feedback', sustainability: 'Éco-Score',
      marketplace: 'Marketplace', voice: 'Voice Concierge', housekeeping: 'Housekeeping',
      community: 'Community'
    }
  },
  en: {
    title: 'Flowtym CRM',
    subtitle: 'Customer Relationship Management — The OS that thinks, predicts and acts for your hotel',
    showKPI: 'Show KPIs & Alerts',
    hideKPI: 'Hide KPIs & Alerts',
    openCopilot: 'Open Flowtym Copilot',
    tabs: {
      clients: 'Clients', segments: 'Segmentation', communications: 'Inbox',
      'auto-replies': 'Auto Replies', workflows: 'Workflows', campaigns: 'Campaigns',
      innovations: 'Intelligence', analytics: 'Analytics', connectors: 'Connectors',
      configuration: 'Configuration', copilot: 'Copilot AI', upsells: 'Upsells',
      loyalty: 'Loyalty', feedback: 'Feedback', sustainability: 'Eco-Score',
      marketplace: 'Marketplace', voice: 'Voice Concierge', housekeeping: 'Housekeeping',
      community: 'Community'
    }
  }
};

const mainTabs = [
  { id: 'clients', icon: '👥' },
  { id: 'segments', icon: '🎯' },
  { id: 'communications', icon: '💬' },
  { id: 'auto-replies', icon: '🤖' },
  { id: 'workflows', icon: '⚙️' },
  { id: 'campaigns', icon: '📧' },
];

const afterInnovationTabs = [
  { id: 'analytics', icon: '📊' },
  { id: 'connectors', icon: '🔗' },
  { id: 'configuration', icon: '🛠️' },
];

const innovationTabs = [
  { id: 'copilot', icon: '🧠' },
  { id: 'upsells', icon: '💎' },
  { id: 'loyalty', icon: '🏆' },
  { id: 'feedback', icon: '📝' },
  { id: 'sustainability', icon: '🌱' },
  { id: 'marketplace', icon: '🏪' },
  { id: 'voice', icon: '🎙️' },
  { id: 'housekeeping', icon: '🧹' },
  { id: 'community', icon: '🌐' },
];

export default function CRMDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('clients');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [language, setLanguage] = useState<Language>('fr');
  const [showKPI, setShowKPI] = useState(true);
  const [innovationsOpen, setInnovationsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = translations[language];
  const isInnovationActive = innovationTabIds.includes(activeTab);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setInnovationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (id: string) => {
    setActiveTab(id as TabId);
    setSelectedGuest(null);
    setInnovationsOpen(false);
  };

  const handleInnovationClick = (id: string) => {
    setActiveTab(id as TabId);
    setInnovationsOpen(false);
    setSelectedGuest(null);
  };

  const tabClass = (id: string) =>
    `px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
      activeTab === id
        ? 'bg-purple-600 text-white shadow-md'
        : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
    }`;

  return (
    <div id="crmContent" className="min-h-screen bg-[#F8FAFC] p-6 font-sans">

      {/* ── HEADER ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-md">F</div>
            <h1 className="text-3xl font-bold text-[#0F172A]">{t.title}</h1>
          </div>
          <p className="text-slate-500 text-sm ml-13 pl-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* KPI Toggle */}
          <button
            onClick={() => setShowKPI(!showKPI)}
            title={showKPI ? t.hideKPI : t.showKPI}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all shadow-sm ${
              showKPI
                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-600'
            }`}
          >
            {showKPI ? '🙈' : '👁️'} {showKPI ? t.hideKPI : t.showKPI}
          </button>
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:text-purple-600 text-sm font-medium transition-all shadow-sm"
          >
            {language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
          </button>
        </div>
      </div>

      {/* ── KPI + ALERTS (masquables) ── */}
      {showKPI && (
        <div className="mb-6">
          <KPICards language={language} />
          <div className="mt-4">
            <Alerts alerts={mockAlerts} language={language} />
          </div>
        </div>
      )}

      {/* ── NAVIGATION ── */}
      <div className="mb-6 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
        <div className="flex items-center gap-1 flex-wrap">

          {/* Main tabs BEFORE Innovations */}
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={tabClass(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{t.tabs[tab.id as keyof typeof t.tabs]}</span>
            </button>
          ))}

          {/* ── INTELLIGENCE DROPDOWN ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setInnovationsOpen(!innovationsOpen)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                isInnovationActive || innovationsOpen
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <span>{t.tabs.innovations}</span>
              <span className={`text-xs transition-transform duration-200 ${innovationsOpen ? 'rotate-180' : ''}`}>▼</span>
              {isInnovationActive && !innovationsOpen && (
                <span className="ml-1 w-2 h-2 rounded-full bg-white opacity-80 inline-block"></span>
              )}
            </button>

            {/* Dropdown Panel */}
            {innovationsOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-purple-100 p-2 w-64">
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider px-3 py-2 mb-1">
                  {language === 'fr' ? 'Modules Intelligence' : 'Intelligence Modules'}
                </div>
                {innovationTabs.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleInnovationClick(sub.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === sub.id
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <span className="text-base">{sub.icon}</span>
                    <span>{t.tabs[sub.id as keyof typeof t.tabs]}</span>
                    {activeTab === sub.id && <span className="ml-auto text-xs">●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main tabs AFTER Innovations */}
          {afterInnovationTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={tabClass(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{t.tabs[tab.id as keyof typeof t.tabs]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="space-y-6">
        {activeTab === 'clients' && (
          selectedGuest
            ? <GuestDetail guest={selectedGuest} onBack={() => setSelectedGuest(null)} />
            : <GuestList guests={mockGuests} onSelectGuest={setSelectedGuest} />
        )}
        {activeTab === 'segments' && <Segmentation segments={mockSegments} />}
        {activeTab === 'communications' && <Communications conversations={mockConversations} language={language} />}
        {activeTab === 'auto-replies' && <AutoReplies autoReplies={mockAutoReplies} />}
        {activeTab === 'workflows' && <Workflows workflows={mockWorkflows} />}
        {activeTab === 'campaigns' && <Campaigns campaigns={mockCampaigns} />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'connectors' && <Integrations integrations={mockIntegrations} />}
        {activeTab === 'configuration' && <Configuration />}
        {activeTab === 'copilot' && <Copilot language={language} />}
        {activeTab === 'upsells' && <UpsellEngine language={language} />}
        {activeTab === 'loyalty' && <LoyaltyProgram language={language} />}
        {activeTab === 'feedback' && <MicroFeedback language={language} />}
        {activeTab === 'sustainability' && <Sustainability language={language} />}
        {activeTab === 'marketplace' && <Marketplace language={language} />}
        {activeTab === 'voice' && <VoiceConcierge language={language} />}
        {activeTab === 'housekeeping' && <PredictiveHousekeeping language={language} />}
        {activeTab === 'community' && <Community language={language} />}
      </div>

      {/* ── FLOATING COPILOT BUTTON ── */}
      <button
        onClick={() => { setActiveTab('copilot'); setInnovationsOpen(false); }}
        title={t.openCopilot}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center text-2xl z-40"
      >
        🧠
      </button>
    </div>
  );
}
