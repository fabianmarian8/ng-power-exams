import { Link } from "react-router-dom";
import { Zap, GraduationCap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">NaijaInfo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/outages" className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary">
            <Zap className="h-4 w-4" />
            <span>Power Outages</span>
          </Link>
          <Link to="/results" className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary">
            <GraduationCap className="h-4 w-4" />
            <span>Exam Results</span>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col space-y-4 mt-8">
              <Link to="/outages" className="flex items-center space-x-2 text-lg font-medium">
                <Zap className="h-5 w-5" />
                <span>Power Outages</span>
              </Link>
              <Link to="/results" className="flex items-center space-x-2 text-lg font-medium">
                <GraduationCap className="h-5 w-5" />
                <span>Exam Results</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
