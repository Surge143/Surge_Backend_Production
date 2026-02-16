import React from 'react';

interface RichTextProps {
    content: any;
    className?: string;
}

export default function RichText({ content, className }: RichTextProps) {
    if (!content || !content.root || !content.root.children) return null;

    const renderNode = (node: any, index: number) => {
        if (!node) return null;

        if (node.type === 'text') {
            let text = node.text || '';
            if (node.format === 1) text = <strong key={index}>{text}</strong>;
            if (node.format === 2) text = <em key={index}>{text}</em>;
            return text;
        }

        const children = node.children
            ? node.children.map((child: any, i: number) => renderNode(child, i))
            : null;

        if (node.type === 'paragraph') {
            return (
                <p key={index} style={{ marginBottom: '1em' }}>
                    {children}
                </p>
            );
        }

        if (node.type === 'heading') {
            const Tag = (node.tag || 'h2') as keyof React.JSX.IntrinsicElements;
            return (
                <Tag key={index} style={{ marginBottom: '0.5em', marginTop: '1em' }}>
                    {children}
                </Tag>
            );
        }

        if (node.type === 'list') {
            const Tag = node.listType === 'number' ? 'ol' : 'ul';
            return (
                <Tag key={index} style={{ marginBottom: '1em', paddingLeft: '1.5em' }}>
                    {children}
                </Tag>
            );
        }

        if (node.type === 'listitem') {
            return (
                <li key={index}>
                    {children}
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
