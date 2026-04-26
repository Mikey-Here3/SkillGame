export default function TermsPage() {
  return (
    <div className="min-h-screen py-20 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="glass-card p-8 md:p-12 rounded-3xl">
        <h1 className="text-4xl font-bold font-heading mb-8 text-blue-400">Terms & Conditions</h1>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SkillArena, you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Skill-Based Gaming</h2>
            <p>
              SkillArena is a platform for games of skill. Outcomes are determined solely by the player's 
              knowledge, dexterity, and reaction times, not by chance. There are no guaranteed earnings. 
              Players participate at their own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Account Integrity</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. 
              Using third-party software, macros, or bots to gain an unfair advantage is strictly prohibited 
              and will result in immediate account termination and forfeiture of funds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Deposits and Withdrawals</h2>
            <p>
              All deposits are final. Withdrawals are subject to manual review to ensure compliance with our 
              fair play policies. We reserve the right to withhold funds if fraudulent activity is suspected.
            </p>
          </section>
          
          <p className="pt-8 text-sm opacity-50">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
