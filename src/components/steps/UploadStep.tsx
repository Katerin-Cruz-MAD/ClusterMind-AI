import * as React from 'react';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileType, CheckCircle2, FileWarning, Database, Trash2, Info, FileSpreadsheet, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ClusteringData, VariableInfo, VariableType } from '@/types';
import { toast } from 'sonner';

interface UploadStepProps {
  onDataLoaded: (data: ClusteringData) => void;
  currentData: ClusteringData | null;
}

export default function UploadStep({ onDataLoaded, currentData }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);

  const analyzeDataAndDispatch = (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast.error("El archivo está vacío.");
      return;
    }

    const columns = Object.keys(data[0]);
    
    const variables: VariableInfo[] = columns.map(col => {
      const values = data.map(d => d[col]).filter(v => v !== null && v !== undefined);
      const uniqueValues = new Set(values).size;
      const isNumeric = values.every(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(v)));
      
      return {
        name: col,
        type: isNumeric ? 'continuous' : 'categorical',
        isUsefulForClustering: isNumeric && uniqueValues > 1,
        recommendation: isNumeric ? 'Recomendado por tipo numérico.' : 'Revisar: Tipo categórico.',
        uniqueValues,
        missingValues: data.length - values.length
      };
    });

    onDataLoaded({
      originalData: data,
      cleanedData: data,
      scaledData: [],
      variables,
      labels: [],
      centroids: [],
      numClusters: 3,
      algorithm: 'kmeans'
    });
    toast.success(`Dataset cargado: ${data.length} filas detectadas desde ${fileName}.`);
  };

  const processFile = (file: File) => {
    const isCSV = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast.error("Por favor, sube un archivo CSV o Excel (.xlsx, .xls).");
      return;
    }

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          analyzeDataAndDispatch(results.data, file.name);
        }
      });
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        analyzeDataAndDispatch(json, file.name);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">2. Identificación de Datos</h2>
        <p className="text-muted-foreground text-lg font-medium">Carga tu dataset en formato CSV o Excel para comenzar el análisis estructural.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className={`lg:col-span-3 border-2 border-dashed transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] rounded-3xl ${isDragging ? 'border-accent bg-accent/5' : 'border-primary/10 bg-white/50 backdrop-blur-sm'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {currentData ? (
            <div className="flex flex-col items-center gap-6 p-10 text-center">
              <div className="w-24 h-24 rounded-3xl bg-accent/10 flex items-center justify-center text-accent pink-glow">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-primary tracking-tight">¡Dataset Cargado con Éxito!</h3>
                <p className="text-muted-foreground font-mono text-sm mt-3 bg-primary/5 px-4 py-2 rounded-lg">{currentData.originalData.length} registros y {currentData.variables.length} columnas identificadas.</p>
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl h-12 px-6" onClick={() => onDataLoaded(null as any)}>
                  <Trash2 size={16} /> Eliminar
                </Button>
                <div className="relative">
                    <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="hidden" id="file-replace" />
                    <label htmlFor="file-replace">
                        <Button variant="secondary" className="gap-2 cursor-pointer h-12 px-6 rounded-xl bg-primary text-white hover:bg-primary-dark">
                            <Upload size={16} /> Subir Otro
                        </Button>
                    </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 p-10 text-center group">
              <div className="p-8 rounded-[2rem] bg-primary/5 text-primary/40 group-hover:scale-110 group-hover:bg-accent/10 group-hover:text-accent transition-all duration-500 shadow-inner">
                <Upload size={64} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-primary tracking-tight">Arrastra tu archivo aquí</h3>
                <p className="text-muted-foreground font-medium">O haz clic para explorar en tu equipo (.csv, .xlsx)</p>
              </div>
              <div className="relative">
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label 
                   htmlFor="file-upload" 
                   className="flex items-center gap-3 px-10 py-5 bg-accent text-white rounded-2xl font-black hover:bg-accent-light transition-all cursor-pointer shadow-xl pink-glow active:scale-95 text-xs uppercase tracking-widest"
                >
                  <FileType size={20} />
                  Explorar Archivos
                </label>
              </div>
              <div className="pt-8 border-t border-primary/5 w-full max-w-lg">
                <div className="flex items-center justify-center gap-6 text-[10px] text-primary/30 uppercase font-black tracking-[0.2em] leading-none">
                    <span className="flex items-center gap-1.5"><Database size={14} /> CSV UTF-8</span>
                    <span className="w-1.5 h-1.5 bg-accent/20 rounded-full"></span>
                    <span className="flex items-center gap-1.5"><FileSpreadsheet size={14} /> EXCEL 365</span>
                    <span className="w-1.5 h-1.5 bg-accent/20 rounded-full"></span>
                    <span className="flex items-center gap-1.5"><FileWarning size={14} /> MAX 10MB</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 bg-white/60 backdrop-blur-sm border-primary/10 rounded-3xl shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 mb-6 flex items-center gap-2">
                <Info size={14} className="text-accent" />
                Validación de Núcleo
            </h4>
            <div className="space-y-4">
                <div className="flex justify-between text-xs pb-3 border-b border-primary/5">
                    <span className="text-muted-foreground font-medium">Formatos</span>
                    <span className="font-bold text-primary">CSV / XLSX</span>
                </div>
                <div className="flex justify-between text-xs pb-3 border-b border-primary/5">
                    <span className="text-muted-foreground font-medium">Motor</span>
                    <span className="font-bold text-primary">Analytica v2.6.x</span>
                </div>
                <div className="flex justify-between text-xs pb-3 border-b border-primary/5">
                    <span className="text-muted-foreground font-medium">Integridad</span>
                    <span className="font-bold text-primary">Automática</span>
                </div>
            </div>
          </Card>
          
          <div className="p-6 border border-accent/20 bg-accent/5 rounded-3xl shadow-inner mt-4">
             <p className="text-xs text-primary/80 leading-relaxed italic font-medium">
                <Sparkles size={14} className="text-accent inline mr-2" />
                "Tip: Al usar Excel, asegúrate de que la primera fila contenga los nombres de las variables para un mapeo R-Style correcto."
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
