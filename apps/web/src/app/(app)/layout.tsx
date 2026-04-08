import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TooltipProvider delayDuration={200}>{children}</TooltipProvider>;
}
