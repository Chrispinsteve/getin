import { MapPin, Mail, Phone } from "lucide-react"

const footerLinks = {
  company: {
    title: "Company",
    links: ["About Us", "Careers", "Press", "Blog"],
  },
  hosting: {
    title: "Host Support",
    links: ["How to Host", "Host Resources", "Community Forum", "Responsible Hosting"],
  },
  trust: {
    title: "Trust & Safety",
    links: ["Guest Verification", "Secure Payments", "Cancellation Policy", "Insurance"],
  },
  discover: {
    title: "Discover",
    links: ["Browse Stays", "Experiences", "Popular Destinations", "GetIn Plus"],
  },
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">G</span>
              </div>
              <span className="text-xl font-bold text-background">GetIn</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed mb-6">
              The next-gen home-sharing platform. Host smarter, earn faster, travel better.
            </p>
            <div className="space-y-3 text-sm text-background/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Port-au-Prince, Haiti</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@getin.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+509 1234 5678</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-background mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="#" className="text-sm text-background/60 hover:text-background transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/50">© 2025 GetIn. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-background/50">
            <a href="#" className="hover:text-background transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-background transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-background transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
