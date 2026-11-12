import React from 'react';
import { RestaurantModal } from './RestaurantModal';
import type { CreateRestaurantInput } from '@instant-qr/shared-types';

interface CreateRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRestaurant: (data: CreateRestaurantInput | FormData) => Promise<any>;
}

export const CreateRestaurantModal: React.FC<CreateRestaurantModalProps> = ({
  isOpen,
  onClose,
  onCreateRestaurant,
}) => {
  return (
    <RestaurantModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onCreateRestaurant}
    />
  );
};

export { RestaurantModal };
