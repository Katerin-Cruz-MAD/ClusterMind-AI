import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, FileDown, Sparkles, Loader2, Users, Target, Zap, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { ClusteringData, BusinessContext, ClusterProfile } from '@/types';
import { generateClusterProfiles } from '@/lib/gemini';
import Plotly from 'plotly.js-dist-min';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

export default function InsightsStep({ data, businessContext }: { data: ClusteringData, businessContext: BusinessContext }) {
  const [profiles, setProfiles] = useState<ClusterProfile[]>([]);
  const boxPlotRef = useRef<HTMLDivElement>(null);
  const mosaicRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBoxVar, setSelectedBoxVar] = useState<string>('Edad');

  const profilingVars = useMemo(() => {
    // Look for typical profiling vars like Age or Income
    return Object.keys(data.originalData[0] || {}).filter(k => 
        ['Edad', 'Age', 'ingreso', 'income', 'millas', 'miles', 'Edad_estimada'].some(term => k.toLowerCase().includes(term.toLowerCase()))
    );
  }, [data.originalData]);

  useEffect(() => {
      if (boxPlotRef.current && data.labels.length > 0) {
          const varName = selectedBoxVar || profilingVars[0];
          if (!varName) return;

          const numClusters = data.labels.reduce((m, l) => Math.max(m, l), 0) + 1;
          const traces: any[] = [];
          const colors = ['#8a1a4a', '#991b1b', '#dc2626', '#450a0a', '#f87171', '#be123c', '#fb7185'];

          for (let i = 0; i < numClusters; i++) {
              const values = data.originalData
                .filter((_, idx) => data.labels[idx] === i)
                .map(row => Number(row[varName]) || 0);
              
              traces.push({
                  y: values,
                  type: 'box',
                  name: `Cluster ${i + 1}`,
                  boxpoints: 'outliers',
                  marker: { color: colors[i % colors.length] },
                  line: { width: 1.5 }
              });
          }

          Plotly.newPlot(boxPlotRef.current, traces, {
              title: { text: `Comparativa: ${varName} por Cluster`, font: { size: 12, family: 'Inter, sans-serif', weight: 'bold' } },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              yaxis: { gridcolor: '#f1f5f9' },
              xaxis: { zeroline: false },
              margin: { l: 40, r: 20, t: 40, b: 40 },
              height: 350
          }, { responsive: true, displayModeBar: false });
      }
  }, [data.labels, selectedBoxVar, profilingVars]);

  useEffect(() => {
    if (mosaicRef.current && data.labels.length > 0) {
        // Simple heatmap-based mosaic for 'genero' or 'casado' if they exist
        const catVar = Object.keys(data.originalData[0] || {}).find(k => 
            ['genero', 'sexo', 'gender', 'jubilado', 'casado', 'married'].some(term => k.toLowerCase().includes(term.toLowerCase()))
        );

        if (!catVar) return;

        const numClusters = data.labels.reduce((m, l) => Math.max(m, l), 0) + 1;
        const categories = Array.from(new Set(data.originalData.map(d => String(d[catVar]))));
        const matrix: number[][] = [];

        categories.forEach(cat => {
            const row: number[] = [];
            for (let i = 0; i < numClusters; i++) {
                const count = data.originalData.filter((d, idx) => data.labels[idx] === i && String(d[catVar]) === cat).length;
                const clusterTotal = data.labels.filter(l => l === i).length;
                row.push(Number(((count / clusterTotal) * 100).toFixed(1)));
            }
            matrix.push(row);
        });

        Plotly.newPlot(mosaicRef.current, [{
            z: matrix,
            x: Array.from({length: numClusters}, (_, i) => `Cluster ${i+1}`),
            y: categories,
            type: 'heatmap',
            colorscale: [[0, '#fff5f8'], [0.5, '#f48fb1'], [1, '#8a1a4a']],
            showscale: true
        }], {
            title: { text: `Distribución: ${catVar} (%)`, font: { size: 12, weight: 'bold' } },
            margin: { l: 80, r: 20, t: 40, b: 60 },
            paper_bgcolor: 'transparent',
            height: 300
        }, { responsive: true, displayModeBar: false });
    }
  }, [data.labels]);

  const clusterStats = useMemo(() => {
    if (!data?.labels || data.labels.length === 0) return [];
    
    const displayData = data.processedData || data.originalData;
    const numClusters = data.labels.reduce((m, l) => Math.max(m, l), 0) + 1;
    
    // Include engineered features like 'servicios' if they exist in the first row
    const availableVars = Object.keys(displayData[0] || {});
    const usefulVars = data.variables.filter(v => v.isUsefulForClustering).map(v => v.name);
    
    // Ensure we include features like 'servicios' even if not marked in original vars
    if (availableVars.includes('servicios') && !usefulVars.includes('servicios')) {
        usefulVars.push('servicios');
    }
    
    const stats = [];
    for (let i = 0; i < numClusters; i++) {
      const clusterIndices = [];
      for (let j = 0; j < data.labels.length; j++) {
          if (data.labels[j] === i) clusterIndices.push(j);
      }
      
      const averages: Record<string, number> = {};
      usefulVars.forEach(vName => {
        const values = clusterIndices.map(idx => Number(displayData[idx][vName]) || 0);
        averages[vName] = values.length > 0 ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0;
      });

      stats.push({
        id: i,
        size: clusterIndices.length,
        percentage: Number(((clusterIndices.length || 0) / (data.originalData.length || 1) * 100).toFixed(1)),
        averages
      });
    }
    return stats;
  }, [data]);

  const handleGenerateInsights = async () => {
    if (!data?.labels || data.labels.length === 0) {
        toast.error("Ejecuta el clustering primero.");
        return;
    }
    setLoading(true);
    try {
      const result = await generateClusterProfiles(
        businessContext, 
        data.variables.filter(v => v.isUsefulForClustering),
        clusterStats
      );
      
      if (!Array.isArray(result) || result.length === 0) {
          throw new Error("No se recibieron perfiles válidos.");
      }

      const enrichedProfiles = result.map(p => ({
        ...p,
        size: clusterStats[p.id]?.size || 0,
        percentage: clusterStats[p.id]?.percentage || 0,
        averages: clusterStats[p.id]?.averages || {}
      }));
      
      setProfiles(enrichedProfiles);
      toast.success("Perfiles de clusters generados exitosamente por Gemini.");
    } catch (error) {
      console.error("Profiling Error:", error);
      toast.error("Error al generar insights. Verifica la conexión con la IA.");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(138, 26, 74); // primary-wine
    doc.text("Analytica ML Intelligence Report", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Sector: ${businessContext.sector}`, 14, 35);
    doc.text(`Objetivo: ${businessContext.objective}`, 14, 40);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 45);
    
    let y = 60;
    profiles.forEach((p, idx) => {
        if (y > 240) { doc.addPage(); y = 20; }
        
        doc.setFillColor(138, 26, 74, 0.05); // light wine
        doc.rect(14, y, 182, 10, 'F');
        
        doc.setFontSize(14);
        doc.setTextColor(216, 27, 96); // accent
        doc.setFont("helvetica", "bold");
        doc.text(`Segmento ${idx + 1}: ${p.name} (${p.percentage}%)`, 18, y + 7);
        
        y += 15;
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("Características Principales:", 14, y);
        p.characteristics.forEach(c => { y += 6; doc.text(`• ${c}`, 20, y); });
        
        y += 10;
        doc.setTextColor(15, 23, 42);
        doc.text("Estrategias de Negocio:", 14, y);
        p.strategies.forEach(s => { y += 6; doc.text(`• ${s}`, 20, y); });
        
        y += 15;
    });
    
    doc.save(`Reporte_Clustering_${businessContext.sector.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF generado y descargado.");
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Datos Segmentados');
    
    if (data.originalData.length === 0) return;

    const headers = Object.keys(data.originalData[0]);
    sheet.addRow([...headers, 'SEGMENTO_ID', 'SEGMENTO_NOMBRE']);
    
    data.originalData.forEach((row, i) => {
        const clusterId = data.labels[i];
        const profile = profiles.find(p => p.id === clusterId);
        sheet.addRow([
            ...headers.map(h => row[h]),
            clusterId + 1,
            profile?.name || 'N/A'
        ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Segmentada_${Date.now()}.xlsx`;
    link.click();
    toast.success("Excel exportado correctamente.");
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">8. Perfilamiento & Insights</h2>
        <p className="text-muted-foreground text-lg font-medium font-medium">Traducción de clusters matemáticos en segmentos accionables para el negocio.</p>
      </div>

      <div className="flex justify-between items-center wine-gradient text-white p-6 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 technical-grid opacity-10"></div>
        <div className="flex items-center gap-5 relative z-10 px-4">
          <div className="p-4 bg-white/20 text-white rounded-3xl backdrop-blur-md shadow-xl border border-white/20">
            <Sparkles size={28} fill="currentColor" />
          </div>
          <div>
            <p className="font-black text-xl tracking-tight leading-none">Generación con IA</p>
            <p className="text-[10px] text-pink-200 mt-2 uppercase tracking-[0.3em] font-black opacity-60">Análisis Profundo de Centroides</p>
          </div>
        </div>
        <Button 
            onClick={handleGenerateInsights} 
            disabled={loading || data.labels.length === 0} 
            className="gap-3 bg-primary hover:bg-primary-dark text-white font-black px-10 h-14 rounded-2xl relative z-10 transition-all active:scale-95 shadow-xl text-xs uppercase tracking-widest border-2 border-white/20"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} fill="currentColor" />}
          {profiles.length > 0 ? "Actualizar Perfiles" : "Generar Insights"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {profiles.length > 0 ? (
            <Accordion className="space-y-4">
              {profiles.map((p) => (
                <AccordionItem key={p.id} value={`item-${p.id}`} className="border-2 border-primary/5 rounded-[2rem] px-8 bg-white/80 backdrop-blur-sm overflow-hidden transition-all data-[state=open]:border-accent/40 data-[state=open]:shadow-2xl shadow-xl">
                  <AccordionTrigger className="hover:no-underline py-6">
                    <div className="flex items-center gap-6 text-left w-full">
                      <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary/30 text-2xl group-hover:text-accent transition-colors shadow-inner">
                        {p.id + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-2xl text-primary tracking-tight">{p.name}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/10 text-[10px] font-black uppercase py-1 px-3 rounded-full">{p.percentage}% de la base</Badge>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{p.size} Entidades</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-10 space-y-10 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 text-primary">
                          <div className="p-2 bg-primary text-white rounded-xl shadow-lg">
                            <Users size={16} />
                          </div>
                          <h4 className="font-black text-[11px] uppercase tracking-[0.3em]">Características</h4>
                        </div>
                        <ul className="space-y-3">
                          {p.characteristics.map((c, i) => (
                            <li key={i} className="text-sm text-primary/70 flex gap-3 text-balance font-medium bg-primary/5 p-3 rounded-xl border border-primary/5">
                              <span className="text-accent font-black">→</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 text-amber-600">
                           <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg">
                             <Target size={16} />
                           </div>
                          <h4 className="font-black text-[11px] uppercase tracking-[0.3em]">Insights Clave</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {p.insights.map((ins, i) => (
                            <Card key={i} className="bg-amber-50 border-amber-200/50 p-5 rounded-2xl shadow-sm">
                                <p className="text-xs text-amber-900 font-bold italic leading-relaxed">"{ins}"</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 wine-gradient rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Zap size={120} />
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3 text-pink-300">
                            <Zap size={20} fill="currentColor" />
                            <h4 className="font-black text-[11px] uppercase tracking-[0.3em]">Estrategias de Activación</h4>
                        </div>
                        <Badge className="bg-white text-primary text-[10px] font-black px-4 py-1 rounded-full px-5">HIGH PRIORITY</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        {p.strategies.map((s, i) => (
                          <div key={i} className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 flex flex-col gap-3 group hover:bg-white/20 transition-all shadow-lg active:scale-95 cursor-pointer">
                            <p className="text-xs text-white leading-relaxed font-bold">{s}</p>
                            <span className="text-[9px] text-pink-300 font-black uppercase self-end flex items-center gap-1">Implementar <ChevronRight size={12} className="inline" /></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-primary/10 rounded-[3rem] bg-white/50 group hover:bg-primary/5 transition-all duration-500 shadow-inner">
                <div className="w-24 h-24 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary/20 mb-8 group-hover:scale-110 group-hover:bg-accent/10 group-hover:text-accent transition-all duration-500">
                    <Sparkles size={48} />
                </div>
                <p className="text-primary/40 font-black text-xl text-center max-w-sm tracking-tight px-10">Haz clic en el botón superior para perfilar tus clusters mediante IA.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-primary-dark/5 py-5 px-8 border-b border-primary/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                        <Target size={16} className="text-accent" />
                        VALIDACIÓN TÉCNICA
                    </CardTitle>
                    <Select value={selectedBoxVar} onValueChange={setSelectedBoxVar}>
                        <SelectTrigger className="w-36 h-10 text-[10px] font-black border-primary/10 rounded-xl bg-white shadow-sm">
                            <SelectValue placeholder="Variable" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-primary/10 rounded-xl overflow-hidden shadow-2xl">
                            {profilingVars.map(v => <SelectItem key={v} value={v} className="text-xs font-bold py-3">{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="p-6">
                    <div ref={boxPlotRef} className="w-full" />
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-primary-dark/5 py-5 px-8 border-b border-primary/10">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                        <Users size={16} className="text-accent" />
                        PERFIL DEMOGRÁFICO
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div ref={mosaicRef} className="w-full" />
                </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-2 border-primary/10 shadow-2xl overflow-hidden rounded-[2.5rem] bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-primary-dark/5 border-b border-primary/5 py-6 px-8">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Exportación</CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1 tracking-widest">Documentación Estratégica</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-5">
              <Button onClick={exportPDF} variant="outline" className="w-full gap-4 justify-start h-16 rounded-2xl border-primary/10 hover:border-accent hover:bg-accent/5 transition-all text-primary font-black text-xs uppercase tracking-widest group shadow-sm active:scale-95" disabled={profiles.length === 0}>
                <div className="p-3 bg-red-50 text-red-500 rounded-xl group-hover:scale-110 transition-transform"><FileDown size={24} /></div>
                Reporte Intel PDF
              </Button>
              <Button onClick={exportExcel} variant="outline" className="w-full gap-4 justify-start h-16 rounded-2xl border-primary/10 hover:border-blue-500 hover:bg-blue-50 transition-all text-primary font-black text-xs uppercase tracking-widest group shadow-sm active:scale-95" disabled={data.labels.length === 0}>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><FileSpreadsheet size={24} /></div>
                DATASEGMENTADA.XLSX
              </Button>
              
              <div className="pt-8 border-t border-primary/5">
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/5 shadow-inner">
                    <p className="text-[11px] text-primary/60 italic leading-relaxed font-medium">
                        El reporte PDF está optimizado para presentaciones ejecutivas e incluye la caracterización detallada de los centroides calculados por el motor ML.
                    </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="wine-gradient p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                <Target size={140} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-300 mb-6">Enfoque Ganador</h4>
            <p className="text-sm font-black leading-relaxed text-white opacity-90 italic relative z-10">
                "{businessContext.summary || "Define objetivos claros para que la IA genere un resumen ejecutivo de impacto."}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
