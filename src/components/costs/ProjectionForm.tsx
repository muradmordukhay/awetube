"use client";

import { Input } from "@/components/ui/input";
import type { ProjectionInputs } from "@/lib/cost-calculator";

interface ProjectionFormProps {
  inputs: ProjectionInputs;
  onChange: (inputs: ProjectionInputs) => void;
}

interface FieldConfig {
  key: keyof ProjectionInputs;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

const fields: FieldConfig[] = [
  {
    key: "uploadsPerMonth",
    label: "Uploads / month",
    description: "Number of videos uploaded each month",
    min: 1,
    max: 10000,
    step: 1,
  },
  {
    key: "avgDurationMinutes",
    label: "Avg duration (min)",
    description: "Average length of each video in minutes",
    min: 1,
    max: 180,
    step: 1,
  },
  {
    key: "monthlyViewers",
    label: "Monthly viewers",
    description: "Unique viewers per month",
    min: 0,
    max: 10_000_000,
    step: 100,
  },
  {
    key: "avgViewsPerVideo",
    label: "Avg views / video",
    description: "Average number of views each video receives",
    min: 0,
    max: 1_000_000,
    step: 10,
  },
  {
    key: "monthsAhead",
    label: "Projection period (months)",
    description: "How many months to project forward",
    min: 1,
    max: 60,
    step: 1,
  },
];

export default function ProjectionForm({
  inputs,
  onChange,
}: ProjectionFormProps) {
  const handleChange = (key: keyof ProjectionInputs, value: string) => {
    const num = parseFloat(value) || 0;
    onChange({ ...inputs, [key]: num });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Scenario Inputs</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label
              htmlFor={field.key}
              className="text-sm font-medium"
            >
              {field.label}
            </label>
            <Input
              id={field.key}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={inputs[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {field.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
