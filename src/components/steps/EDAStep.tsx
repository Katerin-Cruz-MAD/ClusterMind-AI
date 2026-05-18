import { useMemo, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClusteringData } from '@/types';
import Plotly from 'plotly.js-dist-min';
import { BarChart3, ScatterChart as ScatterIcon, Info } from 'lucide-react';

export default function EDAStep({ data }: { data: ClusteringData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const corrRef = useRef<HTMLDivElement>(null);

  const selectedVars = useMemo(() => 
    data.variables.filter(v => v.isUsefulForClustering),
  [data.variables]);

  useEffect(() => {
    if (containerRef.current && selectedVars.length > 0) {
      const vars = selectedVars.slice(0, 5);
      const traces = vars.map(v => ({
        y: data.originalData.map(d => d[v.name]),
        type: 'box',
        name: v.name,
        marker: { color: '#8a1a4a' },
        line: { color: '#5e1032' },
        fillcolor: 'rgba(216, 27, 96, 0.1)'
      }));

      Plotly.newPlot(containerRef.current, traces, {
        title: { text: 'Distribución de Variables Críticas', font: { size: 14, weight: 'bold' } },
        margin: { l: 40, r: 20, t: 60, b: 40 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif' }
      }, { responsive: true, displayModeBar: false });
    }
  }, [data, selectedVars]);

  useEffect(() => {
    if (corrRef.current && selectedVars.length > 1) {
      const vars = selectedVars.slice(0, 8);
      const varNames = vars.map(v => v.name);
      const dataMatrix: number[][] = [];

      // Calculate Pearson correlation matrix
      for (let i = 0; i < varNames.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < varNames.length; j++) {
          const v1 = data.originalData.map(d => Number(d[varNames[i]]) || 0);
          const v2 = data.originalData.map(d => Number(d[varNames[j]]) || 0);
          
          if (i === j) {
            row.push(1);
            continue;
          }

          const mean1 = v1.reduce((a, b) => a + b, 0) / v1.length;
          const mean2 = v2.reduce((a, b) => a + b, 0) / v2.length;
          
          let num = 0;
          let den1 = 0;
          let den2 = 0;
          
          for (let k = 0; k < v1.length; k++) {
            const d1 = v1[k] - mean1;
            const d2 = v2[k] - mean2;
            num += d1 * d2;
            den1 += d1 * d1;
            den2 += d2 * d2;
          }
          
          row.push(num / Math.sqrt(den1 * den2) || 0);
        }
        dataMatrix.push(row);
      }

      Plotly.newPlot(corrRef.current, [{
        z: dataMatrix,
        x: varNames,
        y: varNames,
        type: 'heatmap',
        colorscale: [
            [0, '#8a1a4a'], 
            [0.5, '#fff5f8'], 
            [1, '#d81b60']
        ],
        showscale: true,
        zmin: -1,
        zmax: 1
      }], {
        title: { text: 'Matriz de Correlación de Pearson', font: { size: 12, weight: 'bold' } },
        margin: { l: 80, r: 20, t: 40, b: 80 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif', size: 10 }
      }, { responsive: true, displayModeBar: false });
    }
  }, [data, selectedVars]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">4. Análisis de Correlaciones</h2>
        <p className="text-muted-foreground text-lg font-medium">Identifica relaciones lineales entre variables para evitar redundancias en el modelo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
            <Card className="border-primary/10 shadow-xl border-2 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-primary-dark/5 border-b border-primary/10 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                        <ScatterIcon size={16} className="text-accent" />
                        Mapa de Calor (R-Style)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div ref={corrRef} className="w-full h-[500px]" />
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-xl border-2 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-primary-dark/5 border-b border-primary/10 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                        <BarChart3 size={16} className="text-accent" />
                        Detección de Outliers (Boxplots)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div ref={containerRef} className="w-full h-[400px]" />
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <Card className="border-primary/10 shadow-xl border-2 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-primary-dark/5 border-b border-primary/10 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                    <Info size={16} className="text-accent" />
                    Resumen Estadístico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                    {selectedVars.slice(0, 4).map(v => {
                        const values = data.originalData.map(d => Number(d[v.name]) || 0);
                        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
                        const max = Math.max(...values).toFixed(2);
                        return (
                            <div key={v.name} className="flex flex-col gap-1 pb-4 border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors p-2 rounded-lg">
                                <span className="text-sm font-bold text-primary">{v.name}</span>
                                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
                                    <span className="text-muted-foreground/60">Media: <span className="text-primary">{avg}</span></span>
                                    <span className="text-muted-foreground/60">Pico: <span className="text-[#d81b60]">{max}</span></span>
                                </div>
                                <div className="w-full h-1.5 bg-primary/5 rounded-full mt-2 overflow-hidden">
                                     <div className="h-full bg-[#d81b60]/40" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </CardContent>
            </Card>

            <div className="p-8 wine-gradient rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                    <ScatterIcon size={160} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-300 mb-6">Insight Analítico</h4>
                <p className="text-sm font-bold leading-relaxed opacity-90 italic">
                    "Las variables con alta varianza suelen ser las mejores candidatas para diferenciar clusters, ya que contienen más información diferenciadora."
                </p>
                <div className="mt-10 flex items-center gap-3 text-[10px] font-black text-pink-100/40 uppercase tracking-[0.2em]">
                    <span>Revisión terminada</span>
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping"></span>
                    <span className="text-white">Listo para Normalizar</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
