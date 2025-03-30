import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star } from 'lucide-react';
import { SubscriptionCard } from './SubscriptionCard';
import type { Subscription } from '../types';
import { useSubscriptions } from '../contexts/SubscriptionContext';

interface Props {
  subscription: Subscription;
  onUpdate: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
}

export function SortableSubscriptionCard({ subscription, onUpdate, onDelete }: Props) {
  const { toggleFavorite } = useSubscriptions();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: subscription.id,
    disabled: false
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const
  };

  const handleFavoriteToggle = async () => {
    try {
      // Use the optimistic update function for favorites
      await toggleFavorite(subscription.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="absolute bottom-3 left-3 flex gap-2 z-10">
        <button
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          className="p-2 rounded-lg hover:bg-gray-700/30 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical size={20} className="text-gray-500" />
        </button>
        <button
          onClick={handleFavoriteToggle}
          className={`p-2 rounded-lg hover:bg-gray-700/30 transition-colors ${
            subscription.isFavorite ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-400'
          }`}
          title={subscription.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={20} />
        </button>
      </div>
      <SubscriptionCard
        subscription={subscription}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}