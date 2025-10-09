import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Phone, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const discos = [
  {
    name: "Ikeja Electric",
    area: "Lagos (Mainland)",
    states: ["Lagos"],
    phone: "0700 123 9999",
    website: "https://www.ikejaelectric.com",
    slug: "ikeja"
  },
  {
    name: "Eko Disco",
    area: "Lagos (Island)",
    states: ["Lagos"],
    phone: "0809 555 5658",
    website: "https://www.ekedp.com",
    slug: "eko"
  },
  {
    name: "AEDC",
    area: "Abuja",
    states: ["FCT", "Kogi", "Nasarawa", "Niger"],
    phone: "0700 2332 3232",
    website: "https://www.abujaelectricity.com",
    slug: "abuja"
  },
  {
    name: "BEDC",
    area: "Benin",
    states: ["Edo", "Delta", "Ekiti", "Ondo"],
    phone: "0700 2332 2232",
    website: "https://www.benindisco.com",
    slug: "benin"
  },
  {
    name: "IBEDC",
    area: "Ibadan",
    states: ["Oyo", "Ogun", "Osun", "Kwara"],
    phone: "0700 4233 2232",
    website: "https://www.ibedc.com",
    slug: "ibadan"
  },
  {
    name: "EEDC",
    area: "Enugu",
    states: ["Enugu", "Ebonyi", "Anambra", "Imo", "Abia"],
    phone: "0809 998 7777",
    website: "https://www.enugudisco.com",
    slug: "enugu"
  },
  {
    name: "PHED",
    area: "Port Harcourt",
    states: ["Rivers", "Akwa Ibom", "Cross River", "Bayelsa"],
    phone: "0700 7433 3344",
    website: "https://www.phed.com",
    slug: "portharcourt"
  },
  {
    name: "KEDCO",
    area: "Kano",
    states: ["Kano", "Jigawa", "Katsina"],
    phone: "0700 5332 2232",
    website: "https://www.kedco.ng",
    slug: "kano"
  },
  {
    name: "Kaduna Electric",
    area: "Kaduna",
    states: ["Kaduna", "Kebbi", "Sokoto", "Zamfara"],
    phone: "0700 5233 2232",
    website: "https://www.kadunaelectric.com",
    slug: "kaduna"
  },
  {
    name: "Jos Disco",
    area: "Jos",
    states: ["Plateau", "Bauchi", "Benue", "Gombe"],
    phone: "0700 5673 4726",
    website: "https://www.jed.com.ng",
    slug: "jos"
  },
  {
    name: "Yola Disco",
    area: "Yola",
    states: ["Adamawa", "Taraba", "Borno", "Yobe"],
    phone: "0809 888 8888",
    website: "https://www.yedcng.com",
    slug: "yola"
  },
  {
    name: "Aba Power",
    area: "Aba",
    states: ["Abia (Aba area)"],
    phone: "0809 000 0111",
    website: "https://www.abapower.com",
    slug: "aba"
  }
];

const Outages = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Nigeria Power Outage Updates
              </h1>
              <p className="text-lg text-muted-foreground">
                Find your Distribution Company (DisCo) and get real-time outage information, customer care contacts, and official reporting channels.
              </p>
            </div>
          </div>
        </section>

        {/* National Grid Alert */}
        <section className="container py-8">
          <Alert className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle>National Grid Updates</AlertTitle>
            <AlertDescription>
              For nationwide grid collapse information and TCN updates, visit{" "}
              <a 
                href="https://www.tcnng.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                TCN Nigeria
              </a>
            </AlertDescription>
          </Alert>
        </section>

        {/* DisCos Grid */}
        <section className="container py-12">
          <h2 className="mb-8 text-2xl font-bold">All Distribution Companies</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {discos.map((disco) => (
              <Card key={disco.slug} className="group hover:shadow-lg hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{disco.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription>{disco.area}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="font-medium mb-2">Coverage:</p>
                    <p className="text-muted-foreground">{disco.states.join(", ")}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-mono">{disco.phone}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1" size="sm" asChild>
                      <a href={disco.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Official Site
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How to Report */}
        <section className="border-t bg-muted/40">
          <div className="container py-12">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-2xl font-bold">How to Report a Power Outage</h2>
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold mb-2">1. Call Customer Care</h3>
                  <p className="text-sm text-muted-foreground">Use the official phone number for your DisCo listed above.</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold mb-2">2. Use Mobile Apps</h3>
                  <p className="text-sm text-muted-foreground">Many DisCos have mobile apps (e.g., AEDC's PORS App) for reporting and tracking.</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold mb-2">3. Visit Official Websites</h3>
                  <p className="text-sm text-muted-foreground">Check for online forms or customer portals on your DisCo's website.</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold mb-2">4. Know Your Feeder Name</h3>
                  <p className="text-sm text-muted-foreground">Providing your feeder name helps DisCos identify and resolve issues faster.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Outages;
