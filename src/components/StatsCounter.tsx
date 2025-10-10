import { Users, Zap, TrendingUp } from 'lucide-react';
import { CountUpAnimation } from './animations/CountUpAnimation';
import { Card, CardContent } from './ui/card';

const STATS = [
  {
    icon: Users,
    value: 50000,
    suffix: '+',
    label: 'Trusted by Nigerians',
    color: 'text-trust-blue',
  },
  {
    icon: Zap,
    value: 1234,
    label: 'Outages monitored today',
    color: 'text-warning-orange',
  },
  {
    icon: TrendingUp,
    value: 98,
    suffix: '%',
    label: 'Data accuracy',
    color: 'text-nigeria-green',
  },
];

export function StatsCounter() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STATS.map((stat, idx) => (
        <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
            <div>
              <div className="text-3xl font-bold">
                <CountUpAnimation end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
