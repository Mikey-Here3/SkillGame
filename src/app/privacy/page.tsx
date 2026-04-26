export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-20 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="glass-card p-8 md:p-12 rounded-3xl">
        <h1 className="text-4xl font-bold font-heading mb-8 text-blue-400">Privacy Policy</h1>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Data Collection</h2>
            <p>
              We collect minimal personal data necessary to provide our services. This includes your email address, 
              username, and payment information for processing deposits and withdrawals. We do not require KYC or 
              identity verification at this time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. How We Use Your Data</h2>
            <p>
              Your data is used to maintain your account, secure your balance, and communicate important updates. 
              Game performance metrics (scores, win rates) are public to support the competitive nature of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Data Sharing</h2>
            <p>
              We do not sell or rent your personal information to third parties. Data may be shared with payment 
              processors strictly for the purpose of facilitating your requested transactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Security</h2>
            <p>
              We employ industry-standard encryption to protect your data. However, no method of transmission over 
              the internet is 100% secure.
            </p>
          </section>
          
          <p className="pt-8 text-sm opacity-50">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
