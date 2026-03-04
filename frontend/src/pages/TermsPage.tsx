import { PublicLayout } from "@/components/PublicLayout";
import { PageTransition } from "@/components/PageTransition";

export default function TermsPage() {
  return (
    <PageTransition>
      <PublicLayout>
        <div className="container max-w-4xl py-16 px-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: March 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground">

            <section>
              <h2 className="text-xl font-semibold mb-3">1. About the Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                GPX TrackPro is a SaaS platform for analyzing and tracking sports activities (hereinafter "the Service").
                The Service is published and operated by GPX TrackPro (hereinafter "the Publisher").
                By accessing the Service, you unconditionally accept these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Access to the Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Access to the Service requires creating a user account and verifying your email address.
                All registrations are subject to prior approval by an administrator.
                The Publisher reserves the right to refuse or delete any account without notice or justification.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Access to certain features may require a paid subscription.
                Available plans are described on the Service's pricing page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Account</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for keeping your credentials confidential. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3 ml-3">
                <li>Provide accurate information during registration.</li>
                <li>Not share your account with third parties.</li>
                <li>Notify us immediately of any unauthorized access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data and GPX Files</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of all GPX files and sports data you upload to the Service.
                By using the Service, you grant the Publisher a limited, non-exclusive license to process your data solely for the purpose of providing the Service.
                The Publisher does not sell your data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">The following are prohibited:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3 ml-3">
                <li>Using the Service for illegal purposes.</li>
                <li>Attempting to access other users' data.</li>
                <li>Submitting malicious files.</li>
                <li>Performing denial-of-service attacks.</li>
                <li>Circumventing the Service's security mechanisms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Subscriptions and Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                Paid subscriptions are billed through Stripe. By subscribing, you accept the pricing terms presented at the time of purchase.
                Subscriptions are commitment-free and can be cancelled at any time from your Settings page.
                No refunds are issued for periods already elapsed, unless otherwise required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Publisher strives to keep the Service available 24/7, but does not guarantee uninterrupted availability.
                Scheduled maintenance may be performed with or without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is". The Publisher shall not be held liable for data loss, indirect damages, or loss of revenue resulting from the use of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may delete your account at any time from the Profile page (Danger Zone section).
                The Publisher may terminate your access in the event of a breach of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to These Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Publisher reserves the right to modify these Terms of Service at any time.
                Changes take effect upon publication. Your continued use of the Service constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Service are governed by applicable law. Any disputes shall be subject to the exclusive jurisdiction of the competent courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For any questions regarding these Terms of Service, contact us via the <a href="/contact" className="text-accent hover:underline">Contact</a> page.
              </p>
            </section>

          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
