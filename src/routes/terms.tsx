import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { BackButton } from "@/components/BackButton";
import { FileText, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Privacy - Pranam" },
      { name: "description", content: "How Pranam protects your data and the rules of using the app." },
    ],
  }),
  component: TermsPage,
});

const UPDATED = "21 June 2026";

function TermsPage() {
  return (
    <MobileShell>
      <TopBar
        title="Terms & Privacy"
        subtitle={`Last updated · ${UPDATED}`}
        right={
          <BackButton fallback="/profile" className="h-10 w-10 border border-border bg-card" />
        }
      />

      <div className="px-5 pt-4 pb-12 space-y-5">
        <p className="rounded-2xl border border-border/60 bg-card p-3 text-[11px] leading-relaxed text-muted-foreground shadow-soft">
          This page is maintained by the Pranam team to summarise common questions
          about how the app works and how your data is handled. It is not a legal
          contract substitute or independent certification.
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          <a href="#terms" className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-accent">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold">Terms of Use</span>
          </a>
          <a href="#privacy" className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-accent">
              <Lock className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold">Privacy Policy</span>
          </a>
        </div>

        {/* Terms */}
        <section id="terms" className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <h2 className="text-base font-bold">Terms of Use</h2>

          <Block title="1. About Pranam">
            Pranam is a marketplace that connects devotees with verified pandits, astrologers,
            and pooja samagri providers. By using the app you agree to these Terms.
          </Block>

          <Block title="2. Eligibility & Account">
            You must be 18+ and provide accurate details when signing up. You are responsible
            for activity on your account. Keep your OTP and login credentials confidential.
          </Block>

          <Block title="3. Bookings & Payments">
            Pooja and astrology bookings are subject to pandit availability. Once a pandit
            confirms, payments are charged to your selected method. Cancellations made at
            least 6 hours before the muhurat are eligible for a full refund; later
            cancellations may forfeit the platform fee.
          </Block>

          <Block title="4. Acceptable use">
            Don't use Pranam to harass others, share unlawful content, attempt to bypass
            security, or impersonate pandits/astrologers. We may suspend accounts that
            breach these rules.
          </Block>

          <Block title="5. Pandit & Astrologer responsibilities">
            Verified partners agree to perform shastra-correct ceremonies, arrive on time,
            and follow the platform code of conduct. Disputes are reviewed by the Pranam
            care team.
          </Block>

          <Block title="6. Intellectual property">
            App content (logos, illustrations, text) belongs to Pranam or its licensors.
            User-generated content (reviews, photos) remains yours; you grant us a license
            to display it within Pranam.
          </Block>

          <Block title="7. Limitation of liability">
            Pranam is provided “as is”. We are not liable for indirect or consequential
            damages arising from spiritual outcomes, third-party logistics or astrologer
            advice. Local consumer law remains unaffected.
          </Block>

          <Block title="8. Changes">
            We may update these Terms; material changes will be notified in-app. Continued
            use after the update constitutes acceptance.
          </Block>
        </section>

        {/* Privacy */}
        <section id="privacy" className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <h2 className="text-base font-bold">Privacy Policy</h2>

          <Block title="What we collect">
            <ul className="list-disc pl-4 space-y-1">
              <li>Account: name, phone, email, profile photo</li>
              <li>Booking details: pooja, address, muhurat preferences</li>
              <li>Birth details for astrology (date, time, place) - only when you submit them</li>
              <li>Payment status (we never store full card numbers)</li>
              <li>Device and basic usage analytics for reliability</li>
            </ul>
          </Block>

          <Block title="How we use it">
            <ul className="list-disc pl-4 space-y-1">
              <li>To match you with the right pandit/astrologer</li>
              <li>To deliver samagri and process refunds</li>
              <li>To send booking, OTP and support notifications</li>
              <li>To improve the experience and detect fraud</li>
            </ul>
          </Block>

          <Block title="Sharing">
            We share only the minimum needed: pandits get your name, phone and address for
            the booking; payment partners get the transaction reference; analytics
            providers get anonymised events. We never sell your data.
          </Block>

          <Block title="Storage & security">
            Data is stored on managed cloud infrastructure with row-level access controls,
            encrypted in transit (TLS) and at rest. Access to personal data inside Pranam
            is restricted to authorised staff for support and operations.
          </Block>

          <Block title="Your rights">
            You can request a copy of your data, correct inaccuracies, or delete your
            account from Profile → Help & Support, or by writing to us. Some records (e.g.
            tax invoices) may be retained as required by law.
          </Block>

          <Block title="Cookies & analytics">
            We use only essential cookies/local storage to keep you signed in, remember
            your language preference, cart and saved pandits.
          </Block>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <h2 className="text-base font-bold">Contact</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Questions, data requests, or grievances?
          </p>
          <a
            href="mailto:care@pranam.app"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
          >
            <Mail className="h-3.5 w-3.5" /> care@pranam.app
          </a>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Grievance Officer: Pranam Care Team · Response within 7 working days.
          </p>
        </section>
      </div>
    </MobileShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 first:mt-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
