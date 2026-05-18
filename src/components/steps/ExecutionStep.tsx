import { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, RotateCcw, BoxSelect, Maximize2, Zap, Layers, BarChart, LineChart, ScatterChart } from 'lucide-react';
import { ClusteringData, BusinessContext } from '@/types';
import { kmeans } from 'ml-kmeans';
import Plotly from 'plotly.js-dist-min';
import { PCA } from 'ml-pca';
import { toast } from 'sonner';

const ClusterPlot = ({ scaledData, labels, centroids, dimensions, chartType }: { 
  scaledData: number[][], 
  labels: number[], 
  centroids: number[][],
  dimensions: string[],
  chartType: 'scatter' | 'parallel' | '3d' | 'ellipses' | 'pca_star'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && scaledData.length > 0) {
      const is3DRequest = chartType === '3d';
      const is3D = is3DRequest && dimensions.length >= 3;
      const traces: any[] = [];
      const numClusters = labels.reduce((m, l) => Math.max(m, l), 0) + 1;
      const colors = ['#8a1a4a', '#991b1b', '#dc2626', '#450a0a', '#f87171', '#be123c', '#fb7185'];

      // R-Style Projection: PCA components if not multi-dimensional scatter
      let displayData = scaledData;
      let displayCentroids = centroids;
      let labelsPlot = [dimensions[0], dimensions[1]];

      if (chartType === 'pca_star' || chartType === 'ellipses') {
          try {
            const pca = new PCA(scaledData);
            displayData = pca.predict(scaledData).to2DArray().map(p => [p[0], p[1]]);
            displayCentroids = pca.predict(centroids).to2DArray().map(p => [p[0], p[1]]);
            labelsPlot = ['CP 1', 'CP 2'];
          } catch (e) {
              console.error("PCA failed", e);
          }
      }

      if (chartType === 'parallel') {
        const dimensionsPlot = dimensions.map((dim, i) => ({
          label: dim,
          values: scaledData.map(p => p[i]),
          tickformat: '.2f'
        }));

        traces.push({
          type: 'parcoords',
          line: {
            color: labels,
            colorscale: colors.slice(0, numClusters).map((c, i) => [i / (numClusters - 1 || 1), c])
          },
          dimensions: dimensionsPlot
        });
      } else {
        for (let i = 0; i < numClusters; i++) {
          const clusterIndices = labels.map((l, idx) => l === i ? idx : -1).filter(idx => idx !== -1);
          const clusterPoints = clusterIndices.map(idx => displayData[idx]);
          
          const x = clusterPoints.map(p => p[0]);
          const y = clusterPoints.map(p => p[1]);
          const z = is3D ? clusterPoints.map(p => p[2]) : undefined;

          // Star Plot Lines: Centroid to Point
          if (chartType === 'pca_star' && displayCentroids[i]) {
              const cx = displayCentroids[i][0];
              const cy = displayCentroids[i][1];
              
              const starLineX: number[] = [];
              const starLineY: number[] = [];
              
              clusterPoints.forEach(p => {
                  starLineX.push(cx, p[0], null as any);
                  starLineY.push(cy, p[1], null as any);
              });

              traces.push({
                  x: starLineX,
                  y: starLineY,
                  mode: 'lines',
                  type: 'scatter',
                  line: { color: colors[i % colors.length], width: 0.5 },
                  opacity: 0.2,
                  showlegend: false,
                  hoverinfo: 'none'
              });
          }

          traces.push({
            x,
            y,
            z,
            type: is3D ? 'scatter3d' : 'scatter',
            mode: 'markers',
            name: `Cluster ${i + 1}`,
            marker: { 
              size: is3D ? 4 : 6, 
              opacity: (chartType === 'pca_star' || chartType === 'ellipses') ? 0.8 : 0.6,
              color: colors[i % colors.length]
            }
          });

          // Area (Convex Hull)
          if ((chartType === 'ellipses' || chartType === 'pca_star') && x.length > 3) {
            // Simple Convex Hull using Monotone Chain algorithm for visual clarity
            const points = clusterPoints.map(p => ({ x: p[0], y: p[1] }))
                .sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
            
            const crossProduct = (a: any, b: any, c: any) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
            
            const lower = [];
            for (const p of points) {
                while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
                lower.push(p);
            }
            
            const upper = [];
            for (let j = points.length - 1; j >= 0; j--) {
                const p = points[j];
                while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
                upper.push(p);
            }
            
            lower.pop();
            upper.pop();
            const hull = lower.concat(upper);

             traces.push({
                x: hull.map(p => p.x),
                y: hull.map(p => p.y),
                fill: 'toself',
                fillcolor: colors[i % colors.length],
                opacity: 0.15,
                type: 'scatter',
                mode: 'lines',
                line: { color: colors[i % colors.length], width: 1, dash: 'dot' },
                name: `Área Cluster ${i + 1}`,
                showlegend: false
            });
          }

          if (displayCentroids[i] && (chartType === 'scatter' || chartType === 'ellipses' || chartType === 'pca_star')) {
              traces.push({
                  x: [displayCentroids[i][0]],
                  y: [displayCentroids[i][1]],
                  z: is3D ? [displayCentroids[i][2]] : undefined,
                  type: is3D ? 'scatter3d' : 'scatter',
                  mode: 'markers',
                  name: `Centroide ${i + 1}`,
                  marker: { 
                      symbol: is3D ? 'diamond' : 'circle', 
                      size: is3D ? 10 : 12, 
                      color: colors[i % colors.length],
                      line: { width: 3, color: '#0f172a' }
                  },
                  showlegend: false
              });
          }
        }
      }

      const layout: any = {
        autosize: true,
        margin: chartType === 'parallel' ? { l: 80, r: 80, t: 100, b: 80 } : { l: 20, r: 20, t: 20, b: 20 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif', size: 10 },
        legend: { orientation: 'h', y: -0.1 },
        scene: is3D ? {
          xaxis: { title: dimensions[0], gridcolor: '#f1f5f9' },
          yaxis: { title: dimensions[1], gridcolor: '#f1f5f9' },
          zaxis: { title: dimensions[2], gridcolor: '#f1f5f9' },
          camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } }
        } : {
          xaxis: { title: labelsPlot[0], gridcolor: '#f1f5f9', zeroline: false },
          yaxis: { title: labelsPlot[1], gridcolor: '#f1f5f9', zeroline: false }
        }
      };

      Plotly.newPlot(containerRef.current, traces, layout, { responsive: true, displayModeBar: false });
    }
  }, [scaledData, labels, centroids, dimensions, chartType]);

  return <div ref={containerRef} className="w-full h-full min-h-[500px]" />;
};

export default function ExecutionStep({ data, setData, businessContext }: { data: ClusteringData, setData: (d: ClusteringData) => void, businessContext: BusinessContext }) {
  const [algo, setAlgo] = useState<'kmeans' | 'dbscan' | 'hierarchical'>('kmeans');
  const [chartType, setChartType] = useState<'scatter' | '3d' | 'parallel' | 'ellipses' | 'pca_star'>('pca_star');
  const [useLogTransform, setUseLogTransform] = useState(true);
  const [executing, setExecuting] = useState(false);

  const selectedVars = useMemo(() => 
    data.variables.filter(v => v.isUsefulForClustering).map(v => v.name),
  [data.variables]);

  const runClustering = () => {
    setExecuting(true);
    
    setTimeout(() => {
        try {
            // Advanced Preprocessing: Feature Engineering 'servicios' as in R
            const processedData = data.originalData.map(row => {
                const servicios = (Number(row.fijo) || 0) + 
                                (Number(row.largadistancia) || 0) + 
                                (Number(row.internetcasa) || 0) + 
                                (Number(row.numoculto) || 0);
                
                const newRow: any = { ...row, servicios };
                
                // R-Style log1p transformation for skewed variables
                const skewVars = ['minutos_preferido', 'adicionales', 'minutos_no_preferido', 'internet_gigas'];
                if (useLogTransform) {
                    skewVars.forEach(v => {
                        if (row[v] !== undefined) {
                            newRow[v] = Math.log1p(Number(row[v]) || 0);
                        }
                    });
                }
                return newRow;
            });

            // Filtering dimensions
            const varsToCluster = data.variables
                .filter(v => v.isUsefulForClustering)
                .map(v => v.name);
            
            if (!varsToCluster.includes('servicios')) varsToCluster.push('servicios');

            // Creating the matrix
            const matrix = processedData.map(d => varsToCluster.map(v => Number(d[v]) || 0));

            // Standardize (Scale) matrix as in R 'scale'
            const means = varsToCluster.map((_, i) => matrix.reduce((a, b) => a + b[i], 0) / matrix.length);
            const stds = varsToCluster.map((_, i) => Math.sqrt(matrix.reduce((a, b) => a + Math.pow(b[i] - means[i], 2), 0) / matrix.length) || 1);
            
            const scaledMatrix = matrix.map(row => row.map((val, i) => (val - means[i]) / stds[i]));

            const result = kmeans(scaledMatrix, data.numClusters, {
                initialization: 'kmeans++',
                maxIterations: 100
            });

            setData({ 
                ...data, 
                processedData, // Save enhanced data
                scaledData: scaledMatrix,
                labels: result.clusters, 
                centroids: (result.centroids as any[]).map(c => c.centroid || c),
                algorithm: 'kmeans'
            });
            toast.success("Análisis avanzado completado (Preprocesado + K-Means).");
        } catch (e) {
            console.error(e);
            toast.error("Error al ejecutar el motor R-Style.");
        } finally {
            setExecuting(false);
        }
    }, 1200);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">7. Generación de Clusters</h2>
        <p className="text-muted-foreground text-lg font-medium">Ejecuta el motor de Machine Learning y visualiza la convergencia de los grupos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-3 border-2 border-primary/10 shadow-xl flex flex-col bg-white/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 py-5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 text-center">Configuración del Motor</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex-1">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-primary/40 tracking-wider">Algoritmo</Label>
              <Select value={algo} onValueChange={(v: any) => setAlgo(v)}>
                <SelectTrigger className="w-full h-12 border-primary/10 rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="kmeans">K-Means (V2.4)</SelectItem>
                  <SelectItem value="dbscan">DBSCAN</SelectItem>
                  <SelectItem value="hierarchical">Jerárquico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-primary/40 tracking-wider">Visualización</Label>
              <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                <SelectTrigger className="w-full h-12 border-primary/10 rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white">
                  <SelectItem value="pca_star">Estrellas (PCA)</SelectItem>
                  <SelectItem value="ellipses">Áreas</SelectItem>
                  <SelectItem value="scatter">Dispersión 2D</SelectItem>
                  <SelectItem value="3d">Dispersión 3D</SelectItem>
                  <SelectItem value="parallel">Coordenadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/5">
                <input 
                    type="checkbox" 
                    id="log_transform" 
                    checked={useLogTransform} 
                    onChange={(e) => setUseLogTransform(e.target.checked)}
                    className="w-5 h-5 text-[#d81b60] border-primary/20 rounded cursor-pointer transition-all"
                />
                <Label htmlFor="log_transform" className="text-[10px] font-black uppercase text-primary/60 cursor-pointer leading-tight">
                    Transformación Logarítmica
                </Label>
            </div>

            <div className="space-y-3 p-5 bg-white border-2 border-primary/5 rounded-2xl shadow-inner">
                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest text-center">Dimensiones</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {selectedVars.slice(0, 3).map((v, i) => (
                        <Badge key={v} variant="secondary" className="bg-primary/5 border-primary/5 text-primary font-mono text-[9px] px-2 py-0.5">
                            {['X','Y','Z'][i]}: {v}
                        </Badge>
                    ))}
                    {selectedVars.length > 3 && <Badge variant="outline" className="text-[9px] border-primary/10 text-primary/40">+{selectedVars.length-3}</Badge>}
                </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
                <Button 
                    className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 border-2 border-white/10" 
                    onClick={runClustering} 
                    disabled={executing}
                >
                    {executing ? <RotateCcw className="animate-spin" size={20} /> : <Play size={20} />}
                    Ejecutar Modelo
                </Button>
                <p className="text-[9px] text-center text-primary/40 font-black uppercase tracking-widest italic animate-pulse">
                    Procesando {data.scaledData.length} registros
                </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-9 border-2 border-primary/10 shadow-2xl overflow-hidden flex flex-col relative bg-white/50 backdrop-blur-sm rounded-[2.5rem]">
          <div className="absolute inset-0 technical-grid opacity-30 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white relative z-10 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Panel de Resultados Visuales</CardTitle>
            <div className="flex gap-2">
                <Badge variant="outline" className="bg-primary/5 border-primary/10 text-primary font-bold uppercase text-[9px]">
                    {data.labels.length > 0 ? "ML Ready" : "Calculando..."}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative z-10">
            {data.labels.length > 0 ? (
                <div className="h-full w-full p-4">
                    <ClusterPlot 
                        scaledData={data.scaledData} 
                        labels={data.labels} 
                        centroids={data.centroids}
                        dimensions={selectedVars}
                        chartType={chartType}
                    />
                </div>
            ) : (
                <div className="h-[550px] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-6 font-bold">
                        <ScatterChart size={32} />
                    </div>
                    <p className="text-slate-500 font-medium tracking-tight">El motor está listo. Ejecuta el análisis para visualizar los resultados.</p>
                </div>
            )}
            
            {chartType !== 'parallel' && (
              <>
                <div className="absolute top-1/2 left-8 -translate-y-1/2 rotate-[-90deg] text-[10px] text-slate-400 font-mono tracking-[0.3em] font-bold uppercase opacity-50">
                  Dimensión_Latente_2
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-mono tracking-[0.3em] font-bold uppercase opacity-50">
                  Dimensión_Latente_1
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
