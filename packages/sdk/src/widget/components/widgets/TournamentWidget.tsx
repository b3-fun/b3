import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * Tournament Widget - Opens tournament join/fund modal
 */
export function TournamentWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();

  const handleClick = () => {
    alert("Tournament widget requires tournament configuration");
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-tournament">
        <p style={{ padding: "1rem", color: "#666" }}>
          Please sign in first
        </p>
      </div>
    );
  }

  return (
    <div className="b3-widget-tournament">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Join Tournament
      </Button>
    </div>
  );
}

