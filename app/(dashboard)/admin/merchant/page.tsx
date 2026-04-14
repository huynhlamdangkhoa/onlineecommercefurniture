"use client";
import React, { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import Link from "next/link";
import apiClient from "@/lib/api";
import { toast } from "react-hot-toast";

interface MerchantItem {
  id: string;
  name: string;
  email: string | null;
  status: string;
  productCount: number;
}

export default function MerchantPage() {
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/merchants");

      if (!response.ok) {
        throw new Error("Failed to fetch merchants");
      }

      const data = await response.json();

      const normalizedData: MerchantItem[] = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id,
            name: item.name || item.fullName || "N/A",
            email: item.email || "N/A",
            status: item.status || "ACTIVE",
            productCount: Array.isArray(item.products)
              ? item.products.length
              : item._count?.products ?? item.productCount ?? 0,
          }))
        : [];

      setMerchants(normalizedData);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      toast.error("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Merchants</h1>
          <Link
            href="/admin/merchant/new"
            className="bg-[#00d08e] text-white px-6 py-2 rounded-md hover:bg-[#05ffb0] transition"
          >
            Add Merchant
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="text-center py-10">Loading merchants...</div>
          ) : merchants.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left">Name</th>
                  <th className="py-3 text-left">Email</th>
                  <th className="py-3 text-left">Status</th>
                  <th className="py-3 text-left">Products</th>
                  <th className="py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">{merchant.name}</td>
                    <td className="py-4">{merchant.email || "N/A"}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          merchant.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {merchant.status}
                      </span>
                    </td>
                    <td className="py-4">{merchant.productCount}</td>
                    <td className="py-4">
                      <Link
                        href={`/admin/merchant/${merchant.id}`}
                        className="text-[#00d08e] hover:underline mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/merchant/${merchant.id}`}
                        className="text-[#00d08e] hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10">No merchants found</div>
          )}
        </div>
      </div>
    </div>
  );
}