"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Users, Search, Ban, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  id: string; username: string; email: string; balance: number; coins: number;
  gamesPlayed: number; gamesWon: number; winRate: number; role: string;
  status: string; lastLoginIp: string | null; createdAt: string;
};

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchUsers(); }, [page, statusFilter]);

  const fetchUsers = async () => {
    const params = new URLSearchParams({ page: page.toString(), limit: "15" });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    }
  };

  const handleAction = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) {
      toast.success(`User ${action}ed`);
      fetchUsers();
    } else {
      toast.error("Failed to update user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
            <Users size={24} className="text-blue-400" /> User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">View and manage platform users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="Search..." className="h-9 pl-9 pr-3 rounded-lg glass-input text-sm w-48"
            />
          </div>
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg glass-input text-sm bg-[#131315]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase">User</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase">Balance</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase hidden md:table-cell">Games</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase hidden lg:table-cell">Win Rate</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase">Status</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-medium">{u.username}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-green-400 font-bold">Rs. {u.balance.toFixed(2)}</span>
                    <div className="text-xs text-muted-foreground">🪙 {u.coins}</div>
                  </td>
                  <td className="p-4 hidden md:table-cell">{u.gamesPlayed}</td>
                  <td className="p-4 hidden lg:table-cell">{u.winRate}%</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      u.status === "active" ? "bg-green-500/20 text-green-400" :
                      u.status === "banned" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.status !== "banned" && (
                        <button onClick={() => handleAction(u.id, "ban")}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Ban">
                          <Ban size={14} />
                        </button>
                      )}
                      {u.status !== "restricted" && u.status !== "banned" && (
                        <button onClick={() => handleAction(u.id, "restrict")}
                          className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors" title="Restrict">
                          <ShieldAlert size={14} />
                        </button>
                      )}
                      {u.status !== "active" && (
                        <button onClick={() => handleAction(u.id, "activate")}
                          className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors" title="Activate">
                          <ShieldCheck size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg glass-card text-xs disabled:opacity-30">Prev</button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg glass-card text-xs disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
