import { Lock, Shield } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="py-10 bg-secondary/50 border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        {/* Trust indicators */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="size-4" aria-hidden="true" />
            <span className="text-sm">Privacy-first. No data stored.</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-border" aria-hidden="true" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="size-4" aria-hidden="true" />
            <span className="text-sm">HIPAA-aligned practices</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Pluto does not provide medical diagnoses and does not replace professional medical
            advice. Always consult with a qualified healthcare provider for medical concerns.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pluto Health Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
