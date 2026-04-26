export default function FairPlayPolicyPage() {
  return (
    <div className="min-h-screen py-20 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="glass-card p-8 md:p-12 rounded-3xl">
        <h1 className="text-4xl font-bold font-heading mb-8 text-blue-400">Fair Play Policy</h1>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Pure Skill Guarantee</h2>
            <p>
              SkillArena is committed to providing a 100% skill-based environment. We do not manipulate match outcomes, 
              dice rolls, or rng in favor of any player or the house. All games have deterministic rules and public mechanics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Anti-Cheat Systems</h2>
            <p>
              Our backend continuously monitors gameplay for superhuman reaction times, impossible accuracy, and statistical anomalies. 
              Any use of macros, aim-bots, auto-typers, or memory injection will trigger automated bans.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Bot Transparency</h2>
            <p>
              To ensure matches are always available, we utilize AI bots to fill empty slots. These bots are explicitly 
              marked with a "(Bot)" tag. Their difficulty is strictly tuned to human-equivalent reaction times and accuracy rates. 
              They do not have access to game state information that a human player wouldn't have.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Disconnects and Lag</h2>
            <p>
              If a player disconnects during a live money match, they will automatically forfeit the round or receive a score 
              of zero for missed actions. Please ensure a stable internet connection before competing.
            </p>
          </section>
          
          <p className="pt-8 text-sm opacity-50">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
