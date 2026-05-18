import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { ClusteringData } from '@/types';
import { normalizeData } from '@/lib/clustering';
import { toast } from 'sonner';

export default function ScalingStep({ data, setData }: { data: ClusteringData, setData: (d: ClusteringData) => void }) {
  const [method, setMethod] = useState<'standard' | 'minmax'>('standard');

  const selectedVarsCount = useMemo(() => 
    data.variables.filter(v => v.isUsefulForClustering).length,
  [data.variables]);

  const handleScale = () => {
    const varsToScale = data.variables.filter(v => v.isUsefulForClustering).map(v => v.name);
    if (varsToScale.length === 0) {
      toast.error("Selecciona al menos una variable útil en el paso anterior.");
      return;
    }

    const numericData = data.originalData.map(row => 
      varsToScale.map(v => Number(row[v]) || 0)
    );

    const scaled = normalizeData(numericData, method);
    setData({ ...data, scaledData: scaled });
    toast.success(`Datos normalizados usando ${method === 'standard' ? 'StandardScaler' : 'MinMaxScaler'}.`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">5. Normalización</h2>
        <p className="text-muted-foreground text-lg font-medium">Ajusta las escalas de tus variables para que el algoritmo no de peso excesivo a números grandes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-7 border-primary/10 shadow-xl border-2 rounded-[2rem] overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-primary/5 border-b border-primary/10 py-5 px-8">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <Scale size={18} className="text-accent" />
                CONFIGURACIÓN DEL MÉTODO
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <RadioGroup value={method} onValueChange={(v: any) => setMethod(v)} className="grid grid-cols-1 gap-4">
              <div 
                className={`relative flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${method === 'standard' ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/20' : 'border-primary/5 hover:border-primary/10'}`}
                onClick={() => setMethod('standard')}
              >
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${method === 'standard' ? 'border-accent bg-accent' : 'border-primary/20 bg-white'}`}>
                  {method === 'standard' && <CheckCircle2 className="text-white h-4 w-4" />}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="standard" className="font-black text-primary flex items-center gap-2 cursor-pointer text-base">
                    Standardization (Z-Score)
                    {method === 'standard' && <Badge className="bg-accent text-[9px] font-black uppercase px-2 py-0.5 rounded-md">RECOMENDADO</Badge>}
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Transforma los datos para tener media 0 y desviación 1. Ideal para K-Means y algoritmos basados en distancias.
                  </p>
                </div>
              </div>

              <div 
                className={`relative flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${method === 'minmax' ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/20' : 'border-primary/5 hover:border-primary/10'}`}
                onClick={() => setMethod('minmax')}
              >
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${method === 'minmax' ? 'border-accent bg-accent' : 'border-primary/20 bg-white'}`}>
                  {method === 'minmax' && <CheckCircle2 className="text-white h-4 w-4" />}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="minmax" className="font-black text-primary cursor-pointer text-base">Min-Max Scaling</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Comprime los datos en un rango fijo de 0 a 1. Útil cuando se conoce el límite exacto de las variables.
                  </p>
                </div>
              </div>
            </RadioGroup>

            <div className="pt-6 border-t border-primary/5 italic flex items-center gap-4 text-xs text-primary/60 font-medium">
               <div className="p-2 bg-primary/5 rounded-2xl text-accent shadow-inner">
                  <Info size={16} />
               </div>
               "Sin normalización, una variable con valores en miles dominaría a una variable con valores de 0 a 10."
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-5 flex flex-col gap-8">
            <Card className="wine-gradient text-white p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center text-center shadow-2xl group border-0">
                <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-white mb-6 transition-all duration-500 border border-white/20">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Preparado para Escalar</h3>
                <p className="text-white/70 text-sm mb-10 px-6 leading-relaxed font-medium">
                  Se procesarán <strong>{selectedVarsCount}</strong> dimensiones para crear el espacio vectorial de agrupación.
                </p>
                
                <Button 
                    onClick={handleScale} 
                    className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all rounded-2xl border-2 border-white/20"
                >
                    Ejecutar Normalización de Datos
                </Button>

                {data.scaledData.length > 0 && (
                    <div className="mt-8 flex items-center gap-3 text-[10px] font-black text-pink-200 uppercase tracking-[0.3em] animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full" />
                        Datos Escalados Correctamente
                    </div>
                )}
            </Card>

            <div className="p-8 border-2 border-primary/10 border-dashed rounded-[2rem] bg-white/50 backdrop-blur-sm flex items-center gap-6 shadow-sm">
                <div className="text-accent font-black text-4xl tracking-tighter">14</div>
                <div className="space-y-1">
                    <p className="font-black text-primary text-sm uppercase tracking-wider">Optimización</p>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Infraestructura volátil de alta velocidad para ejecución en tiempo real.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
