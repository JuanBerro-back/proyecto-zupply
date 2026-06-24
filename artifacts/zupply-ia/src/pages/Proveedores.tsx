import { useListSuppliers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Phone, Mail, MapPin } from "lucide-react";

export default function Proveedores() {
  const { data: suppliers, isLoading } = useListSuppliers();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold">Directorio de Proveedores</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.map(supplier => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{supplier.name}</h3>
                  <Badge variant="outline" className="mt-1">{supplier.category}</Badge>
                </div>
                <div className="flex items-center text-yellow-500 font-medium">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {supplier.rating.toFixed(1)} <span className="text-muted-foreground text-xs ml-1">({supplier.reviewCount})</span>
                </div>
              </div>

              <div className="space-y-2 text-sm mt-6">
                <div className="flex items-center text-muted-foreground">
                  <div className="w-8 flex justify-center"><Phone className="w-4 h-4" /></div>
                  <span className="text-foreground">{supplier.phone}</span>
                </div>
                {supplier.email && (
                  <div className="flex items-center text-muted-foreground">
                    <div className="w-8 flex justify-center"><Mail className="w-4 h-4" /></div>
                    <span className="text-foreground">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center text-muted-foreground">
                    <div className="w-8 flex justify-center"><MapPin className="w-4 h-4" /></div>
                    <span className="text-foreground">{supplier.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
