import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const flows = [
    {
      title: "Onramp Flow",
      description: "Test the onramp flow with custom parameters",
      path: "/onramp-example",
      color: "bg-white"
    }
    // More flows can be added here later
  ];

  return (
    <div className="mx-auto max-w-[800px] pt-12">
      <h1 className="mb-8 text-center text-3xl font-bold">AnySpend Examples</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {flows.map(flow => (
          <div key={flow.path} className="overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-lg">
            <div className="p-6">
              <h2 className="mb-2 text-xl font-semibold">{flow.title}</h2>
              <p className="mb-4 text-gray-600">{flow.description}</p>
              <button
                onClick={() => navigate(flow.path)}
                className={`w-full rounded-md ${flow.color} text-as-primary focus:ring-as-brand px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                Try {flow.title}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
