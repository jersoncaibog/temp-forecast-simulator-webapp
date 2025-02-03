'use client';

import { createClient } from '@/utils/supabase/client';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import regression from 'regression';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Temperature data structure from Supabase database
type TemperatureData = {
  year: string;
  annual_mean: number;
  five_year_smooth: number;
};

export default function SimulationInterface() {
  // State management for simulation data and UI
  const [data, setData] = useState<TemperatureData[]>([]);
  const [selectedModel, setSelectedModel] = useState<'polynomial' | 'moving-average'>('polynomial');
  const [yearToPredict, setYearToPredict] = useState<string>('2030');
  const [result, setResult] = useState<{
    prediction: number;
    details: string[];
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictionLine, setPredictionLine] = useState<{ years: string[], temps: number[] }>({ years: [], temps: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client for data fetching
  const supabase = createClient();

  // Fetch historical temperature data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Fetches historical temperature data from Supabase
   * Handles loading states and error scenarios
   */
  async function fetchData() {
    setIsLoading(true);
    setError(null);
    const { data: tempData, error: fetchError } = await supabase
      .from('philippines_temperature_trends')
      .select('*')
      .order('year', { ascending: true });

    if (fetchError) {
      console.error('Error fetching data:', fetchError);
      setError('Failed to load temperature data. Please try again later.');
      setIsLoading(false);
      return;
    }

    setData(tempData as TemperatureData[]);
    setIsLoading(false);
  }

  /**
   * Calculates temperature prediction using polynomial regression
   * @param targetYear - Year to predict temperature for
   * @returns Object containing prediction, equation, and R² value
   */
  function calculatePolynomialRegression(targetYear: string = yearToPredict) {
    if (data.length === 0) return { prediction: 0, equation: '', r2: 0 };

    // Normalize years to prevent numerical instability
    const baseYear = 1900;
    const points = data.map(d => [
      (Number(d.year) - baseYear),  // Normalize years
      d.five_year_smooth
    ] as [number, number]);

    // Calculate regression
    const result = regression.polynomial(points, { order: 2, precision: 8 });
    
    // For prediction, normalize the target year the same way
    const normalizedYear = parseInt(targetYear) - baseYear;
    const prediction = result.predict(normalizedYear)[1];

    // Get coefficients for a more readable equation
    const [a, b, c] = result.equation;
    const equation = `y = ${a.toExponential(6)}x² + ${b.toFixed(6)}x + ${c.toFixed(4)}`;

    // Calculate adjusted R² to account for polynomial complexity
    const n = points.length;
    const p = 2; // number of predictors (x and x²)
    const adjustedR2 = 1 - ((1 - result.r2) * (n - 1) / (n - p - 1));

    return {
      prediction,
      equation,
      r2: adjustedR2
    };
  }

  /**
   * Calculates temperature prediction using 5-year moving average
   * @param targetYear - Year to predict temperature for
   * @returns Object containing prediction and descriptive statistics
   */
  function calculateMovingAverage(targetYear: string = yearToPredict) {
    if (data.length === 0) return { prediction: 0, description: '' };

    // Get the last 5 years of data
    const recentData = data.slice(-5);
    const avgTemp = recentData.reduce((sum, d) => sum + d.five_year_smooth, 0) / recentData.length;
    
    // Calculate the average yearly rate of change over the last 5 years
    const yearlyChange = (recentData[recentData.length - 1].five_year_smooth - recentData[0].five_year_smooth) / 4; // 4 intervals in 5 years
    
    // Calculate years from last data point
    const lastYear = parseInt(data[data.length - 1].year);
    const yearsAhead = parseInt(targetYear) - lastYear;
    
    // Project temperature using the yearly rate of change
    const prediction = avgTemp + (yearlyChange * yearsAhead);
    
    const description = `Based on 5-year moving average:
Last 5 years average: ${avgTemp.toFixed(2)}°C
Rate of change: ${(yearlyChange > 0 ? '+' : '')}${(yearlyChange * 100).toFixed(4)}°C per year`;

    return { prediction, description };
  }

  /**
   * Generates points for prediction trend line visualization
   * @param prediction - Final predicted temperature
   * @param model - Selected prediction model type
   * @returns Object containing arrays of years and temperatures for plotting
   */
  function generatePredictionLine(prediction: number, model: 'polynomial' | 'moving-average') {
    const lastDataYear = parseInt(data[data.length - 1].year);
    const predictionYear = parseInt(yearToPredict);
    const years: string[] = [];
    const temps: number[] = [];

    // Start from the last data point
    years.push(lastDataYear.toString());
    temps.push(data[data.length - 1].five_year_smooth);

    // Generate prediction line points
    const numPoints = 5; // Use 5 points for a smoother line
    const yearStep = Math.ceil((predictionYear - lastDataYear) / numPoints);
    
    for (let year = lastDataYear + yearStep; year <= predictionYear; year += yearStep) {
      const currentYear = year.toString();
      years.push(currentYear);
      
      if (model === 'polynomial') {
        const { prediction } = calculatePolynomialRegression(currentYear);
        temps.push(prediction);
      } else {
        const { prediction } = calculateMovingAverage(currentYear);
        temps.push(prediction);
      }
    }

    // Ensure the final prediction point is included
    if (years[years.length - 1] !== predictionYear.toString()) {
      years.push(predictionYear.toString());
      temps.push(prediction);
    }

    return { years, temps };
  }

  /**
   * Handles the simulation process:
   * 1. Validates input year
   * 2. Calculates prediction using selected model
   * 3. Validates prediction against historical ranges
   * 4. Generates visualization data
   */
  function handleSimulation() {
    // Add year validation
    const inputYear = parseInt(yearToPredict);
    if (inputYear < 2024) {
      setResult({
        prediction: 0,
        details: ['Invalid year selected'],
        error: 'Please select a year from 2024 onwards for predictions.'
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let prediction: number;
      let details: string[] = [];

      if (selectedModel === 'polynomial') {
        const { prediction: polyPrediction, equation, r2 } = calculatePolynomialRegression();
        prediction = polyPrediction;
        details = [
          `Prediction Model: Polynomial Regression (2nd degree)`,
          `Target Year: ${yearToPredict}`,
          `Predicted Temperature: ${polyPrediction.toFixed(2)}°C`,
          `Mathematical Model: ${equation}`,
          `Model Accuracy (R²): ${r2.toFixed(4)}`,
          `Note: Using 5-year smoothed data for stability`
        ];
      } else {
        const { prediction: mavgPrediction, description } = calculateMovingAverage();
        prediction = mavgPrediction;
        details = [
          `Prediction Model: 5-Year Moving Average`,
          `Target Year: ${yearToPredict}`,
          `Predicted Temperature: ${mavgPrediction.toFixed(2)}°C`,
          description
        ];
      }
      
      // Validate prediction
      const maxTemp = Math.max(...data.map(d => d.annual_mean));
      const minTemp = Math.min(...data.map(d => d.annual_mean));
      const margin = 1.5;
      const allowedMin = minTemp - margin;
      const allowedMax = maxTemp + margin;

      if (prediction < allowedMin || prediction > allowedMax) {
        setResult({
          prediction,
          details,
          error: `Note: The predicted temperature (${prediction.toFixed(2)}°C) is outside our historical observations.

Historical Range: ${minTemp.toFixed(2)}°C to ${maxTemp.toFixed(2)}°C
Allowed Range: ${allowedMin.toFixed(2)}°C to ${allowedMax.toFixed(2)}°C (±1.5°C margin)

This doesn't necessarily mean the prediction is wrong, but it suggests a significant change from historical patterns.`
        });
        return;
      }

      // Generate prediction line data
      const predLine = generatePredictionLine(prediction, selectedModel);
      setPredictionLine(predLine);

      setResult({ prediction, details });
    } catch (error) {
      setResult({
        prediction: 0,
        details: ['Error in calculation. Please try again.'],
        error: 'Calculation error occurred'
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Calculates appropriate y-axis range for chart based on prediction
   * Ensures visualization remains clear and meaningful
   */
  function calculateYAxisRange(prediction: number | undefined) {
    const baseMin = 24;
    const baseMax = 28;
    
    if (!prediction) return { min: baseMin, max: baseMax };

    if (prediction > 29) {
      return { min: baseMin, max: 30 };
    } else if (prediction > 28) {
      return { min: baseMin, max: 29 };
    }
    
    return { min: baseMin, max: baseMax };
  }

  const yAxisRange = calculateYAxisRange(result?.prediction);

  // Chart data structure for visualization
  const chartData = {
    labels: [...data.filter((_, index) => index % 10 === 0).map(d => d.year), 
            ...predictionLine.years.slice(1)],
    datasets: [
      {
        label: 'Annual Mean Temperature',
        data: data.filter((_, index) => index % 10 === 0).map(d => d.annual_mean),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 4
      },
      {
        label: '5-Year Smooth',
        data: data.filter((_, index) => index % 10 === 0).map(d => d.five_year_smooth),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        pointRadius: 4
      },
      {
        label: 'Prediction Trend',
        data: data.length > 0 ? [
          ...Array(Math.max(0, data.filter((_, index) => index % 10 === 0).length - 1)).fill(null),
          data[data.length - 1].five_year_smooth,
          ...predictionLine.temps.slice(1)
        ] : [],
        borderColor: 'rgb(255, 206, 86)',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 4
      }
    ]
  };

  // Chart display options and styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Philippines Temperature Trends',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        min: yAxisRange.min,
        max: yAxisRange.max,
        title: {
          display: true,
          text: 'Temperature (°C)',
          font: {
            size: 14
          }
        },
        ticks: {
          stepSize: 0.5,
          font: {
            size: 14
          },
          callback: function(tickValue: number | string) {
            return typeof tickValue === 'number' ? `${tickValue}°C` : tickValue;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Year',
          font: {
            size: 14
          }
        },
        ticks: {
          font: {
            size: 14
          }
        }
      }
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Simulation Model</label>
            <select
              className="w-full p-2 border rounded-md bg-background"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as 'polynomial' | 'moving-average')}
            >
              <option value="polynomial">Polynomial Regression (2nd degree)</option>
              <option value="moving-average">5-Year Moving Average</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Year to Predict</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md bg-background"
              value={yearToPredict}
              onChange={(e) => setYearToPredict(e.target.value)}
              min="2024"
              max="2100"
            />
          </div>

          <button
            className="w-full bg-foreground text-background py-2 px-4 rounded-md hover:bg-foreground/90 transition disabled:opacity-50"
            onClick={handleSimulation}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Run Simulation'}
          </button>

          {result && (
            <div className="mt-4 space-y-4">
              {result.error && (
                <div className="p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
                  {result.error}
                </div>
              )}
              <div className="bg-muted rounded-md overflow-hidden">
                <div className="p-4 bg-muted/50 border-b">
                  <h3 className="text-lg font-medium">Simulation Results</h3>
                </div>
                <div className="p-4 space-y-2">
                  {result.details.map((detail, index) => (
                    <p key={index} className="text-sm">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-background p-4 rounded-lg border" style={{ height: '500px' }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-destructive">
              <p>{error}</p>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
} 