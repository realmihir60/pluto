import { Card } from "@/components/ui/card"
import { Activity, TrendingUp, AlertCircle, ThumbsUp } from "lucide-react"

interface MetricsData {
    total_requests: number
    successful_triages: number
    failed_triages: number
    total_errors: number
    avg_response_time: number
    uptime_hours: number
    success_rate: number
    error_rate: number
}

interface MetricsWidgetProps {
    data: MetricsData | null
    recentErrors?: Array<{
        timestamp: string
        error_type: string
        message: string
    }>
}

export function MetricsWidget({ data, recentErrors = [] }: MetricsWidgetProps) {
    if (!data) {
        return (
            <Card className="p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-white/20">
                <p className="text-muted-foreground">Loading metrics...</p>
            </Card>
        )
    }

    const stats = [
        {
            label: "Total Triages",
            value: data.total_requests.toLocaleString(),
            icon: Activity,
            color: "text-blue-500"
        },
        {
            label: "Success Rate",
            value: `${(data.success_rate * 100).toFixed(1)}%`,
            icon: TrendingUp,
            color: "text-green-500"
        },
        {
            label: "Avg Response",
            value: `${data.avg_response_time.toFixed(0)}ms`,
            icon: ThumbsUp,
            color: "text-purple-500"
        },
        {
            label: "Error Rate",
            value: `${(data.error_rate * 100).toFixed(1)}%`,
            icon: AlertCircle,
            color: data.error_rate > 0.05 ? "text-red-500" : "text-gray-400"
        }
    ]

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Card
                            key={index}
                            className="p-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-white/20 hover:border-white/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <Icon className={`size-8 ${stat.color}`} />
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* System Info */}
            <Card className="p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-white/20">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-semibold">{data.uptime_hours.toFixed(1)}h</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Successful</p>
                        <p className="font-semibold text-green-600">{data.successful_triages}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-semibold text-red-600">{data.failed_triages}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Total Errors</p>
                        <p className="font-semibold">{data.total_errors}</p>
                    </div>
                </div>
            </Card>

            {/* Recent Errors */}
            {recentErrors.length > 0 && (
                <Card className="p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-white/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="size-5 text-red-500" />
                        Recent Errors
                    </h3>
                    <div className="space-y-3">
                        {recentErrors.slice(0, 5).map((error, index) => (
                            <div
                                key={index}
                                className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-red-900 dark:text-red-100">
                                            {error.error_type}
                                        </p>
                                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                            {error.message}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                        {new Date(error.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    )
}
