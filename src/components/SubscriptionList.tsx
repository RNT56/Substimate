import React, { useState, useEffect } from 'react';
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Subscription } from '../types';
import { SortableSubscriptionCard } from './SortableSubscriptionCard';
import { CategoryFilter } from './CategoryFilter';
import { useDevice } from '../hooks/useDevice';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  subscriptions: Subscription[];
  onUpdate: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onReorder: (subscriptions: Subscription[]) => void;
}

export function SubscriptionList({ subscriptions, onUpdate, onDelete, onReorder }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localSubscriptions, setLocalSubscriptions] = useState(subscriptions);
  const { isMobile } = useDevice();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local state when props change
  useEffect(() => {
    setLocalSubscriptions(subscriptions);
  }, [subscriptions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localSubscriptions.findIndex((sub) => sub.id === active.id);
      const newIndex = localSubscriptions.findIndex((sub) => sub.id === over.id);
      const newSubscriptions = arrayMove(localSubscriptions, oldIndex, newIndex);
      
      // Update local state immediately
      setLocalSubscriptions(newSubscriptions);
      
      // Send update to server
      onReorder(newSubscriptions);
    }
  };

  const filteredSubscriptions = React.useMemo(() => {
    const subs = localSubscriptions;

    if (!subs?.length) return [];

    if (selectedCategory === 'All') {
      return subs;
    }
    
    if (selectedCategory === 'Favorites') {
      return subs.filter(sub => sub.isFavorite);
    }
    
    // Filter by category (both default and user-created categories)
    return subs.filter(sub => sub.category === selectedCategory);
  }, [localSubscriptions, selectedCategory]);

  const displayedSubscriptions = isCollapsed 
    ? filteredSubscriptions.slice(0, 3) 
    : filteredSubscriptions;

  if (subscriptions.length === 0) {
    return (
      <div className="neumorphic-card rounded-xl p-8 text-center">
        <p className="text-gray-400">No subscriptions added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        subscriptions={subscriptions}
        subscriptions={subscriptions}
      />
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayedSubscriptions.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={`grid gap-6 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {displayedSubscriptions.map(subscription => {
              return (
                <ErrorBoundary key={subscription.id}>
                  <SortableSubscriptionCard
                    subscription={subscription}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                </ErrorBoundary>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {filteredSubscriptions.length > 3 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="neumorphic-button px-6 py-3 rounded-xl text-gray-400 hover:text-gray-300 flex items-center gap-2"
          >
            {isCollapsed ? (
              <>
                View More <ChevronDown size={20} />
              </>
            ) : (
              <>
                Display Less <ChevronUp size={20} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}