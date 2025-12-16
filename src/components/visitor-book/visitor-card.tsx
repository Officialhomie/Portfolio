'use client';

/**
 * Visitor Card Component
 * Displays a single visitor entry
 */

import { Card, CardContent } from '@/components/ui/card';
import { formatAddress, formatRelativeTime } from '@/lib/utils/format';
import type { Visitor } from '@/lib/types/contracts';

interface VisitorCardProps {
  visitor: Visitor;
}

export function VisitorCard({ visitor }: VisitorCardProps) {
  const date = new Date(Number(visitor.timestamp) * 1000);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-muted-foreground mb-2">
              {formatAddress(visitor.visitor)}
            </p>
            <p className="text-sm leading-relaxed break-words">
              {visitor.message}
            </p>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(date)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
