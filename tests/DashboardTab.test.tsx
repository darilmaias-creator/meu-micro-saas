import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardTab from "../app/DashboardTab";

// Mock do recharts para evitar erros no teste
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
}));

// Mock do html2pdf.js
vi.mock("html2pdf.js", () => ({
  default: vi.fn(() => ({
    set: vi.fn(() => ({ from: vi.fn(() => ({ save: vi.fn() })) })),
  })),
}));

describe("DashboardTab", () => {
  const mockAppData = {
    sales: [
      {
        id: 1,
        productName: "Produto A",
        date: "2024-05-01",
        quantity: 2,
        totalSale: 100,
        totalCost: 50,
        totalProfit: 50,
        totalTithe: 10,
      },
    ],
    setSales: vi.fn(),
  };

  it("deve renderizar os totais corretamente", () => {
    render(<DashboardTab appData={mockAppData} />);

    expect(screen.getByText("R$ 100.00")).toBeInTheDocument(); // Faturamento
    expect(screen.getByText("R$ 50.00")).toBeInTheDocument(); // Custos
    expect(screen.getByText("R$ 10.00")).toBeInTheDocument(); // Dízimo
    expect(screen.getByText("R$ 50.00")).toBeInTheDocument(); // Lucro
    expect(screen.getByText("50.0%")).toBeInTheDocument(); // Margem
  });

  it("deve renderizar os gráficos", () => {
    render(<DashboardTab appData={mockAppData} />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("deve calcular margem corretamente", () => {
    // Margem = profit / revenue * 100 = 50 / 100 * 100 = 50%
    render(<DashboardTab appData={mockAppData} />);
    expect(screen.getByText("50.0%")).toBeInTheDocument();
  });
});