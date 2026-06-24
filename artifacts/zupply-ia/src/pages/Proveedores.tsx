import { useState } from "react";
import {
  useListSuppliers,
  useCreateSupplierReview,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, Phone, Mail, MapPin, Trophy, Medal, Award, MessageSquarePlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewModal({
  supplier,
  onClose,
}: {
  supplier: { id: number; name: string } | null;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const createReview = useCreateSupplierReview();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!supplier || rating === 0 || !comment || !reviewerName) return;
    createReview.mutate(
      {
        id: supplier.id,
        data: { rating, comment, reviewerName },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
          toast({ title: "Reseña enviada", description: `Tu calificación para ${supplier.name} fue registrada.` });
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={!!supplier} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calificar a {supplier?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-3">
          <div className="space-y-2">
            <Label>Tu calificación</Label>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][rating]}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Tu nombre</Label>
            <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Ej: Carlos Restaurante" />
          </div>
          <div className="space-y-1">
            <Label>Comentario</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Cómo fue tu experiencia con este proveedor?"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || !comment || !reviewerName || createReview.isPending}
          >
            {createReview.isPending ? "Enviando..." : "Enviar Reseña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-300">
      <Trophy className="w-3 h-3" /> #1 Recomendado
    </div>
  );
  if (rank === 2) return (
    <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold border border-slate-300">
      <Medal className="w-3 h-3" /> #2
    </div>
  );
  if (rank === 3) return (
    <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold border border-orange-300">
      <Award className="w-3 h-3" /> #3
    </div>
  );
  return null;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function Proveedores() {
  const { data: suppliers, isLoading } = useListSuppliers();
  const [reviewTarget, setReviewTarget] = useState<{ id: number; name: string } | null>(null);

  const sorted = suppliers
    ? [...suppliers].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      })
    : [];

  if (isLoading) return <div className="text-muted-foreground">Cargando proveedores...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Red de Proveedores</h2>
          <p className="text-sm text-muted-foreground mt-1">Ordenados por puntuación algorítmica de calidad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((supplier, idx) => {
          const rank = idx + 1;
          const isTopRanked = rank <= 3;
          return (
            <Card
              key={supplier.id}
              className={`hover:shadow-md transition-all ${
                rank === 1 ? "ring-2 ring-yellow-400 shadow-yellow-100 shadow-md" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-lg font-bold">{supplier.name}</h3>
                      {isTopRanked && <RankBadge rank={rank} />}
                    </div>
                    <Badge variant="outline" className="text-xs">{supplier.category}</Badge>
                  </div>
                </div>

                <div className="mt-3 mb-4 flex items-center gap-2">
                  <StarDisplay rating={supplier.rating} />
                  <span className="text-sm font-bold">{supplier.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({supplier.reviewCount} reseñas)</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground gap-2">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span className="text-foreground">{supplier.phone}</span>
                  </div>
                  {supplier.email && (
                    <div className="flex items-center text-muted-foreground gap-2">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="text-foreground">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center text-muted-foreground gap-2">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="text-foreground">{supplier.address}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => setReviewTarget({ id: supplier.id, name: supplier.name })}
                >
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  Dejar Reseña
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ReviewModal supplier={reviewTarget} onClose={() => setReviewTarget(null)} />
    </div>
  );
}
