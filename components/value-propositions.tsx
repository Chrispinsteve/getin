import { TrendingUp, Sparkles, Zap } from "lucide-react"

const features = [
  {
    icon: TrendingUp,
    title: "Smart Pricing",
    description:
      "Maximize earnings with intelligent dynamic pricing tailored to your market, seasonality, and demand patterns.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "Zero Stress Hosting",
    description: "We automate messaging, cleaning scheduling, and check-ins so you can focus on what matters.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Zap,
    title: "Fast, Secure Payouts",
    description: "Get paid instantly after each stay through MonCash or PayPal. No waiting, no hassle.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
]

export function ValuePropositions() {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Everything You Need to Host Successfully
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            GetIn provides the tools and support that make hosting effortless and profitable.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div
                className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
