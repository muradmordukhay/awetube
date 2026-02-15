import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title: string;
  description?: string;
}

export default function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <AlertCircle className="mb-3 h-10 w-10" />
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}
