import { Check, Cpu, ShieldCheck, Settings, Percent, Users } from "lucide-react"

const differentiators = [
  {
    icon: Cpu,
    text: "AI-powered listing creation",
  },
  {
    icon: ShieldCheck,
    text: "Fraud-resistant identity verification",
  },
  {
    icon: Settings,
    text: "Higher host control than Airbnb",
  },
  {
    icon: Percent,
    text: "Lower platform fees",
  },
  {
    icon: Users,
    text: "Guest screening & trust score system",
  },
]

export function WhyDifferent() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">The GetIn Difference</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Built for Modern Hosts</h2>
              <p className="text-lg text-muted-foreground">
                We've reimagined home-sharing from the ground up, prioritizing host success with cutting-edge technology
                and fairer practices.
              </p>
            </div>

            <div className="space-y-4">
              {differentiators.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{item.text}</span>
                  <Check className="w-5 h-5 text-accent ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual - Dashboard Mockup */}
          <div className="relative">
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-muted/50 px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-primary/40" />
                    <div className="w-3 h-3 rounded-full bg-accent/40" />
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-md" />
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Earnings", value: "$12,450" },
                    { label: "Active Listings", value: "3" },
                    { label: "Avg. Rating", value: "4.9" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-lg font-bold text-card-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chart Placeholder */}
                <div className="h-32 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 rounded-xl flex items-end p-4 gap-2">
                  {[45, 72, 58, 85, 65, 92, 78, 88, 70, 95, 82, 90].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/30 rounded-t transition-all hover:bg-primary/50"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-card-foreground">Recent Activity</p>
                  {[
                    { text: "New booking confirmed", time: "2m ago" },
                    { text: "Payout processed: $340", time: "1h ago" },
                    { text: "5-star review received", time: "3h ago" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">{activity.text}</span>
                      <span className="text-xs text-muted-foreground/70">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating decoration */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
