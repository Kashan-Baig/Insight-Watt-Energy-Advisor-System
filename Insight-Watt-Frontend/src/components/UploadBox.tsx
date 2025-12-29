import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export function UploadBox({ onFileSelect, className }: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <Card
      variant="elevated"
      className={cn(
        'glass border-border/30 transition-all duration-300',
        isDragging && 'ring-2 ring-primary/50 border-primary/50 shadow-glow',
        className
      )}
    >
      <CardContent className="p-0">
        <label
          className={cn(
            'flex flex-col items-center justify-center p-10 cursor-pointer rounded-xl transition-all duration-300',
            isDragging ? 'bg-primary/10' : 'hover:bg-muted/30'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {selectedFile ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-savings/20 flex items-center justify-center mb-4 shadow-glow-savings">
                <CheckCircle2 className="w-8 h-8 text-savings" />
              </div>
              <p className="text-lg font-display font-semibold text-foreground mb-1">File Selected</p>
              <p className="text-sm text-muted-foreground mb-2">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </>
          ) : (
            <>
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
                isDragging ? 'bg-primary/30 shadow-glow' : 'bg-primary/15'
              )}>
                <Upload className={cn(
                  'w-8 h-8 transition-colors',
                  isDragging ? 'text-primary' : 'text-primary/80'
                )} />
              </div>
              <p className="text-lg font-display font-semibold text-foreground mb-1">
                {isDragging ? 'Drop your file here' : 'Upload Smart Meter Data'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file, or click to browse
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4 text-primary/60" />
                <span>Accepts .csv files</span>
              </div>
            </>
          )}
        </label>
      </CardContent>
    </Card>
  );
}