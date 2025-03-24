import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function ActionButtons({ onEdit, onDelete, className = '' }: Props) {
  return (
    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 ${className}`}>
      <button
        onClick={onEdit}
        className="p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 text-theme-secondary hover:text-theme-primary transition-colors"
        title="Edit"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg bg-gray-800/30 hover:bg-red-500/20 text-theme-secondary hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}