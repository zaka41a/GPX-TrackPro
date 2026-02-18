import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "./KpiCard";
import React from "react";

describe("KpiCard", () => {
  it("renders title and value", () => {
    render(<KpiCard title="Distance" value="42.5 km" icon={<span data-testid="icon">I</span>} />);
    expect(screen.getByText("Distance")).toBeInTheDocument();
    expect(screen.getByText("42.5 km")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders 'No data yet' when value is null", () => {
    render(<KpiCard title="HR" value={null} />);
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });

  it("renders trend when provided", () => {
    render(<KpiCard title="Speed" value="30" trend="+5%" />);
    expect(screen.getByText("+5%")).toBeInTheDocument();
  });
});
