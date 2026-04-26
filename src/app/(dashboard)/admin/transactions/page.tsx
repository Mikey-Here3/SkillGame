"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Wallet, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

type TxRow = {
  id: string; type: string; amount: number; status: string; method: string;
  createdAt: string; user: { username: string; email: string };
};

export default function AdminTransactionsPage() {
  const { token } = useAuthStore();
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => { fetchTx(); }, [typeFilter, statusFilter]);

  const fetchTx = async () => {
    const params = new URLSearchParams({ type: typeFilter, status: statusFilter });
    const res = await fetch(`/api/admin/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
    }
  };

  const handleAction = async (transactionId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/admin/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ transactionId, action }),
    });
    if (res.ok) {
      toast.success(`Transaction ${action}d`);
      fetchTx();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
          <Wallet size={24} className="text-green-400" /> Transaction Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Approve or reject deposits & withdrawals</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "deposit", "withdraw"].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
              typeFilter === t ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" : "glass-card text-muted-foreground"
            }`}>{t}</button>
        ))}
        <div className="w-px bg-white/10 mx-2" />
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
              statusFilter === s ? "bg-purple-500/20 text-purple-400 border border-purple-500/20" : "glass-card text-muted-foreground"
            }`}>{s}</button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase">User</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase">Type</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase">Amount</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase hidden md:table-cell">Method</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase hidden md:table-cell">Date</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase">Status</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-medium">{tx.user?.username || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{tx.user?.email || ""}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      tx.type === "deposit" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>{tx.type}</span>
                  </td>
                  <td className="p-4 font-bold font-heading">Rs. {tx.amount.toFixed(2)}</td>
                  <td className="p-4 text-muted-foreground capitalize hidden md:table-cell">{tx.method || "N/A"}</td>
                  <td className="p-4 text-muted-foreground text-xs hidden md:table-cell">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1 text-xs font-bold ${
                      tx.status === "pending" ? "text-yellow-400" :
                      tx.status === "approved" ? "text-green-400" : "text-red-400"
                    }`}>
                      {tx.status === "pending" ? <Clock size={12} /> :
                       tx.status === "approved" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {tx.status === "pending" && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleAction(tx.id, "approve")}
                          className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 transition-colors">
                          Approve
                        </button>
                        <button onClick={() => handleAction(tx.id, "reject")}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
