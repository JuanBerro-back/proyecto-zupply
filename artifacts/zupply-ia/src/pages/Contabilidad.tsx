import { useGetAccountingSummary, useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Contabilidad() {
  const { data: summary, isLoading: loadingSummary } = useGetAccountingSummary();
  const { data: transactions, isLoading: loadingTx } = useListTransactions();

  if (loadingSummary || loadingTx) return <div>Cargando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-90">Balance de Caja</CardTitle></CardHeader>
          <CardContent><h3 className="text-3xl font-bold">${summary?.cashBalance.toLocaleString()}</h3></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Gastos este Mes</CardTitle></CardHeader>
          <CardContent><h3 className="text-3xl font-bold">${summary?.totalExpensesThisMonth.toLocaleString()}</h3></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Gastos Mes Anterior</CardTitle></CardHeader>
          <CardContent><h3 className="text-3xl font-bold text-muted-foreground">${summary?.totalExpensesLastMonth.toLocaleString()}</h3></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell>{tx.category}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === 'income' ? 'default' : 'secondary'} className={tx.type === 'expense' ? 'bg-destructive/10 text-destructive' : ''}>
                      {tx.type === 'income' ? 'Ingreso' : tx.type === 'expense' ? 'Gasto' : 'Ajuste'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-destructive' : ''}`}>
                    {tx.type === 'expense' ? '-' : '+'}${tx.amount.toLocaleString()}
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
