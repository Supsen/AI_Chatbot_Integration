import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(ChartDataLabels);

const PortfolioChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + Number(item.value), 0);

  const chartData = {
    labels: data.map((item) => item.type),
    datasets: [
      {
        data: data.map((item) =>
          ((item.value / total) * 100).toFixed(2)
        ),
        backgroundColor: ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#a78bfa"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      datalabels: {
        formatter: (value) => `${value}%`,
        color: "#000",
        font: {
          weight: "bold",
        },
      },
    },
  };

  return (
    <div style={{ maxWidth: "400px", margin: "1rem auto" }}>
      <Pie data={chartData} options={chartOptions} />
    </div>
  );
};

export default PortfolioChart;