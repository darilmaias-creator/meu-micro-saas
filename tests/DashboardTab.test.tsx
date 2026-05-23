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

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "test-user",
      },
    },
  }),
}));

describe("DashboardTab", () => {
  const currentMonthDate = new Date().toISOString().split("T")[0];
  const mockAppData = {
    insumos: [],
    savedProducts: [],
    quotes: [],
    sales: [
      {
        id: 1,
        productName: "Produto A",
        date: currentMonthDate,
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
    render(<DashboardTab appData={mockAppData} isPremium={false} />);

    expect(screen.getAllByText("R$ 100.00").length).toBeGreaterThan(0); // Faturamento
    expect(screen.getAllByText("R$ 50.00").length).toBeGreaterThan(0); // Custos/Lucro
    expect(screen.getAllByText("R$ 10.00").length).toBeGreaterThan(0); // Dízimo
    expect(screen.getAllByText("50.0%").length).toBeGreaterThan(0); // Margem
  });

  it("deve renderizar os gráficos", () => {
    render(<DashboardTab appData={mockAppData} isPremium={false} />);

    expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("pie-chart").length).toBeGreaterThan(0);
  });

  it("deve calcular margem corretamente", () => {
    // Margem = profit / revenue * 100 = 50 / 100 * 100 = 50%
    render(<DashboardTab appData={mockAppData} isPremium={false} />);
    expect(screen.getAllByText("50.0%").length).toBeGreaterThan(0);
  });
});
