import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import clsx from 'clsx';

interface SortableWidgetProps {
  id: string;
  gridClasses: string;
  children: React.ReactNode;
}

export function SortableWidget({ id, gridClasses, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "relative group/widget transition-all h-full max-h-full flex flex-col",
        gridClasses,
        isDragging && "opacity-60 ring-2 ring-accent rounded-2xl scale-[1.01] shadow-2xl"
      )}
    >
      {/* Drag handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 opacity-0 group-hover/widget:opacity-100 transition-all cursor-grab active:cursor-grabbing bg-widget/90 backdrop-blur-md rounded-full shadow-lg border border-border flex items-center justify-center hover:border-accent/40"
        title="Arrastar widget"
        aria-label="Arrastar widget"
      >
        <GripHorizontal size={14} className="text-slate-400 hover:text-slate-200 transition-colors" />
      </div>
      
      {children}
    </div>
  );
}
