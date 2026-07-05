import { useRef } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Media } from '../../types';
import { IconImage, IconLink, IconPlay } from '../../ui';

export function MediaGrid({
  media,
  onReorder,
  onEdit,
}: {
  media: Media[];
  onReorder: (activeId: string, overId: string) => void;
  onEdit: (media: Media) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  // Evita che il click di fine trascinamento apra il dialog di modifica.
  const draggingRef = useRef(false);

  function handleDragEnd(event: DragEndEvent) {
    setTimeout(() => {
      draggingRef.current = false;
    }, 120);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => {
        draggingRef.current = true;
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        draggingRef.current = false;
      }}
    >
      <SortableContext items={media.map((m) => m.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {media.map((m) => (
            <MediaCard
              key={m.id}
              media={m}
              onClick={() => {
                if (!draggingRef.current) onEdit(m);
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function MediaCard({ media, onClick }: { media: Media; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: media.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative aspect-square cursor-grab overflow-hidden rounded-theme-sm border border-line bg-surface2 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isDragging ? 'z-10 opacity-60 shadow-2xl' : ''
      }`}
    >
      <CardVisual media={media} />

      {media.kind !== 'image' && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
          {media.kind === 'video' ? 'Video' : <IconLink size={12} />}
          {media.kind === 'embed' && 'Link'}
        </span>
      )}

      {media.published !== 1 && (
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
          Bozza
        </span>
      )}

      {!media.uploaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-3 text-center text-xs font-semibold text-white">
          Caricamento non completato: apri e rimuovi l’elemento
        </div>
      )}

      {media.caption_it && media.uploaded && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
          <p className="line-clamp-2 text-xs text-white">{media.caption_it}</p>
        </div>
      )}
    </div>
  );
}

function CardVisual({ media }: { media: Media }) {
  const src = media.thumb ?? (media.kind === 'image' ? media.url : null);
  const playOverlay = media.kind !== 'image' && (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
        <IconPlay size={22} />
      </span>
    </span>
  );

  if (src) {
    return (
      <>
        <img
          src={src}
          alt={media.caption_it}
          loading="lazy"
          draggable={false}
          className="h-full w-full select-none object-cover"
        />
        {playOverlay}
      </>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center text-soft">
      {media.kind === 'image' ? <IconImage size={32} /> : playOverlay}
    </div>
  );
}
