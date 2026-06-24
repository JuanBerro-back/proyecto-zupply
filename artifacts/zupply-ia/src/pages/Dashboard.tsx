import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, DollarSign, Users, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading || !summary) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pedidos del Mes" value={summary.totalOrdersThisMonth.toString()} icon={ShoppingCart} />
        <MetricCard title="Gasto del Mes" value={`$${summary.totalSpentThisMonth.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Proveedores Activos" value={summary.activeSuppliers.toString()} icon={Users} />
        <MetricCard title="Alertas de Stock" value={summary.criticalStockCount.toString()} icon={AlertTriangle} variant="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.topSuppliers.map(supplier => (
                <div key={supplier.id} className="flex justify-between items-center pb-4 border-b last:border-0">
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">{supplier.ordersCount} pedidos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">${supplier.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recentAlerts.map(alert => (
                <div key={alert.id} className="flex gap-4 p-3 rounded-lg bg-accent/50 text-accent-foreground items-start">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(alert.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, variant = "default" }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className={`text-2xl font-bold mt-2 ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
