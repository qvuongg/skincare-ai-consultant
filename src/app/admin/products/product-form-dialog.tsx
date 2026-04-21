"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DBProduct } from "@/lib/supabase/db";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: DBProduct | null; // null = add mode
  onSuccess: () => void;
}

const EMPTY: Omit<DBProduct, "id"> = {
  name: "",
  brand: "",
  key_ingredients: [],
  skin_type_tags: [],
  price_range: "mid",
  category: "cleanser",
  image_url: "",
  affiliate_url: "",
  tagline: "",
  rating: undefined,
};

export function ProductFormDialog({ open, onOpenChange, product, onSuccess }: Props) {
  const isEdit = product !== null;
  const [form, setForm] = useState<Omit<DBProduct, "id">>(EMPTY);
  const [ingredientInput, setIngredientInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(product ? {
        name: product.name,
        brand: product.brand,
        key_ingredients: [...product.key_ingredients],
        skin_type_tags: [...product.skin_type_tags],
        price_range: product.price_range,
        category: product.category,
        image_url: product.image_url ?? "",
        affiliate_url: product.affiliate_url ?? "",
        tagline: product.tagline ?? "",
        rating: product.rating,
      } : EMPTY);
      setIngredientInput("");
      setTagInput("");
      setError(null);
    }
  }, [open, product]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addTag(arr: "key_ingredients" | "skin_type_tags", input: string, setInput: (v: string) => void) {
    const vals = input.split(",").map(s => s.trim()).filter(Boolean);
    if (!vals.length) return;
    setForm(prev => ({ ...prev, [arr]: [...new Set([...prev[arr], ...vals])] }));
    setInput("");
  }

  function removeTag(arr: "key_ingredients" | "skin_type_tags", val: string) {
    setForm(prev => ({ ...prev, [arr]: prev[arr].filter(v => v !== val) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim()) {
      setError("Tên sản phẩm và thương hiệu là bắt buộc.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        image_url: form.image_url || null,
        affiliate_url: form.affiliate_url || null,
        tagline: form.tagline || null,
        rating: form.rating ?? null,
      };

      const endpoint = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-[#D4AF37]/30 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37] text-xl font-bold">
            {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {isEdit ? `Đang chỉnh sửa: ${product!.name}` : "Điền thông tin sản phẩm mới vào catalogue."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {error && (
            <div className="rounded-md bg-red-950/60 border border-red-700/50 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Name + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Tên sản phẩm *</Label>
              <Input className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50"
                value={form.name} onChange={e => set("name", e.target.value)} placeholder="CeraVe Foaming Cleanser" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Thương hiệu *</Label>
              <Input className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50"
                value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="CeraVe" required />
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Mô tả ngắn (tagline)</Label>
            <Textarea className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50 resize-none min-h-16"
              value={form.tagline ?? ""} onChange={e => set("tagline", e.target.value)} placeholder="Sữa rửa mặt tạo bọt nhẹ nhàng..." />
          </div>

          {/* Category + Price range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Danh mục</Label>
              <Select value={form.category} onValueChange={v => set("category", v as DBProduct["category"])}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-[#D4AF37]/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {["cleanser","treatment","moisturizer","sunscreen"].map(c => (
                    <SelectItem key={c} value={c} className="capitalize focus:bg-[#D4AF37]/10">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Phân khúc giá</Label>
              <Select value={form.price_range} onValueChange={v => set("price_range", v as DBProduct["price_range"])}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-[#D4AF37]/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectItem value="budget" className="focus:bg-[#D4AF37]/10">Rẻ (budget)</SelectItem>
                  <SelectItem value="mid" className="focus:bg-[#D4AF37]/10">Tầm trung (mid)</SelectItem>
                  <SelectItem value="premium" className="focus:bg-[#D4AF37]/10">Cao cấp (premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key ingredients */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Thành phần chính</Label>
            <div className="flex gap-2">
              <Input className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50 flex-1"
                value={ingredientInput} onChange={e => setIngredientInput(e.target.value)}
                placeholder="Niacinamide, Hyaluronic Acid (phân cách bằng dấu phẩy)"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("key_ingredients", ingredientInput, setIngredientInput); } }} />
              <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                onClick={() => addTag("key_ingredients", ingredientInput, setIngredientInput)}>
                Thêm
              </Button>
            </div>
            {form.key_ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.key_ingredients.map(ing => (
                  <Badge key={ing} variant="secondary" className="bg-zinc-800 text-zinc-300 pr-1 gap-1">
                    {ing}
                    <button type="button" onClick={() => removeTag("key_ingredients", ing)} className="hover:text-red-400 ml-0.5"><X className="size-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Skin type tags */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Tags loại da</Label>
            <div className="flex gap-2">
              <Input className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50 flex-1"
                value={tagInput} onChange={e => setTagInput(e.target.value)}
                placeholder="Oily, Acne-prone, Sensitive (phân cách bằng dấu phẩy)"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag("skin_type_tags", tagInput, setTagInput); } }} />
              <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                onClick={() => addTag("skin_type_tags", tagInput, setTagInput)}>
                Thêm
              </Button>
            </div>
            {form.skin_type_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skin_type_tags.map(tag => (
                  <Badge key={tag} variant="outline" className="border-[#D4AF37]/50 text-[#D4AF37] pr-1 gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag("skin_type_tags", tag)} className="hover:text-red-400 ml-0.5"><X className="size-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* URLs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">URL hình ảnh</Label>
              <Input className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50"
                value={form.image_url ?? ""} onChange={e => set("image_url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Affiliate URL</Label>
              <Input className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50"
                value={form.affiliate_url ?? ""} onChange={e => set("affiliate_url", e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:border-zinc-500"
              onClick={() => onOpenChange(false)} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" className="bg-[#D4AF37] text-black font-semibold hover:bg-[#B8962E]" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Đang lưu...</> : isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
