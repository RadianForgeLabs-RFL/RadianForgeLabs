import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

interface BackButtonProps {
  to?: string;
  label?: string;
}

export function BackButton({ to = -1, label = "Back" }: BackButtonProps) {
  return (
    <Button asChild variant="ghost" size="sm" className="mb-4">
      <Link to={to as any}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
