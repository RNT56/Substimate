import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Props {
  id: string;
  children: React.ReactNode;
}

export function DraggableDashboardCard({ id, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    height: '100%'
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <div className="themed-card rounded-xl h-full relative overflow-hidden">
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 right-2 p-2 rounded-lg hover:bg-gray-700/30 cursor-grab active:cursor-grabbing transition-colors z-10"
          title="Drag to reorder"
        >
          <GripVertical size={20} className="text-gray-500" />
        </div>
        <div className="h-full overflow-auto p-8 pt-12">
          {children}
        </div>
      </div>
    </div>
  );
}