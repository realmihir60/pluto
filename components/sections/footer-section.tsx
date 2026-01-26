import Link from "next/link"
import { Lock, Shield, Activity, Heart, Mail } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="py-20 bg-background border-t border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/[0.01] -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Logo & Mission */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="size-6" />
              <span className="text-xl font-black tracking-tighter uppercase">Pluto Health</span>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
              The world's first intelligence-led clinical triage engine designed for absolute privacy and medical precision.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
                <Shield className="size-4 text-primary" />
                HIPAA Aligned
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
                <Lock className="size-4 text-primary" />
                AES-256
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-6">
            <h4 className="font-bold text-sm tracking-widest uppercase opacity-40">Methodology</h4>
            <ul className="space-y-4">
              <li><Link href="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors font-medium">Rule Engine</Link></li>
              <li><Link href="/trust" className="text-muted-foreground hover:text-primary transition-colors font-medium">Security Stack</Link></li>
              <li><Link href="/demo" className="text-muted-foreground hover:text-primary transition-colors font-medium">Triage Demo</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="font-bold text-sm tracking-widest uppercase opacity-40">Contact</h4>
            <ul className="space-y-4">
              <li><a href="mailto:support@plutohealth.ai" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"><Mail className="size-4" /> Support</a></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-medium">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors font-medium">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="pt-12 border-t border-border/40 mb-12">
          <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-4xl">
            <strong>IMPORTANT MEDICAL DISCLAIMER:</strong> Pluto Health is an educational clinical decision support utility.
            It is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment.
            The results are deterministic correlations based on clinical guidelines and are for informational purposes only.
            In the event of a medical emergency, contact local emergency services immediately.
          </p>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
            © {new Date().getFullYear()} Pluto Health Intelligence. Build 1029-A
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
            Made with <Heart className="size-3 text-red-500/50" /> for healthcare accessibility
          </div>
        </div>
      </div>
    </footer>
  )
}
