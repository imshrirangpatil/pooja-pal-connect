import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, IndianRupee, Send, CreditCard, Smartphone, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/pandits/$id")({ component: AdminPanditDetail });

type Method = "upi" | "bank";

function AdminPanditDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: pandit } = useQuery({
    queryKey: ["admin-pandit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pandits").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["admin-pandit-payouts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pandit_payouts")
        .select("*")
        .eq("pandit_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-pandit-bookings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, payment_status, recipient_name, created_at")
        .eq("pandit_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const totalPaid = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount_paise || 0), 0);
  const pendingCount = payouts.filter((p) => p.status === "pending").length;

  if (!pandit) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const defaultMethod: Method = pandit.upi_id ? "upi" : "bank";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to pandits
      </button>

      <Card className="space-y-1 p-4">
        <p className="font-bold">{pandit.name} {pandit.verified && "✓"}</p>
        <p className="text-[11px] text-muted-foreground">{pandit.city} · {pandit.experience} yrs · ⭐ {Number(pandit.rating)} ({pandit.reviews})</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-bold">Payout details</h3>
        {pandit.upi_id || pandit.account_number ? (
          <div className="mt-2 space-y-1.5 text-xs">
            {pandit.upi_id && (
              <div className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-accent" /> <span className="font-mono">{pandit.upi_id}</span></div>
            )}
            {pandit.account_number && (
              <div className="flex items-start gap-2">
                <CreditCard className="mt-0.5 h-3.5 w-3.5 text-accent" />
                <div>
                  <p className="font-semibold">{pandit.account_holder}</p>
                  <p className="font-mono">{pandit.account_number} · {pandit.ifsc}</p>
                  {pandit.bank_name && <p className="text-muted-foreground">{pandit.bank_name}</p>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <PayoutDetailsForm panditId={id} />
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Stat k={`₹${(totalPaid / 100).toLocaleString("en-IN")}`} v="Total paid" />
        <Stat k={String(payouts.filter((p) => p.status === "paid").length)} v="Payouts" />
        <Stat k={String(pendingCount)} v="Pending" />
      </div>

      <SendPayoutCard panditId={id} defaultMethod={defaultMethod} onDone={() => {
        qc.invalidateQueries({ queryKey: ["admin-pandit-payouts", id] });
      }} />

      <Card className="p-4">
        <h3 className="text-sm font-bold">Recent bookings</h3>
        {bookings.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No bookings linked to this pandit yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-xl border border-border/60 p-2.5 text-xs">
                <div>
                  <p className="font-semibold">{b.recipient_name}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString()} · {b.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{(b.total / 100).toLocaleString("en-IN")}</p>
                  <PayBookingButton panditId={id} orderId={b.id} amountPaise={Math.round(b.total * 0.85)} method={defaultMethod} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-bold">Payout history</h3>
        {payouts.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No payouts yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2 rounded-xl border border-border/60 p-2.5 text-xs">
                <div>
                  <p className="font-semibold">₹{(p.amount_paise / 100).toLocaleString("en-IN")} · {p.method.toUpperCase()}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()} {p.reference ? ` · ref ${p.reference}` : ""}
                  </p>
                  {p.notes && <p className="mt-0.5 text-[10px] text-muted-foreground">{p.notes}</p>}
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  p.status === "paid" ? "bg-green-100 text-green-700" :
                  p.status === "pending" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {p.status === "paid" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PayoutDetailsForm({ panditId }: { panditId: string }) {
  const qc = useQueryClient();
  const [upi, setUpi] = useState("");
  const [holder, setHolder] = useState("");
  const [acct, setAcct] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bank, setBank] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pandits").update({
        upi_id: upi.trim() || null,
        account_holder: holder.trim() || null,
        account_number: acct.trim() || null,
        ifsc: ifsc.trim().toUpperCase() || null,
        bank_name: bank.trim() || null,
      }).eq("id", panditId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout details saved");
      qc.invalidateQueries({ queryKey: ["admin-pandit", panditId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-amber-700">No payout details on file. Add UPI or bank info to send payments.</p>
      <Input placeholder="UPI ID (e.g. name@okhdfc)" value={upi} onChange={(e) => setUpi(e.target.value)} />
      <p className="text-center text-[10px] text-muted-foreground">— or —</p>
      <Input placeholder="Account holder name" value={holder} onChange={(e) => setHolder(e.target.value)} />
      <Input placeholder="Account number" inputMode="numeric" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ""))} />
      <Input placeholder="IFSC code" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))} />
      <Input placeholder="Bank name (optional)" value={bank} onChange={(e) => setBank(e.target.value)} />
      <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>Save details</Button>
    </div>
  );
}

function SendPayoutCard({ panditId, defaultMethod, onDone }: {
  panditId: string;
  defaultMethod: Method;
  onDone: () => void;
}) {
  const [method, setMethod] = useState<Method>(defaultMethod);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const send = useMutation({
    mutationFn: async () => {
      const rupees = Number(amount);
      if (!rupees || rupees <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("pandit_payouts").insert({
        pandit_id: panditId,
        amount_paise: Math.round(rupees * 100),
        method,
        status: "paid",
        reference: reference.trim() || `PN${Date.now()}`,
        notes: notes.trim() || null,
        paid_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment sent ⚡");
      setAmount(""); setReference(""); setNotes("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="space-y-2 p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-bold"><IndianRupee className="h-4 w-4" /> Send instant payment</h3>
      <div className="grid grid-cols-2 gap-2">
        {(["upi", "bank"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`rounded-xl border p-2 text-xs font-semibold transition ${
              method === m ? "border-primary bg-secondary/60 shadow-glow" : "border-border bg-card text-muted-foreground"
            }`}
          >
            {m === "upi" ? "UPI" : "Bank transfer"}
          </button>
        ))}
      </div>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Amount in ₹"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input placeholder="Reference / UTR (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
      <Textarea rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button onClick={() => send.mutate()} disabled={send.isPending} className="w-full gap-1.5">
        <Send className="h-3.5 w-3.5" /> {send.isPending ? "Sending…" : `Send ₹${amount || "0"}`}
      </Button>
      <p className="text-center text-[10px] text-muted-foreground">
        Recorded as instant payout · pandit notified via SMS
      </p>
    </Card>
  );
}

function PayBookingButton({ panditId, orderId, amountPaise, method }: {
  panditId: string;
  orderId: string;
  amountPaise: number;
  method: Method;
}) {
  const qc = useQueryClient();
  const pay = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pandit_payouts").insert({
        pandit_id: panditId,
        order_id: orderId,
        amount_paise: amountPaise,
        method,
        status: "paid",
        reference: `PN${Date.now()}`,
        notes: `Booking ${orderId.slice(0, 8)}`,
        paid_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paid ⚡");
      qc.invalidateQueries({ queryKey: ["admin-pandit-payouts", panditId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Button size="sm" variant="secondary" className="mt-1 h-6 px-2 text-[10px]" onClick={() => pay.mutate()} disabled={pay.isPending}>
      Pay ₹{(amountPaise / 100).toLocaleString("en-IN")}
    </Button>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-base font-bold">{k}</p>
      <p className="text-[10px] text-muted-foreground">{v}</p>
    </Card>
  );
}
