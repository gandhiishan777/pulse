import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(11,28,48,0.05)] h-16 flex items-center border-none">
        <div className="flex justify-between items-center px-8 w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter text-slate-900">Pulse</span>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#" className="font-sans text-sm font-medium tracking-tight text-slate-500 hover:text-blue-600 transition-colors">Platform</Link>
              <Link href="#" className="font-sans text-sm font-medium tracking-tight text-slate-500 hover:text-blue-600 transition-colors">Solutions</Link>
              <Link href="#" className="font-sans text-sm font-medium tracking-tight text-slate-500 hover:text-blue-600 transition-colors">Resources</Link>
              <Link href="#" className="font-sans text-sm font-medium tracking-tight text-slate-500 hover:text-blue-600 transition-colors">Pricing</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-slate-500 hover:text-blue-600 transition-all">language</button>
            <Link href="/dashboard" className="hidden md:block font-sans text-sm font-medium tracking-tight text-slate-500 hover:text-blue-600 transition-colors">Log In</Link>
            <Link href="/dashboard" className="bg-primary-container text-on-primary-container px-5 py-2 rounded-lg font-sans text-sm font-medium tracking-tight hover:opacity-90 active:scale-95 transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="pt-16 flex-1">
        {/* Hero Section */}
        <section 
          className="relative min-h-[921px] flex items-center overflow-hidden"
          style={{ background: 'radial-gradient(circle at top right, #e5eeff 0%, #f8f9ff 100%)' }}
        >
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px]"></div>
          </div>
          <div className="container mx-auto px-8 relative z-10 py-20">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20 text-primary text-xs font-label font-bold tracking-wider uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Next-Gen Intelligence
              </div>
              <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter text-on-surface leading-[1.1]">
                Analytics for the <br /><span className="bg-gradient-to-tr from-primary to-primary-container bg-clip-text text-transparent">modern web</span>
              </h1>
              <p className="text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                Pulse transforms raw data into a premium observatory experience. No more spreadsheets—just clarity, privacy, and real-time performance.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/dashboard" className="group relative px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-headline font-semibold shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2 overflow-hidden">
                  <span>Go to Dashboard</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
                <Link href="/dashboard" className="px-8 py-4 bg-surface-container-low text-on-surface font-headline font-semibold rounded-lg hover:bg-surface-container-high transition-all">
                  View Demo
                </Link>
              </div>
            </div>
            
            {/* Hero Dashboard Preview */}
            <div className="mt-20 max-w-6xl mx-auto">
              <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-white/40 ring-1 ring-black/5">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-error/20"></div>
                    <div className="w-3 h-3 rounded-full bg-tertiary/20"></div>
                    <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                  </div>
                  <div className="h-6 w-48 bg-surface-container-high rounded-full mx-auto opacity-50"></div>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-8 h-64 bg-surface-container-low rounded-lg relative overflow-hidden hidden md:block">
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="h-4 w-32 bg-primary/10 rounded"></div>
                      <div className="flex items-end gap-1 h-32">
                        <div className="flex-1 bg-primary/20 rounded-t h-[40%]"></div>
                        <div className="flex-1 bg-primary/20 rounded-t h-[60%]"></div>
                        <div className="flex-1 bg-primary/40 rounded-t h-[45%]"></div>
                        <div className="flex-1 bg-primary/60 rounded-t h-[80%]"></div>
                        <div className="flex-1 bg-primary/40 rounded-t h-[55%]"></div>
                        <div className="flex-1 bg-primary/30 rounded-t h-[70%]"></div>
                        <div className="flex-1 bg-primary/80 rounded-t h-[95%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-4">
                    <div className="h-28 bg-surface-container-low rounded-lg p-4 flex flex-col justify-center">
                      <div className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1">Active Users</div>
                      <div className="text-3xl font-headline font-bold text-primary">12,482</div>
                    </div>
                    <div className="h-32 bg-surface-container-low rounded-lg p-4 flex flex-col justify-center">
                      <div className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1">Conversion</div>
                      <div className="text-3xl font-headline font-bold text-tertiary">3.42%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-surface">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group p-10 bg-surface-container-lowest rounded-xl transition-all hover:bg-surface-container-high duration-300">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-on-surface mb-4">Real-time Data</h3>
                <p className="text-on-surface-variant leading-relaxed font-body">
                  Stream events as they happen with sub-100ms latency. Your dashboard stays in sync with your users, worldwide.
                </p>
              </div>
              <div className="group p-10 bg-surface-container-lowest rounded-xl transition-all hover:bg-surface-container-high duration-300">
                <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>shield_person</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-on-surface mb-4">Privacy-first Tracking</h3>
                <p className="text-on-surface-variant leading-relaxed font-body">
                  GDPR and CCPA compliance baked into the core. Measure everything without ever compromising user trust or identity.
                </p>
              </div>
              <div className="group p-10 bg-surface-container-lowest rounded-xl transition-all hover:bg-surface-container-high duration-300">
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>auto_graph</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-on-surface mb-4">Beautiful Charts</h3>
                <p className="text-on-surface-variant leading-relaxed font-body">
                  Editorial-grade visualizations designed for high-density analysis. Turn complex trends into intuitive narratives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 overflow-hidden relative">
          <div className="container mx-auto px-8 relative z-10">
            <div className="bg-primary rounded-3xl p-12 md:p-24 text-center text-on-primary relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50 pointer-events-none"></div>
              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">Ready to see the future?</h2>
                <p className="text-xl text-primary-fixed-dim max-w-xl mx-auto opacity-90">
                  Join over 5,000+ teams building the next generation of web applications with Pulse Analytics.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link href="/dashboard" className="px-10 py-5 bg-white text-primary font-headline font-bold rounded-xl hover:scale-105 transition-transform shadow-2xl">
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-slate-200/20 bg-slate-50 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto space-y-4 px-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-black text-slate-900">Pulse</span>
            <span className="text-slate-500 font-sans text-[10px] uppercase tracking-widest font-semibold">© 2024 Pulse Analytics. Part of the Digital Observatory Series.</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="font-sans text-xs uppercase tracking-widest font-semibold text-slate-500 hover:text-blue-600 transition-all">Privacy Policy</Link>
            <Link href="#" className="font-sans text-xs uppercase tracking-widest font-semibold text-slate-500 hover:text-blue-600 transition-all">Terms of Service</Link>
            <Link href="#" className="font-sans text-xs uppercase tracking-widest font-semibold text-slate-500 hover:text-blue-600 transition-all">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
