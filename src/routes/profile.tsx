import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Gift, HelpCircle, FileText, Globe, Bell, ChevronRight, LogOut, Heart, Wallet, Package, MapPin } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Pranam" },
      { name: "description", content: "Your Pranam account, wallet and preferences." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <MobileShell>
      <TopBar title="Profile" />

      <section className="mx-5 mt-4 rounded-3xl bg-secondary p-5 text-secondary-foreground shadow-glow">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/20 text-lg font-bold backdrop-blur">
            A
          </div>
          <div>
            <p className="text-lg font-bold">Aarav Sharma</p>
            <p className="text-xs opacity-90">+91 98765 43210</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Stat label="Bookings" value="07" />
          <Stat label="Wallet" value="₹250" />
          <Stat label="Saved" value="₹1.2k" />
        </div>
      </section>

      <div className="mt-5 space-y-1 px-5">
        <Row to="/orders" icon={<Package className="h-4 w-4" />} label="My Orders" />
        <Row to="/addresses" icon={<MapPin className="h-4 w-4" />} label="Saved Addresses" />
        <Row icon={<Wallet className="h-4 w-4" />} label="Wallet & Offers" />
        <Row icon={<Heart className="h-4 w-4" />} label="Saved Pandits" />
        <Row icon={<Gift className="h-4 w-4" />} label="Refer & Earn ₹100" />
        <Row icon={<Bell className="h-4 w-4" />} label="Notifications" />
        <Row icon={<Globe className="h-4 w-4" />} label="Language" hint="English" />
        <Row icon={<HelpCircle className="h-4 w-4" />} label="Help & Support" />
        <Row icon={<FileText className="h-4 w-4" />} label="Terms & Privacy" />
      </div>

      <div className="mx-5 mt-6 rounded-2xl border border-border/60 bg-card p-4 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Become a partner</p>
        <h3 className="mt-1 text-base font-bold">Are you a pandit or astrologer?</h3>
        <p className="mt-1 text-xs text-muted-foreground">Apply to join Pranam's verified network.</p>
        <Link to="/become-pandit" className="mt-3 block w-full rounded-full bg-foreground py-2.5 text-center text-xs font-semibold text-background">Apply now</Link>
      </div>

      <button className="mx-auto mt-6 flex items-center gap-2 text-sm font-medium text-accent">
        <LogOut className="h-4 w-4" /> Log out
      </button>
      <p className="mt-3 pb-2 text-center text-[10px] text-muted-foreground">Pranam v1.0 · Made in India</p>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-background/15 p-2.5 text-center backdrop-blur">
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] opacity-85">{label}</p>
    </div>
  );
}

function Row({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 text-left shadow-soft">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-accent">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
