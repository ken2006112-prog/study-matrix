import React from 'react';
import TagCloud from 'react-tag-cloud';
import randomColor from 'randomcolor';

interface TagCloudProps {
    tags: { text: string; value: number }[];
}

export default function MyTagCloud({ tags }: TagCloudProps) {
    if (!tags || tags.length === 0) {
        return <div className="text-muted-foreground">No tags found. Add some content to generate a cloud.</div>;
    }

    return (
        <div className="flex w-full h-[300px] items-center justify-center border rounded-lg bg-card p-4">
            <TagCloud
                style={{
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    color: () => randomColor({ luminosity: 'light' }),
                    padding: 5,
                    width: '100%',
                    height: '100%',
                }}
            >
                {tags.map((tag) => (
                    <div key={tag.text} style={{ fontSize: Math.max(12, Math.min(60, tag.value)) }} className="cursor-pointer hover:opacity-80 transition-opacity">
                        {tag.text}
                    </div>
                ))}
            </TagCloud>
        </div>
    );
}
