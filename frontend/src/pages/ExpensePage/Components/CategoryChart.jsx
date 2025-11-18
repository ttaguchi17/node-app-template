import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function CategoryChart({ data }) {
  // Filter out categories with zero value
  const filteredData = data.filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#5B7FFF]" />
        <h3>By Category</h3>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No expenses yet
        </div>
      ) : (
        <div className="space-y-4">
          {/* Donut Chart */}
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend */}
          <div className="space-y-2">
            {filteredData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-foreground">{category.name}</span>
                </div>
                <span className="text-sm text-foreground">
                  ${category.value.toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Percentage breakdown */}
          <div className="border-t border-gray-200 pt-3 space-y-1.5">
            {filteredData.map((category, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all" 
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {category.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}