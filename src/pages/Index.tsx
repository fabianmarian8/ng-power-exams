import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InfoCard from "@/components/InfoCard";
import { Zap, GraduationCap, MapPin, Phone, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Nigeria Power & Exam Results Hub
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Get real-time updates on power outages across all DisCos and check your JAMB, WAEC, and NECO exam results with official links.
              </p>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="container py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Official Sources Only</AlertTitle>
            <AlertDescription>
              All exam results and power outage information link directly to official government and DisCo portals. We do not store or process personal data.
            </AlertDescription>
          </Alert>
        </section>

        {/* Main Services */}
        <section className="container py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <InfoCard
              icon={Zap}
              title="Power Outage Updates"
              description="Track power outages and planned maintenance across all 12 DisCos in Nigeria"
              href="/outages"
              items={[
                "Lagos: Ikeja Electric & Eko Disco",
                "Abuja: AEDC with PORS App",
                "Port Harcourt, Enugu, Ibadan, Kano & more",
                "National Grid status from TCN"
              ]}
            />
            <InfoCard
              icon={GraduationCap}
              title="Exam Results Checker"
              description="Step-by-step guides to check your exam results on official portals"
              href="/results"
              items={[
                "JAMB UTME & Direct Entry results",
                "WAEC SSCE with e-PIN guide",
                "NECO results and verification",
                "Troubleshooting common errors"
              ]}
            />
          </div>
        </section>

        {/* Featured DisCos */}
        <section className="border-t bg-muted/40">
          <div className="container py-12">
            <h2 className="mb-8 text-2xl font-bold">Quick Access by Location</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 space-y-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Lagos</h3>
                <p className="text-sm text-muted-foreground">Ikeja Electric, Eko Disco</p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Abuja</h3>
                <p className="text-sm text-muted-foreground">AEDC (PORS App)</p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Port Harcourt</h3>
                <p className="text-sm text-muted-foreground">PHED</p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Enugu</h3>
                <p className="text-sm text-muted-foreground">EEDC</p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Ibadan</h3>
                <p className="text-sm text-muted-foreground">IBEDC</p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Kano</h3>
                <p className="text-sm text-muted-foreground">KEDCO</p>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Contacts */}
        <section className="container py-12">
          <div className="rounded-lg border bg-card p-8">
            <div className="flex items-start space-x-4">
              <Phone className="h-6 w-6 text-primary mt-1" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Need Emergency Help?</h2>
                <p className="text-muted-foreground">
                  For urgent power issues, contact your local DisCo customer care. For exam result issues, reach out to the official examination body helplines.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
