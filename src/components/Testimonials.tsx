import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Quote } from 'lucide-react';
import { ScrollReveal } from './animations/ScrollReveal';

const TESTIMONIALS = [
  {
    name: 'Adewale O.',
    location: 'Lagos',
    text: 'Finally, one place to check power outages! No more calling PHCN multiple times.',
    initials: 'AO',
  },
  {
    name: 'Chioma N.',
    location: 'Abuja',
    text: 'Checked my JAMB result in seconds. Very reliable and easy to use.',
    initials: 'CN',
  },
  {
    name: 'Ibrahim M.',
    location: 'Kano',
    text: 'The planned outage alerts helped me prepare my generator. Thank you!',
    initials: 'IM',
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TESTIMONIALS.map((testimonial, idx) => (
        <ScrollReveal key={idx} delay={idx * 100}>
          <Card className="h-full">
            <CardContent className="p-6 space-y-4">
              <Quote className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm italic">&ldquo;{testimonial.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      ))}
    </div>
  );
}
