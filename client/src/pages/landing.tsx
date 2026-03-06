import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Camera, Bell, MapPin, Brain, Clock, LogIn, UserPlus, Lock } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Real-Time CCTV Monitoring",
    description: "Monitor traffic cameras across Yaounde, Douala, Bamenda & Buea with live video feeds.",
  },
  {
    icon: Brain,
    title: "AI-Powered Detection",
    description: "YOLOv8-based accident detection with DeepSORT tracking for accurate incident identification.",
  },
  {
    icon: Bell,
    title: "Instant Emergency Alerts",
    description: "Automatic SMS, Email, and Voice alerts to emergency responders within seconds.",
  },
  {
    icon: MapPin,
    title: "GPS Location Tracking",
    description: "Precise accident location mapping for faster emergency response coordination.",
  },
  {
    icon: Clock,
    title: "Rapid Response Time",
    description: "Reduce emergency response time with automated detection and alert dispatch.",
  },
  {
    icon: ShieldCheck,
    title: "24/7 Road Safety",
    description: "Continuous monitoring and protection for safer roads in Cameroon.",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">SAFEROUTE CM</span>
              <span className="text-xs text-muted-foreground">Road Safety System</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLocation("/signup")} data-testid="button-signup">
              <UserPlus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Up</span>
            </Button>
            <a href="/api/login">
              <Button data-testid="button-login">
                <LogIn className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </a>
            <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-admin-login-nav">
              <Lock className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-destructive/5" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
                </span>
                AI-Powered Road Safety for Cameroon
              </div>
              <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Protecting Lives Through
                <span className="text-primary"> Intelligent Detection</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
                SAFEROUTE CM uses advanced AI to detect road accidents in real-time 
                from CCTV cameras across Yaounde, Douala, Bamenda & Buea, automatically 
                alerting emergency responders to save lives faster.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a href="/api/login">
                  <Button size="lg" className="gap-2" data-testid="button-get-started">
                    <ShieldCheck className="h-5 w-5" />
                    Get Started
                  </Button>
                </a>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2" 
                  data-testid="button-learn-more"
                  onClick={() => {
                    const el = document.getElementById("features");
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.scrollY - 80;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                  }}
                >
                  Learn More
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span>Free Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-success" />
                  <span>Real-Time Alerts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Complete Road Safety Platform
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                A comprehensive solution for monitoring, detecting, and responding 
                to road accidents across Cameroon's urban infrastructure.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group transition-all hover-elevate"
                  data-testid={`card-feature-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Ready to Enhance Road Safety?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join SAFEROUTE CM and help protect lives on Cameroon's roads.
            </p>
            <a href="/api/login">
              <Button size="lg" data-testid="button-cta-login">
                <LogIn className="mr-2 h-5 w-5" />
                Sign In to Get Started
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>SAFEROUTE CM - Road Safety System</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Intelligent Road Safety for Cameroon
          </p>
        </div>
      </footer>
    </div>
  );
}
