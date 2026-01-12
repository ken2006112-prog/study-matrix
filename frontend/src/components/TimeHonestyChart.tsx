"use client";

interface TimeHonestyChartProps {
    planned: number;
    actual: number;
    label?: string;
}

export function TimeHonestyChart({ planned, actual, label = "本週" }: TimeHonestyChartProps) {
    const percentage = Math.round((actual / planned) * 100);
    const isOverperforming = actual > planned;
    const barWidth = Math.min(percentage, 100);

    const getColor = () => {
        if (percentage >= 90) return { bg: "bg-green-500", text: "text-green-600" };
        if (percentage >= 70) return { bg: "bg-yellow-500", text: "text-yellow-600" };
        return { bg: "bg-red-500", text: "text-red-600" };
    };

    const colors = getColor();

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${colors.text}`}>
                    {percentage}%
                    {isOverperforming && " 🎉"}
                </span>
            </div>

            <div className="relative">
                {/* Background bar (planned) */}
                <div className="h-8 bg-secondary rounded-xl relative overflow-hidden">
                    {/* Actual bar */}
                    <div
                        className={`h-full ${colors.bg} rounded-xl transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${barWidth}%` }}
                    >
                        {barWidth > 30 && (
                            <span className="text-xs text-white font-medium">
                                {actual}h
                            </span>
                        )}
                    </div>

                    {/* Planned marker */}
                    <div className="absolute top-0 right-0 h-full w-px bg-foreground/20" />
                </div>

                {/* Labels */}
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>實際: {actual}h</span>
                    <span>計畫: {planned}h</span>
                </div>
            </div>

            {/* Message */}
            <p className="text-xs text-muted-foreground">
                {percentage >= 100 && "🎯 超額完成！考慮增加一點挑戰。"}
                {percentage >= 90 && percentage < 100 && "✅ 非常接近目標，做得很好！"}
                {percentage >= 70 && percentage < 90 && "💪 還不錯，繼續保持！"}
                {percentage >= 50 && percentage < 70 && "⚠️ 稍微落後，調整一下計畫吧。"}
                {percentage < 50 && "📉 距離目標較遠，建議設定更實際的目標。"}
            </p>
        </div>
    );
}

interface WeeklyTimeHonestyProps {
    data: { day: string; planned: number; actual: number }[];
}

export function WeeklyTimeHonesty({ data }: WeeklyTimeHonestyProps) {
    const maxHours = Math.max(...data.map(d => Math.max(d.planned, d.actual)));

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-40">
                {data.map((day, i) => {
                    const plannedHeight = (day.planned / maxHours) * 100;
                    const actualHeight = (day.actual / maxHours) * 100;
                    const isComplete = day.actual >= day.planned;

                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="relative w-full h-32 flex items-end justify-center gap-0.5">
                                {/* Planned bar */}
                                <div
                                    className="w-3 bg-secondary rounded-t transition-all"
                                    style={{ height: `${plannedHeight}%` }}
                                />
                                {/* Actual bar */}
                                <div
                                    className={`w-3 rounded-t transition-all ${isComplete ? "bg-green-500" : "bg-yellow-500"
                                        }`}
                                    style={{ height: `${actualHeight}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">{day.day}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-secondary rounded" />
                    <span className="text-muted-foreground">計畫</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-muted-foreground">實際（達標）</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span className="text-muted-foreground">實際（未達標）</span>
                </div>
            </div>
        </div>
    );
}
