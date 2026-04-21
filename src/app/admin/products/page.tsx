"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DBProduct, fetchAllProducts } from "@/lib/supabase/db";
import { ProductFormDialog } from "./product-form-dialog";

export default function ProductsPage() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [filtered, setFiltered] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DBProduct | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllProducts();
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    ));
  }, [search, products]);

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert("Xóa thất bại. Vui lòng thử lại.");
    } finally {
      setDeleting(null);
    }
  }

  const priceLabel: Record<string, string> = { budget: "Rẻ", mid: "Tầm trung", premium: "Cao cấp" };
  const priceColor: Record<string, string> = {
    budget: "border-emerald-500/60 text-emerald-400",
    mid: "border-sky-500/60 text-sky-400",
    premium: "border-[#D4AF37]/60 text-[#D4AF37]",
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#D4AF37]">Quản lý sản phẩm</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {products.length} sản phẩm trong catalogue
            </p>
          </div>
          <Button
            className="bg-[#D4AF37] text-black font-semibold hover:bg-[#B8962E]"
            onClick={() => { setEditTarget(null); setDialogOpen(true); }}
          >
            <Plus className="mr-2 size-4" /> Thêm sản phẩm
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="Tìm theo tên, thương hiệu..."
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#D4AF37]/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Card className="bg-zinc-950 border-[#D4AF37]/20 overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-zinc-800">
            <CardTitle className="text-base text-zinc-100">Danh sách sản phẩm</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">{filtered.length} kết quả</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-zinc-800">
                    {["Ảnh","Tên sản phẩm","Thương hiệu","Danh mục","Phân khúc","Thành phần","Thao tác"].map(h => (
                      <TableHead key={h} className={`text-zinc-400 text-xs font-medium ${h === "Thao tác" ? "text-right" : ""}`}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="py-16 text-center"><Loader2 className="mx-auto size-6 animate-spin text-[#D4AF37]" /></TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-16 text-center text-zinc-500">{search ? "Không tìm thấy." : "Chưa có sản phẩm nào."}</TableCell></TableRow>
                  ) : filtered.map(product => (
                    <TableRow key={product.id} className="border-b border-zinc-800/60 hover:bg-[#D4AF37]/5 transition-colors">
                      <TableCell>
                        <div className="size-12 overflow-hidden rounded-md border border-zinc-700 bg-white flex items-center justify-center">
                          {product.image_url
                            ? <img src={product.image_url} alt={product.name} className="object-contain p-1 size-full" />
                            : <span className="text-[10px] text-zinc-400">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-[#D4AF37] text-sm leading-tight">{product.name}</p>
                        {product.tagline && <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{product.tagline}</p>}
                      </TableCell>
                      <TableCell className="text-zinc-300 text-sm">{product.brand}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 capitalize text-[11px]">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize text-[11px] ${priceColor[product.price_range] ?? "border-zinc-600 text-zinc-400"}`}>
                          {priceLabel[product.price_range] ?? product.price_range}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {product.key_ingredients.slice(0, 2).map(ing => (
                            <Badge key={ing} variant="secondary" className="text-[10px] py-0 bg-zinc-800 text-zinc-400">{ing}</Badge>
                          ))}
                          {product.key_ingredients.length > 2 && (
                            <span className="text-[10px] text-zinc-500">+{product.key_ingredients.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8 text-sky-400 hover:text-sky-300 hover:bg-sky-400/10" onClick={() => { setEditTarget(product); setDialogOpen(true); }}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" disabled={deleting === product.id} onClick={() => handleDelete(product.id)}>
                            {deleting === product.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                          </Button>
                          {product.affiliate_url && (
                            <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="size-8 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10">
                                <ExternalLink className="size-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editTarget}
        onSuccess={loadProducts}
      />
    </>
  );
}
