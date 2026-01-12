import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsChartProps {
    data: { name: string; value: number }[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
    return (
        <Card className="w-full h-[300px]">
            <CardHeader>
                <CardTitle>Study Distribution (Minutes)</CardTitle>
            </CardHeader>
            <CardContent className="h-[230px] w-full">
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No study data available yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
