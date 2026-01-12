"use client";

import { useState, useEffect } from "react";
import { Network, Star, ArrowRight, BookOpen } from "lucide-react";

interface ConceptNode {
    id: string;
    name: string;
    weight: number;
    type: "core" | "support" | "detail";
}

interface ConceptEdge {
    source: string;
    target: string;
    relation: string;
}

interface Props {
    subjectId?: number;
    onSelectConcept?: (conceptName: string) => void;
}

export function ConceptRelationGraph({ subjectId = 1, onSelectConcept }: Props) {
    const [nodes, setNodes] = useState<ConceptNode[]>([]);
    const [edges, setEdges] = useState<ConceptEdge[]>([]);
    const [recommendation, setRecommendation] = useState("");
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRelations();
    }, [subjectId]);

    const fetchRelations = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/v1/analysis/concept-relations?subjectId=${subjectId}`
            );
            if (res.ok) {
                const data = await res.json();
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setRecommendation(data.recommendation || "");
            }
        } catch (error) {
            console.error("Failed to fetch concept relations:", error);
        } finally {
            setLoading(false);
        }
    };

    const getNodeColor = (type: string) => {
        switch (type) {
            case "core": return "bg-primary text-white";
            case "support": return "bg-yellow-500 text-white";
            default: return "bg-secondary text-foreground";
        }
    };

    const getNodeSize = (weight: number) => {
        if (weight >= 80) return "w-20 h-20 text-sm";
        if (weight >= 60) return "w-16 h-16 text-xs";
        return "w-12 h-12 text-xs";
    };

    const getConnectedNodes = (nodeId: string) => {
        const connected: string[] = [];
        edges.forEach(edge => {
            if (edge.source === nodeId) connected.push(edge.target);
            if (edge.target === nodeId) connected.push(edge.source);
        });
        return connected;
    };

    const getEdgeRelation = (from: string, to: string) => {
        const edge = edges.find(e =>
            (e.source === from && e.target === to) ||
            (e.source === to && e.target === from)
        );
        return edge?.relation || "";
    };

    if (loading) {
        return (
            <div className="h-80 flex items-center justify-center bg-secondary/30 rounded-xl">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Network className="w-5 h-5 text-primary" />
                        概念關聯圖
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        點擊概念查看關聯
                    </p>
                </div>
            </div>

            {/* Recommendation */}
            {recommendation && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-sm">{recommendation}</span>
                </div>
            )}

            {/* Graph View - Simplified visualization */}
            <div className="relative bg-secondary/20 rounded-xl p-6 min-h-[320px]">
                {/* Nodes */}
                <div className="flex flex-wrap justify-center gap-4">
                    {nodes.map((node) => {
                        const isSelected = selectedNode === node.id;
                        const isConnected = selectedNode ? getConnectedNodes(selectedNode).includes(node.id) : false;

                        return (
                            <div key={node.id} className="flex flex-col items-center gap-1">
                                <button
                                    onClick={() => {
                                        setSelectedNode(isSelected ? null : node.id);
                                    }}
                                    className={`rounded-full flex items-center justify-center font-medium transition-all ${getNodeSize(node.weight)} ${getNodeColor(node.type)} ${isSelected
                                            ? "ring-4 ring-primary/50 scale-110"
                                            : isConnected
                                                ? "ring-2 ring-yellow-500/50"
                                                : selectedNode
                                                    ? "opacity-40"
                                                    : "hover:scale-105"
                                        }`}
                                >
                                    {node.name}
                                </button>
                                <span className="text-xs text-muted-foreground">
                                    {node.type === "core" ? "核心" : node.type === "support" ? "支撐" : "細節"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Node Info */}
                {selectedNode && (
                    <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">
                                {nodes.find(n => n.id === selectedNode)?.name} 的關聯
                            </h4>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                關閉
                            </button>
                        </div>

                        <div className="space-y-2">
                            {getConnectedNodes(selectedNode).map(targetId => {
                                const targetNode = nodes.find(n => n.id === targetId);
                                const relation = getEdgeRelation(selectedNode, targetId);

                                return (
                                    <div
                                        key={targetId}
                                        className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                                    >
                                        <ArrowRight className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{targetNode?.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {relation}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => {
                                const nodeName = nodes.find(n => n.id === selectedNode)?.name;
                                if (nodeName) onSelectConcept?.(nodeName);
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            <BookOpen className="w-4 h-4" />
                            開始學習這個概念
                        </button>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                    <span>核心概念</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                    <span>支撐概念</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-secondary" />
                    <span>細節概念</span>
                </div>
            </div>
        </div>
    );
}
