import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ListFilter, AlertCircle } from 'lucide-react';
import { ClusteringData, VariableInfo } from '@/types';
import { generateVariableRecommendations } from '@/lib/gemini';
import { toast } from 'sonner';

interface VariableStepProps {
  data: ClusteringData | null;
  setData: (data: ClusteringData) => void;
}

export default function VariableStep({ data, setData }: VariableStepProps) {
  const [loading, setLoading] = useState(false);

  if (!data) return null;

  const toggleVariable = (name: string) => {
    setData({
      ...data,
      variables: data.variables.map(v => 
        v.name === name ? { ...v, isUsefulForClustering: !v.isUsefulForClustering } : v
      )
    });
  };

  const handleAIAdvice = async () => {
    setLoading(true);
    try {
      const advice = await generateVariableRecommendations(data.variables, { sector: 'General', objective: 'Optimización', context: '', problem: '' });
      const updatedVariables = data.variables.map(v => {
        const item = advice.find((a: any) => a.name === v.name);
        if (item) {
          return { ...v, isUsefulForClustering: item.isUseful, recommendation: item.recommendation };
        }
        return v;
      });
      setData({ ...data, variables: updatedVariables });
      toast.success("Recomendaciones de IA aplicadas.");
    } catch (e) {
      toast.error("Error al obtener consejos de IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">3. Exploración & Selección</h2>
        <p className="text-muted-foreground text-lg font-medium">Selecciona las dimensiones que alimentarán el cerebro del modelo.</p>
      </div>

      <div className="flex justify-between items-center wine-gradient text-white p-6 rounded-[2rem] shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 technical-grid opacity-10"></div>
        <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
                <ListFilter size={24} />
            </div>
            <div>
                <p className="font-black text-white tracking-tight leading-none text-xl">Variables seleccionadas</p>
                <p className="text-[10px] text-pink-200 mt-2 uppercase font-black tracking-[0.3em] opacity-60">{data.variables.filter(v => v.isUsefulForClustering).length} Dimensiones Activas</p>
            </div>
        </div>
        <Button onClick={handleAIAdvice} disabled={loading} className="gap-2 bg-primary hover:bg-primary-dark text-white h-14 px-10 rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 relative z-10 border-2 border-white/20">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} fill="currentColor" />}
          Consultar Cerebro IA
        </Button>
      </div>

      <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="w-[80px] text-center"></TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 h-16">Dimension</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 h-16">Tipo</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 h-16">Unicidad</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 h-16">Nulos</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 h-16">Mapeo Estratégico (IA)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.variables.map((v) => (
                <TableRow key={v.name} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                  <TableCell className="text-center">
                    <Checkbox 
                        checked={v.isUsefulForClustering} 
                        onCheckedChange={() => toggleVariable(v.name)}
                        className="data-[state=checked]:bg-accent data-[state=checked]:border-accent border-primary/20 w-6 h-6 rounded-lg transition-all"
                    />
                  </TableCell>
                  <TableCell className="font-mono font-black text-primary text-sm tracking-tight">{v.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-[10px] font-black px-4 py-1.5 rounded-full bg-primary/5 text-primary border-primary/5 group-hover:bg-accent group-hover:text-white transition-all">
                      {v.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground font-mono font-bold">{v.uniqueValues}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground font-mono font-bold">
                    {v.missingValues > 0 ? (
                        <span className="text-red-500 flex items-center gap-1 font-black underline decoration-red-200"><AlertCircle size={12} /> {v.missingValues}</span>
                    ) : '0'}
                  </TableCell>
                  <TableCell className="text-[11px] text-primary/70 max-w-md truncate italic font-medium">
                    {v.recommendation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
