"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type TransactionData = {
  id: string;
  type: string;
  amount: number;
  status: string;
  method: string | null;
  description: string;
  createdAt: string;
};

export default function WalletPage() {
  const { user, token, updateBalance } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("deposit");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("easypaisa");
  const [accountDetails, setAccountDetails] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSendingToApp, setIsSendingToApp] = useState(false);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/wallet/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch { /* silent */ }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (method === "easypaisa" || method === "jazzcash") {
      setIsSendingToApp(true);
      // Simulate app request delay
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          method, 
          transactionId,
          metadata: { phoneNumber } 
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      
      if (method === "easypaisa" || method === "jazzcash") {
        toast.success(`Request sent to your ${method} app! Please approve the payment on your phone.`);
      } else {
        toast.success("Deposit request submitted! Awaiting admin approval.");
      }
      
      setAmount(""); setTransactionId(""); setPhoneNumber("");
      fetchTransactions();
    } catch { toast.error("Failed to submit deposit"); }
    finally { setLoading(false); setIsSendingToApp(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(amount), method, accountDetails }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Withdrawal request submitted!");
      updateBalance(user!.balance - parseFloat(amount));
      setAmount(""); setAccountDetails("");
      fetchTransactions();
    } catch { toast.error("Failed to submit withdrawal"); }
    finally { setLoading(false); }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock size={14} className="text-yellow-400" />;
      case "approved": case "completed": return <CheckCircle size={14} className="text-green-400" />;
      case "rejected": return <XCircle size={14} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
          <Wallet size={28} className="text-green-400" /> Wallet
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your funds</p>
      </div>

      {/* Balance Card */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-3xl font-bold font-heading text-green-400">Rs. {user?.balance.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coins</p>
            <p className="text-2xl font-bold font-heading text-amber-400">🪙 {user?.coins}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "deposit" as const, label: "Deposit", icon: ArrowDownToLine },
          { key: "withdraw" as const, label: "Withdraw", icon: ArrowUpFromLine },
          { key: "history" as const, label: "History", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20"
                : "glass-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Deposit Form */}
      {activeTab === "deposit" && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold font-heading mb-4">Make a Deposit</h3>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Amount (Rs.)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" min="1" step="1" className="w-full h-11 px-4 rounded-xl glass-input text-sm" required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-11 px-4 rounded-xl glass-input text-sm bg-[#131315]">
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            {(method === "easypaisa" || method === "jazzcash") && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Account Phone Number</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="03XXXXXXXXX" className="w-full h-11 px-4 rounded-xl glass-input text-sm" required />
                <p className="text-[10px] text-muted-foreground mt-1.5">We will send a payment request directly to your {method === "easypaisa" ? "Easypaisa" : "JazzCash"} app.</p>
              </div>
            )}
            {method !== "easypaisa" && method !== "jazzcash" && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Transaction ID (optional)</label>
                <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="TXN123..." className="w-full h-11 px-4 rounded-xl glass-input text-sm" />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full h-11 rounded-xl btn-neon text-sm font-semibold disabled:opacity-50 relative overflow-hidden">
              <span className={isSendingToApp ? "opacity-0" : "opacity-100"}>
                {loading ? "Submitting..." : (method === "easypaisa" || method === "jazzcash" ? `Pay with ${method === "easypaisa" ? "Easypaisa" : "JazzCash"}` : "Submit Deposit Request")}
              </span>
              {isSendingToApp && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-blue-600">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending request to app...</span>
                </div>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw Form */}
      {activeTab === "withdraw" && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold font-heading mb-4">Request Withdrawal</h3>
          {user && user.gamesPlayed < 10 && (
            <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
              ⚠️ You need to play at least 10 games before withdrawing. Currently: {user.gamesPlayed}/10
            </div>
          )}
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Amount (Rs.)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50" min="1" max={user?.balance} step="1" className="w-full h-11 px-4 rounded-xl glass-input text-sm" required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Withdrawal Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-11 px-4 rounded-xl glass-input text-sm bg-[#131315]">
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Account Details</label>
              <input type="text" value={accountDetails} onChange={(e) => setAccountDetails(e.target.value)} placeholder="Account number or address" className="w-full h-11 px-4 rounded-xl glass-input text-sm" required />
            </div>
            <button type="submit" disabled={loading || (user?.gamesPlayed || 0) < 10} className="w-full h-11 rounded-xl btn-neon text-sm font-semibold disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Withdrawal Request"}
            </button>
          </form>
        </div>
      )}

      {/* Transaction History */}
      {activeTab === "history" && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold font-heading mb-4">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === "deposit" ? "bg-green-500/20" : tx.type === "withdraw" ? "bg-red-500/20" : "bg-blue-500/20"
                    }`}>
                      {tx.type === "deposit" ? <ArrowDownToLine size={14} className="text-green-400" /> :
                       tx.type === "withdraw" ? <ArrowUpFromLine size={14} className="text-red-400" /> :
                       <Wallet size={14} className="text-blue-400" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium capitalize">{tx.type}</div>
                      <div className="text-xs text-muted-foreground">{tx.method || "N/A"} • {new Date(tx.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold font-heading ${tx.type === "deposit" || tx.type === "reward" ? "text-green-400" : "text-red-400"}`}>
                      {tx.type === "deposit" || tx.type === "reward" ? "+" : "-"}Rs. {tx.amount.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {statusIcon(tx.status)} {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
