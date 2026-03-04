import { PublicLayout } from "@/components/PublicLayout";
import { PageTransition } from "@/components/PageTransition";

export default function PrivacyPage() {
  return (
    <PageTransition>
      <PublicLayout>
        <div className="container max-w-4xl py-16 px-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: March 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground">

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Data Controller</h2>
              <p className="text-muted-foreground leading-relaxed">
                GPX TrackPro is the data controller for your personal data within the meaning of Regulation (EU) 2016/679 (GDPR).
                To exercise your rights or for any questions, contact us via the <a href="/contact" className="text-accent hover:underline">Contact</a> page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Data Collected</h2>
              <p className="text-muted-foreground leading-relaxed">We collect the following data:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3 ml-3">
                <li><strong className="text-foreground">Identification data:</strong> first name, last name, email address.</li>
                <li><strong className="text-foreground">Sports data:</strong> GPX files, activity metrics (distance, speed, elevation, heart rate).</li>
                <li><strong className="text-foreground">Profile data:</strong> profile photo, primary sport, social media links (optional).</li>
                <li><strong className="text-foreground">Connection data:</strong> access logs, IP address (for security purposes).</li>
                <li><strong className="text-foreground">Payment data:</strong> processed exclusively by Stripe — we never store your banking details.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Purposes of Processing</h2>
              <p className="text-muted-foreground leading-relaxed">Your data is used to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3 ml-3">
                <li>Provide and improve the Service.</li>
                <li>Manage your account and subscription.</li>
                <li>Send you transactional emails (email verification, password reset, notifications).</li>
                <li>Ensure security and prevent abuse.</li>
                <li>Comply with our legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Legal Basis</h2>
              <p className="text-muted-foreground leading-relaxed">
                The processing of your data is based on:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3 ml-3">
                <li>Performance of a contract (provision of the Service).</li>
                <li>Your consent (optional communications).</li>
                <li>Our legitimate interests (security, improvement of the Service).</li>
                <li>Compliance with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Retention Period</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is retained for the duration of your active account, then deleted within 30 days following account deletion, unless a longer retention period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We never sell your data. Your data may be shared with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3 ml-3">
                <li><strong className="text-foreground">Stripe</strong> — for payment processing.</li>
                <li><strong className="text-foreground">Google</strong> — if you use Google OAuth login (optional).</li>
                <li><strong className="text-foreground">VPS host</strong> — technical infrastructure (data remains within the EU).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures: password encryption (bcrypt), HTTPS/TLS, restricted data access, and regular backups.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Your GDPR Rights</h2>
              <p className="text-muted-foreground leading-relaxed">You have the following rights:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3 ml-3">
                <li><strong className="text-foreground">Right of access:</strong> obtain a copy of your data (export available from Settings → Export My Data).</li>
                <li><strong className="text-foreground">Right to rectification:</strong> correct your data from your profile.</li>
                <li><strong className="text-foreground">Right to erasure:</strong> delete your account and data from the Profile page.</li>
                <li><strong className="text-foreground">Right to data portability:</strong> export your data in JSON format.</li>
                <li><strong className="text-foreground">Right to object:</strong> contact us regarding any processing based on our legitimate interests.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise these rights, contact us via the <a href="/contact" className="text-accent hover:underline">Contact</a> page.
                You may also lodge a complaint with the relevant data protection authority.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                GPX TrackPro only uses data strictly necessary for the operation of the Service (authentication token stored in localStorage).
                No third-party tracking or advertising cookies are used.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                This policy may be updated. In the event of a material change, we will notify you by email.
                Your continued use of the Service constitutes acceptance of the changes.
              </p>
            </section>

          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
