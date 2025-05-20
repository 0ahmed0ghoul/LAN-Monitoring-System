
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';

const UsageChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={200} style={{opacity:'0.4'}}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="timestamp" 
          tick={{ fontSize: 12 }} 
          tickFormatter={(value) => value.split(':')[0]} 
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '6px',
            border: '1px solid #eaeaea',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
          }} 
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="cpu" 
          stroke="#0EA5E9" 
          strokeWidth={2}
          dot={false}
          name="CPU (%)" 
        />
        <Line 
          type="monotone" 
          dataKey="ram" 
          stroke="#10B981" 
          strokeWidth={2}
          dot={false}
          name="RAM (MB)" 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default UsageChart;
