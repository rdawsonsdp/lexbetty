'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CateringProduct } from '@/lib/types';
import SortableProductRow from './SortableProductRow';

interface AdminProduct extends CateringProduct {
  is_active: boolean;
  sort_position: number;
}

interface SortableProductListProps {
  products: AdminProduct[];
  onReorder: (products: AdminProduct[]) => void;
  onEdit: (product: AdminProduct) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export default function SortableProductList({ products, onReorder, onEdit, onToggleFeatured, onToggleActive }: SortableProductListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex(p => p.id === active.id);
      const newIndex = products.findIndex(p => p.id === over.id);

      const newProducts = [...products];
      const [moved] = newProducts.splice(oldIndex, 1);
      newProducts.splice(newIndex, 0, moved);

      // Reassign sort_position
      const reordered = newProducts.map((p, i) => ({ ...p, sort_position: i }));
      onReorder(reordered);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {products.map(product => (
            <SortableProductRow
              key={product.id}
              product={product}
              onEdit={onEdit}
              onToggleFeatured={onToggleFeatured}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
