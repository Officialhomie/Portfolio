'use client';

/**
 * Visitor List Component
 * Displays paginated list of visitors
 */

import { VisitorCard } from './visitor-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Visitor } from '@/lib/types/contracts';

interface VisitorListProps {
  visitors: Visitor[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function VisitorList({
  visitors,
  isLoading,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  hasNextPage,
  hasPrevPage,
}: VisitorListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (visitors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No visitors yet. Be the first to sign the visitor book!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visitor List */}
      <div className="space-y-4">
        {visitors.map((visitor, index) => (
          <VisitorCard
            key={`${visitor.visitor}-${visitor.timestamp}-${index}`}
            visitor={visitor}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
