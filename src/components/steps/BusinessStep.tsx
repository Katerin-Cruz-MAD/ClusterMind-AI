import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, Target, HelpCircle, Loader2 } from 'lucide-react';
import { BusinessContext } from '@/types';
import { generateBusinessSummary } from '@/lib/gemini';
import { toast } from 'sonner';

interface BusinessStepProps {
  context: BusinessContext;
  setContext: (ctx: BusinessContext) => void;
  onComplete: () => void;
}

export default function BusinessStep({ context, setContext, onComplete }: BusinessStepProps) {
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!context.sector || !context.objective || !context.problem) {
      toast.error("Por favor, completa los campos principales antes de optimizar.");
      return;
    }
    setLoading(true);
    try {
      const summary = await generateBusinessSummary(context);
      setContext({ ...context, summary });
      toast.success("Resumen optimizado por IA.");
    } catch (error) {
      toast.error("Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">1. Entendimiento del Negocio</h2>
        <p className="text-muted-foreground text-lg font-medium">Define el marco estratégico de tu análisis para orientar el algoritmo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 shadow-xl border-2 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-primary-dark/5 border-b border-primary/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <BrainCircuit size={16} className="text-accent" />
                Inputs de Negocio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector" className="text-xs font-bold uppercase text-primary/70">Sector Industrial</Label>
                  <Input 
                    id="sector" 
                    placeholder="Ej: Retail, Banca, E-commerce..." 
                    value={context.sector}
                    onChange={(e) => setContext({ ...context, sector: e.target.value })}
                    className="focus:ring-accent h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective" className="text-xs font-bold uppercase text-primary/70">Objetivo del Proyecto</Label>
                  <Input 
                    id="objective" 
                    placeholder="Ej: Personalización de Ofertas" 
                    value={context.objective}
                    onChange={(e) => setContext({ ...context, objective: e.target.value })}
                    className="focus:ring-accent h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context" className="text-xs font-bold uppercase text-primary/70">Contexto General</Label>
                <Textarea 
                  id="context" 
                  placeholder="Describe brevemente el escenario actual..." 
                  value={context.context}
                  onChange={(e) => setContext({ ...context, context: e.target.value })}
                  className="min-h-[100px] resize-none focus:ring-accent rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem" className="text-xs font-bold uppercase text-primary/70">Problema a Resolver</Label>
                <Textarea 
                  id="problem" 
                  placeholder="¿Qué dolor de negocio estamos atacando?" 
                  value={context.problem}
                  onChange={(e) => setContext({ ...context, problem: e.target.value })}
                  className="min-h-[100px] resize-none focus:ring-accent rounded-xl"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-primary-dark/5 border-t border-primary/10 justify-between py-4">
              <p className="text-[10px] text-primary/40 italic font-medium">Analytica ML Core: El problema define la segmentación final.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-accent border-accent/20 hover:bg-accent/5 h-9 px-4 rounded-xl font-bold"
                onClick={handleSummarize}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} fill="currentColor" />}
                Optimizar con AI
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="wine-gradient text-white border-none shadow-2xl rounded-3xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110">
              <BrainCircuit size={120} />
            </div>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-[0.3em] text-pink-300">Enfoque Proyectado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10">
              {context.summary ? (
                <p className="text-lg leading-snug font-bold italic text-pink-50">"{context.summary}"</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-sm">
                      <Target size={20} className="text-[#f06292]" />
                    </div>
                    <div className="text-xs text-pink-100/70">
                      <p className="font-black text-white mb-1 uppercase tracking-widest text-[10px]">Propósito</p>
                      La segmentación permite pasar de una estrategia masiva a una hiper-personalizada.
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-sm">
                      <HelpCircle size={20} className="text-[#f06292]" />
                    </div>
                    <div className="text-xs text-pink-100/70">
                      <p className="font-black text-white mb-1 uppercase tracking-widest text-[10px]">Guía IA</p>
                      Describe tu sector y objetivos detalladamente para que Gemini refine los perfiles.
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-6 border-t border-white/10">
                <Button 
                  onClick={onComplete} 
                  className="w-full bg-[#d81b60] hover:bg-white text-white hover:text-[#d81b60] font-black h-14 rounded-2xl pink-glow transition-all active:scale-95 text-xs uppercase tracking-widest shadow-xl"
                >
                  Confirmar Marco Estratégico
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
