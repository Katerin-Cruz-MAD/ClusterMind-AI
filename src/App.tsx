import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Upload, 
  Table2, 
  BarChart3, 
  Scale, 
  Settings2, 
  Layers, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft,
  Info,
  BrainCircuit,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { AppStep, BusinessContext, ClusteringData } from './types';

// Steps components
import BusinessStep from './components/steps/BusinessStep';
import UploadStep from './components/steps/UploadStep';
import VariableStep from './components/steps/VariableStep';
import EDAStep from './components/steps/EDAStep';
import ScalingStep from './components/steps/ScalingStep';
import SelectionStep from './components/steps/SelectionStep';
import ExecutionStep from './components/steps/ExecutionStep';
import InsightsStep from './components/steps/InsightsStep';

const STEPS = [
  { id: AppStep.BUSINESS_UNDERSTANDING, title: 'Entendimiento', icon: Briefcase },
  { id: AppStep.DATA_UPLOAD, title: 'Identificación', icon: Upload },
  { id: AppStep.VARIABLE_IDENTIFICATION, title: 'EDA Automático', icon: Table2 },
  { id: AppStep.EXPLORATORY_ANALYSIS, title: 'Correlaciones', icon: BarChart3 },
  { id: AppStep.CORRELATION_SCALING, title: 'Normalización', icon: Scale },
  { id: AppStep.CLUSTER_SELECTION, title: 'N° Clusters', icon: Settings2 },
  { id: AppStep.EXECUTION_CLUSTER, title: 'Clustering ML', icon: Layers },
  { id: AppStep.INSIGHTS_PROFILES, title: 'Insights', icon: Lightbulb },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.BUSINESS_UNDERSTANDING);
  const [businessContext, setBusinessContext] = useState<BusinessContext>({
    sector: '',
    context: '',
    problem: '',
    objective: ''
  });
  
  const [data, setData] = useState<ClusteringData | null>(null);

  const handleNext = () => {
    if (currentStep < 7) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case AppStep.BUSINESS_UNDERSTANDING:
        return businessContext.sector && businessContext.objective;
      case AppStep.DATA_UPLOAD:
        return !!data?.originalData;
      case AppStep.VARIABLE_IDENTIFICATION:
        return !!data?.variables?.some(v => v.isUsefulForClustering);
      default:
        return true;
    }
  }, [currentStep, businessContext, data]);

  const renderStep = () => {
    switch (currentStep) {
      case AppStep.BUSINESS_UNDERSTANDING:
        return <BusinessStep context={businessContext} setContext={setBusinessContext} onComplete={handleNext} />;
      case AppStep.DATA_UPLOAD:
        return <UploadStep onDataLoaded={setData} currentData={data} />;
      case AppStep.VARIABLE_IDENTIFICATION:
        return <VariableStep data={data} setData={setData} />;
      case AppStep.EXPLORATORY_ANALYSIS:
        return <EDAStep data={data!} />;
      case AppStep.CORRELATION_SCALING:
        return <ScalingStep data={data!} setData={setData} />;
      case AppStep.CLUSTER_SELECTION:
        return <SelectionStep data={data!} setData={setData} />;
      case AppStep.EXECUTION_CLUSTER:
        return <ExecutionStep data={data!} setData={setData} businessContext={businessContext} />;
      case AppStep.INSIGHTS_PROFILES:
        return <InsightsStep data={data!} businessContext={businessContext} />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
        <Toaster />
        
        {/* Navigation Sidebar - High Density Design */}
        <aside className="w-64 bg-[#5e1032] text-white flex flex-col shrink-0 wine-gradient">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-3 h-3 bg-[#d81b60] rounded-full animate-pulse shadow-[0_0_10px_#d81b60]"></div>
              Analytica ML
            </h1>
            <p className="text-[10px] text-pink-300/60 mt-1 uppercase tracking-widest font-bold">Business Intelligence</p>
          </div>
          
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="px-6 py-2 text-[10px] uppercase font-bold text-pink-200/40 tracking-wider">Flujo de Análisis</div>
            <ul className="mt-2 space-y-1 px-3">
              {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <li 
                    key={step.id}
                    onClick={() => {
                      // Allow navigating to any already completed step or the very next one if canGoNext
                      const canNavigate = step.id <= currentStep || (step.id === currentStep + 1 && canGoNext);
                      if (canNavigate) {
                        setCurrentStep(step.id);
                      } else if (step.id > currentStep + 1) {
                        toast.info("Completa el paso actual para avanzar.");
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all cursor-pointer group active:scale-95",
                      isActive ? "bg-[#d81b60] text-white font-bold shadow-lg pink-glow translate-x-1" : "text-pink-100/60 hover:bg-white/5 hover:text-white",
                      !(step.id <= currentStep || (step.id === currentStep + 1 && canGoNext)) && "opacity-20 cursor-not-allowed"
                    )}
                  >
                    <span className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-lg border text-[10px] font-bold transition-all",
                      isActive ? "bg-white text-[#d81b60] border-white shadow-md" : "border-white/10 bg-white/5 group-hover:bg-white/20",
                      isCompleted && "bg-[#d81b60]/20 text-[#f06292] border-[#d81b60]/50"
                    )}>
                      {step.id + 1}
                    </span>
                    {step.title}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="bg-[#4a0d28] p-5 rounded-2xl text-[11px] leading-relaxed text-pink-200/60 shadow-inner relative overflow-hidden group">
              <div className="relative z-10">
                <p className="font-bold text-white mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Database size={12} className="text-[#d81b60]" />
                  Métrica de Núcleo
                </p>
                <div className="space-y-2">
                    <p className="text-2xl font-black text-white tracking-tighter">98.4%</p>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#d81b60]" style={{ width: '98.4%' }} />
                    </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/10 shadow-lg">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="Analyst" />
                </div>
                <div>
                    <p className="text-xs font-bold text-white tracking-tight">Dr. Julian Rossi</p>
                    <p className="text-[9px] text-pink-200/40 font-medium">Data Scientist Sr.</p>
                </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden technical-grid">
          <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  {STEPS.find(s => s.id === currentStep)?.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {currentStep === AppStep.EXECUTION_CLUSTER 
                    ? `Algoritmo: K-Means | Variables: ${data?.variables.filter(v => v.isUsefulForClustering).length || 0}`
                    : 'Clusterización Inteligente Paso a Paso'}
                </p>
              </div>
              {data?.labels.length > 0 && (
                <span className="px-2 py-1 bg-pink-100 text-[#d81b60] text-[10px] font-bold rounded uppercase tracking-wider border border-pink-200">
                  Analizado ML
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="text-xs border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold"
              >
                <ChevronLeft size={16} className="mr-1" /> Anterior
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canGoNext || currentStep === 7}
                className="text-sm bg-[#8a1a4a] hover:bg-[#5e1032] text-white font-bold px-8 h-10 shadow-lg pink-glow rounded-xl transition-all active:scale-95"
              >
                Siguiente <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </header>

          <div className="flex-1 p-8 overflow-y-auto overflow-x-hidden relative pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="max-w-5xl mx-auto"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

          </div>

          <footer className="h-10 border-t border-slate-200 bg-white px-8 flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0">
            <div className="flex gap-4">
              <span>Estado: Núcleo Analítico Estable</span>
              <span className="hidden md:inline">| Red: Gemini 3 Flash Preview</span>
              <span className="hidden lg:inline text-[#d81b60] font-bold uppercase tracking-widest">• Licencia Académica 2026.1</span>
            </div>
            <div>© 2026 Analytica ML Studio</div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
