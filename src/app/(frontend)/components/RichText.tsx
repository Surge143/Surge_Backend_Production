import React from 'react';

interface RichTextProps {
    content: any;
    className?: string;
}

export default function RichText({ content, className }: RichTextProps) {
    if (!content || !content.root || !content.root.children) return null;

    const renderNode = (node: any, index: number) => {
        if (node.type === 'text') {
            let text = node.text;
            if (node.format === 1) text = <strong key={index}>{text}</strong>;
            if (node.format === 2) text = <em key={index}>{text}</em>;
            return text;
        }

        if (node.type === 'paragraph') {
            return (
                <p key={index} style={{ marginBottom: '1em' }}>
                    {node.children.map((child: any, i: number) => renderNode(child, i))}
                </p>
            );
        }

        if (node.type === 'heading') {
            const Tag = node.tag as keyof React.JSX.IntrinsicElements;
            return (
                <Tag key={index} style={{ marginBottom: '0.5em', marginTop: '1em' }}>
                    {node.children.map((child: any, i: number) => renderNode(child, i))}
                </Tag>
            );
        }

        if (node.type === 'list') {
            const Tag = node.listType === 'number' ? 'ol' : 'ul';
            return (
                <Tag key={index} style={{ marginBottom: '1em', paddingLeft: '1.5em' }}>
                    {node.children.map((child: any, i: number) => renderNode(child, i))}
                </Tag>
            );
        }

        if (node.type === 'listitem') {
            return (
                <li key={index}>
                    {node.children.map((child: any, i: number) => renderNode(child, i))}
                </li>
            );
        }

        return null;
    };

    return (
        <div className={className}>
            {content.root.children.map((node: any, index: number) => renderNode(node, index))}
        </div>
    );
}
