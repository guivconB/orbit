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
        isDragging && "opacity-50 ring-2 ring-indigo-500 rounded-xl"
      )}
    >
      {/* Drag handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-20 p-1 opacity-0 group-hover/widget:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-widget rounded-full shadow-md border border-border"
      >
        <GripHorizontal size={14} className="text-slate-400" />
      </div>
      
      {children}
    </div>
  );
}
