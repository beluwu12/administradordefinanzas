import React from 'react';

const SimplePieChart = ({ data, size = 120 }) => {
    // data structure: [{ label, value, color }]
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Calculate segments for conic-gradient
    let currentAngle = 0;
    const segments = data.map(item => {
        if (total === 0) return null;
        const percentage = item.value / total;
        const angle = percentage * 360;
        const start = currentAngle;
        const end = currentAngle + angle;
        currentAngle = end;
        return `${item.color} ${start}deg ${end}deg`;
    }).filter(Boolean);

    // Default grey if no data
    const background = segments.length > 0
        ? `conic-gradient(${segments.join(', ')})`
        : '#27272a';

    return (
        <div className="relative flex flex-col items-center">
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: background
                }}
                className="relative shadow-xl transition-all duration-500"
            >
                {/* Center hole for Donut effect */}
                <div className="absolute inset-0 m-auto bg-surface rounded-full" style={{ width: size * 0.6, height: size * 0.6 }}></div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-textSecondary">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimplePieChart;
