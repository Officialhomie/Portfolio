'use client';

/**
 * Visitor Card Component
 * Displays a single visitor entry with their message
 */

import { Card, CardContent } from '@/components/ui/card';
import { formatAddress, formatRelativeTime } from '@/lib/utils/format';
import type { Visitor } from '@/lib/types/contracts';
import { MessageSquare, User } from 'lucide-react';

interface VisitorCardProps {
  visitor: Visitor;
}

export function VisitorCard({ visitor }: VisitorCardProps) {
  const date = new Date(Number(visitor.timestamp) * 1000);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Header: Address and Timestamp */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm font-mono text-muted-foreground truncate">
                {formatAddress(visitor.visitor)}
              </p>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatRelativeTime(date)}
            </div>
          </div>

          {/* Message Content */}
          <div className="pl-6 border-l-2 border-primary/20">
            <div className="flex items-start gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary/60 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-muted-foreground">Message:</p>
            </div>
            <p className="text-base leading-relaxed break-words text-foreground pl-6">
              "{visitor.message}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
