import { useState } from 'react';
import { TopNavbar } from '@/components/TopNavbar';
import { BottomBar } from '@/components/BottomBar';
import { SceneModule } from '@/components/SceneModule';
import { AnalysisModule } from '@/components/AnalysisModule';
import { TimelineModule } from '@/components/TimelineModule';
import { ProfilingModule } from '@/components/ProfilingModule';
import { CaseProvider } from '@/lib/CaseContext';
import { TimelineProvider } from '@/lib/TimelineContext';

type ModuleTab = 'scene' | 'analysis' | 'timeline' | 'profiling';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ModuleTab>('scene');

  return (
    <CaseProvider>
      <TimelineProvider>
        <div className="h-screen flex flex-col overflow-hidden haze-bg grid-bg">
          <TopNavbar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex">
              {activeTab === 'scene' && <SceneModule />}
              {activeTab === 'analysis' && <AnalysisModule />}
              {activeTab === 'timeline' && <TimelineModule />}
              {activeTab === 'profiling' && <ProfilingModule />}
            </div>
          </div>
          <BottomBar />
        </div>
      </TimelineProvider>
    </CaseProvider>
  );
};

export default Index;
