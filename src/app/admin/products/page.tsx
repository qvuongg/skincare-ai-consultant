"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DBProduct, fetchAllProducts, deleteProduct } from "@/lib/supabase/db";
import { t } from "@/lib/translations";

export default function ProductsPage() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#D4AF37]">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa các sản phẩm trong hệ thống.</p>
        </div>
        <Button className="bg-[#D4AF37] text-black hover:bg-[#B8962E]">
          <Plus className="mr-2 size-4" /> Thêm sản phẩm
        </Button>
      </div>

      <Card className="bg-black border-[#D4AF37]/20">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-[#D4AF37]/10">
                <TableHead className="w-[100px]">Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead>Phân khúc</TableHead>
                <TableHead>Thành phần</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Đang tải...</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Chưa có sản phẩm nào.</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5">
                    <TableCell>
                      <div className="relative size-12 overflow-hidden rounded border border-[#D4AF37]/20 bg-white">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="object-contain p-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#D4AF37]">{product.name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize border-[#D4AF37] text-[#D4AF37]">
                        {product.price_range}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {product.key_ingredients.slice(0, 2).map((ing) => (
                          <Badge key={ing} variant="secondary" className="text-[10px] py-0">
                            {ing}
                          </Badge>
                        ))}
                        {product.key_ingredients.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{product.key_ingredients.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300">
                          <Pencil className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="text-amber-400 hover:text-amber-300">
                            <ExternalLink className="size-4" />
                          </Button>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
