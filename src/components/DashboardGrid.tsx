import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { DraggableDashboardCard } from './DraggableDashboardCard';
import { useDashboardLayout } from '../hooks/useDashboardLayout';

interface Props {
  children: React.ReactNode[];
}

export function DashboardGrid({ children }: Props) {
  const { layout, loading, saveLayout } = useDashboardLayout();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.indexOf(active.id.toString());
      const newIndex = layout.indexOf(over.id.toString());
      const newLayout = arrayMove(layout, oldIndex, newIndex);
      saveLayout(newLayout);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  // Map the ordered items to their corresponding children
  const orderedChildren = layout.map(id => {
    const index = parseInt(id.split('-')[2]);
    return children[index];
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={layout} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-8">
          {/* First row - can be either timeline or any dragged card */}
          <div className="w-full min-h-[500px]">
            <DraggableDashboardCard id={layout[0]}>
              {orderedChildren[0]}
            </DraggableDashboardCard>
          </div>
          
          {/* Second row - two columns for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="min-h-[500px]">
              <DraggableDashboardCard id={layout[1]}>
                {orderedChildren[1]}
              </DraggableDashboardCard>
            </div>
            <div className="min-h-[500px]">
              <DraggableDashboardCard id={layout[2]}>
                {orderedChildren[2]}
              </DraggableDashboardCard>
            </div>
          </div>
          
          {/* Third row - category analysis */}
          <div className="min-h-[300px]">
            <DraggableDashboardCard id={layout[3]}>
              {orderedChildren[3]}
            </DraggableDashboardCard>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
