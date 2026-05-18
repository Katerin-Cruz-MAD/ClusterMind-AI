import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, Calculator, Info, CheckCircle2 } from 'lucide-react';
import Plotly from 'plotly.js-dist-min';
import { ClusteringData } from '@/types';
import { getElbowData } from '@/lib/clustering';

export default function SelectionStep({ data, setData }: { data: ClusteringData, setData: (d: ClusteringData) => void }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [elbowData, setElbowData] = useState<any[]>([]);

  useEffect(() => {
    if (data.scaledData.length > 0 && elbowData.length === 0) {
      const results = getElbowData(data.scaledData);
      setElbowData(results);
    }
  }, [data.scaledData]);

  useEffect(() => {
    if (chartRef.current && elbowData.length > 0) {
      Plotly.newPlot(chartRef.current, [{
        x: elbowData.map(d => d.k),
        y: elbowData.map(d => d.inertia),
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#8a1a4a', width: 4 },
        marker: { size: 10, color: '#d81b60', line: { color: 'white', width: 2 } }
      }], {
        margin: { l: 60, r: 20, t: 30, b: 60 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: { title: { text: 'Número de Clusters (K)', font: { size: 10, family: 'Inter' } }, dtick: 1, gridcolor: '#f1f5f9' },
        yaxis: { title: { text: 'Inercia (SSE)', font: { size: 10, family: 'Inter' } }, gridcolor: '#f1f5f9' },
        font: { family: 'Inter, sans-serif', size: 10 },
      }, { responsive: true, displayModeBar: false });
    }
  }, [elbowData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">6. Selección del Valor Óptimo (K)</h2>
        <p className="text-muted-foreground text-lg font-medium">Usa el Método del Codo para decidir cuántos segmentos son estadísticamente relevantes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-2 border-primary/10 overflow-hidden shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-primary-dark/5 border-b border-primary/5 flex flex-row items-center justify-between py-4 px-8">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                <Calculator size={16} className="text-accent" />
                Gráfica del Codo (Elbow Curve)
            </CardTitle>
            <Badge variant="outline" className="bg-white border-primary/10 text-primary font-mono text-[10px] px-3 py-1 rounded-full">Minimizando SSE</Badge>
          </CardHeader>
          <CardContent className="p-8">
            <div ref={chartRef} className="w-full h-[400px]" />
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-8">
        <Card className="border-2 border-primary/10 bg-white/60 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-primary-dark/5 px-8 pt-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Settings2 size={16} className="text-accent" /> Ajustar K-Value
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8 pt-6">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-5xl font-black text-primary tracking-tighter">{data.numClusters}</p>
                        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Clusters Configurados</p>
                    </div>
                    <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20 shadow-inner">
                        <CheckCircle2 size={28} className="text-accent" />
                    </div>
                </div>

                <Slider 
                    value={[data.numClusters]} 
                    min={2} 
                    max={10} 
                    step={1} 
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setData({ ...data, numClusters: v });
                    }}
                    className="py-4"
                />

                <div className="grid grid-cols-3 gap-3">
                    {[2,3,4,5,6,7,8,9,10].slice(0, 3).map(n => (
                        <button 
                            key={n}
                            onClick={() => setData({ ...data, numClusters: n })}
                            className={`px-2 py-4 rounded-2xl border-2 text-sm font-black transition-all active:scale-95 flex items-center justify-center ${data.numClusters === n ? 'bg-primary border-primary text-white shadow-xl ring-4 ring-primary/20 scale-105' : 'bg-primary/5 border-primary/10 text-primary/60 hover:border-primary/40 hover:bg-white'}`}
                        >
                            K = {n}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>

        <div className="p-8 wine-gradient rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                <Info size={120} />
            </div>
            <div className="flex items-center gap-3 mb-4 text-pink-300">
                <Info size={20} />
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] leading-none">Regla Analítica</h5>
            </div>
            <p className="text-sm font-bold leading-relaxed opacity-90 italic">
                "Busca el punto donde la pendiente disminuye bruscamente (el 'codo'). Agregar más clusters suele generar sobreajuste y complejidad innecesaria."
            </p>
        </div>
        </div>
      </div>
    </div>
  );
}
