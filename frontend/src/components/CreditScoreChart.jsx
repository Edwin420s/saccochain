import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CreditScoreChart = ({ userId }) => {
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditHistory();
  }, [userId]);

  const fetchCreditHistory = async () => {
    try {
      const response = await fetch(`/api/score/history/${userId}`);
      const data = await response.json();
      setCreditHistory(data);
    } catch (error) {
      console.error('Error fetching credit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = creditHistory.map(record => ({
    date: new Date(record.createdAt).toLocaleDateString(),
    score: record.score,
    riskLevel: record.riskLevel
  })).reverse();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{`Date: ${label}`}</p>
          <p className="text-blue-600 dark:text-blue-400">{`Score: ${payload[0].value}`}</p>
          <p className="text-gray-600 dark:text-gray-400">{`Risk: ${payload[0].payload.riskLevel}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (creditHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Credit Score History
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No credit score history available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Credit Score History
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 1000]}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#00B4D8" 
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={{ fill: '#00B4D8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#06D6A0' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {creditHistory[0]?.score || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
          <p className={`text-lg font-semibold ${
            chartData.length > 1 && chartData[chartData.length - 1].score > chartData[0].score
              ? 'text-green-600 dark:text-green-400'
              : chartData.length > 1 && chartData[chartData.length - 1].score < chartData[0].score
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {chartData.length > 1 
              ? chartData[chartData.length - 1].score > chartData[0].score ? '↑' : '↓'
              : '-'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditScoreChart;