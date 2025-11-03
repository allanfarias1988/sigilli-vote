import { Badge } from '@/components/ui/badge';
import { getStorageMode } from '@/lib/storage';
import { Database, HardDrive } from 'lucide-react';

export function StorageModeIndicator() {
  const mode = getStorageMode();
  const isLocal = mode === 'localStorage';

  return (
    <Badge 
      variant={isLocal ? "secondary" : "default"} 
      className="flex items-center gap-1"
    >
      {isLocal ? (
        <>
          <HardDrive className="h-3 w-3" />
          Modo Dev (Local)
        </>
      ) : (
        <>
          <Database className="h-3 w-3" />
          Produção
        </>
      )}
    </Badge>
  );
}
