"use client";

import React from 'react';

interface MasonryProps {
    children: React.ReactNode[];
    columns?: number;
    gap?: number;
}

export default function MasonryGrid({ children, columns = 2, gap = 16 }: MasonryProps) {
    const columnWrapper: Record<string, React.ReactNode[]> = {};
    const result: React.ReactNode[] = [];

    // Create columns
    for (let i = 0; i < columns; i++) {
        columnWrapper[`col${i}`] = [];
    }

    // Distribute children into columns
    for (let i = 0; i < children.length; i++) {
        const columnIndex = i % columns;
        columnWrapper[`col${columnIndex}`].push(
            <div key={i} style={{ marginBottom: gap }}>
                {children[i]}
            </div>
        );
    }

    for (let i = 0; i < columns; i++) {
        result.push(
            <div
                key={i}
                style={{
                    marginLeft: i > 0 ? gap : 0,
                    flex: 1,
                }}
            >
                {columnWrapper[`col${i}`]}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex' }}>
            {result}
        </div>
    );
}
