interface HowItWorksStep {
  number: number;
  description: string;
}

interface HowItWorksProps {
  steps: HowItWorksStep[];
  title?: string;
}

export default function HowItWorks({ steps, title }: HowItWorksProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-as-primary mb-6 text-center text-lg font-semibold">{title}</h3>}

      <div className="flex flex-col gap-6">
        {steps.map((step, index) => (
          <div key={step.number} className="group flex items-start gap-4">
            <div className="relative">
              <div className="bg-as-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-md transition-all duration-200 group-hover:shadow-lg">
                <span className="text-lg font-bold text-white">{step.number}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="bg-as-brand/20 absolute left-1/2 top-12 h-6 w-0.5 -translate-x-1/2" />
              )}
            </div>
            <div className="flex-1 pt-2">
              <p className="text-as-primary group-hover:text-as-primary/90 text-base leading-relaxed transition-colors duration-200">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
