import React from 'react';

interface Concept {
    id: string;
    label: string;
    strength: number; // 0-1
    type: "core" | "support" | "detail";
    x: number;
    y: number;
}

interface Connection {
    source: string;
    target: string;
    strength: number;
}

import { useAuth } from "@/contexts/AuthContext";

interface Props {
    onNodeClick?: (nodeId: string, nodeLabel: string) => void;
}

export function ConceptGraph({ onNodeClick }: Props) {
    const { user } = useAuth();
    const [nodes, setNodes] = React.useState<Concept[]>([]);
    const [connections, setConnections] = React.useState<Connection[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!user) return;
        const fetchGraph = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/v1/concepts/graph?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    // Basic Layout Algorithm: Circle
                    const width = 800; // SVG viewBox width assumption
                    const height = 400;
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const radius = 120;

                    const calculatedNodes = data.nodes.map((node: any, i: number) => {
                        const angle = (i / data.nodes.length) * 2 * Math.PI;
                        return {
                            ...node,
                            x: centerX + radius * Math.cos(angle),
                            y: centerY + radius * Math.sin(angle),
                        };
                    });

                    setNodes(calculatedNodes);
                    setConnections(data.edges);
                }
            } catch (error) {
                console.error("Failed to fetch graph", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGraph();
    }, []);

    if (loading) return <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">載入知識圖譜...</div>;

    return (
        <div className="w-full h-[400px] border border-border/30 rounded-2xl bg-secondary/20 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    知識結構圖 (Schema)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                    視覺化您的知識連結
                </p>
            </div>

            <svg className="w-full h-full" viewBox="0 0 800 400">
                <defs>
                    <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--morandi-sage)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--morandi-blue)" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Connections */}
                {connections.map((conn, i) => {
                    const src = nodes.find(c => c.id === conn.source);
                    const tgt = nodes.find(c => c.id === conn.target);
                    if (!src || !tgt) return null;

                    return (
                        <line
                            key={i}
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke="url(#link-gradient)"
                            strokeWidth={conn.strength * 4}
                            strokeLinecap="round"
                            className="animate-pulse-slow"
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <g
                        key={node.id}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick?.(node.id, node.label);
                        }}
                    >
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.type === "core" ? 30 : node.type === "support" ? 20 : 15}
                            fill={
                                node.type === "core" ? "var(--morandi-sage)" :
                                    node.type === "support" ? "var(--morandi-blue)" :
                                        "var(--morandi-rose)"
                            }
                            className="shadow-md"
                        />
                        <text
                            x={node.x}
                            y={node.y + (node.type === "core" ? 45 : 35)}
                            textAnchor="middle"
                            className="text-xs font-medium fill-current text-foreground"
                            style={{ fontSize: node.type === "core" ? 14 : 12 }}
                        >
                            {node.label}
                        </text>
                        {/* Inner strength indicator */}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={(node.type === "core" ? 30 : node.type === "support" ? 20 : 15) * node.strength}
                            fill="white"
                            fillOpacity="0.2"
                        />
                    </g>
                ))}
            </svg>

            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-md">
                連結強度代表知識轉移能力
            </div>
        </div>
    );
}
