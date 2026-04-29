import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function OwnerMessages() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Messages</h2>
        <p className="text-sm text-muted-foreground">Échanges avec l'administration au sujet de tes biens.</p>
      </div>

      <Card className="p-10 text-center text-sm text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/60" />
        <p className="font-medium text-foreground mb-1">Aucun message pour l'instant</p>
        <p className="text-xs">Quand l'administration commentera l'un de tes biens (par ex. demande de correction), le message apparaîtra ici.</p>
        <p className="text-[11px] text-muted-foreground/80 mt-3">La messagerie complète sera activée à l'étape 5.</p>
      </Card>
    </div>
  );
}
