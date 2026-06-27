import React from 'react';
import { useSubscriptions } from '../contexts/SubscriptionContext';

export function ConfirmDeleteModal() {
  const { 
    isConfirmDeleteOpen, 
    subscriptionToDelete, 
    closeConfirmDeleteModal,
    confirmDeleteSubscription 
  } = useSubscriptions();

  if (!isConfirmDeleteOpen || !subscriptionToDelete) {
    return null;
  }

  const handleConfirm = async (keepHistory: boolean) => {
    try {
      await confirmDeleteSubscription(keepHistory);
      // Optionally show success notification
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      // Optionally show error notification
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="themed-modal p-6 rounded-xl shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Confirm Deletion</h3>
        <p className="text-theme-secondary mb-6">
          Do you want to keep the price history for <strong className="text-theme-primary">"{subscriptionToDelete.name}"</strong> for future calculations?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={closeConfirmDeleteModal}
            className="themed-button themed-button-secondary px-4 py-2 rounded-lg text-sm"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() => handleConfirm(false)} // Don't keep history
            className="themed-button themed-button-danger px-4 py-2 rounded-lg text-sm text-red-500"
            type="button"
          >
            No (Delete All) 
          </button>
          <button
            onClick={() => handleConfirm(true)} // Keep history
            className="themed-button themed-button-primary px-4 py-2 rounded-lg text-sm text-orange-500"
            type="button"
          >
            Yes! (Keep History)
          </button>
        </div>
      </div>
    </div>
  );
}
