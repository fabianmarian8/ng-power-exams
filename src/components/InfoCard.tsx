import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface InfoCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  items?: string[];
}

const InfoCard = ({ title, description, icon: Icon, href, items }: InfoCardProps) => {
  return (
    <Card className="group transition-all hover:shadow-lg hover:border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {items.map((item, index) => (
              <li key={index} className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to={href}>
          <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default InfoCard;
