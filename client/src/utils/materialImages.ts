/**
 * Helper to ensure material-accurate, non-food fallback images
 */
export function getMaterialFallbackImage(name?: string, category?: string): string {
  const norm = `${name || ''} ${category || ''}`.toLowerCase();

  if (norm.includes('pallet') || norm.includes('timber') || norm.includes('wood') || norm.includes('lumber')) {
    return 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('desk') || norm.includes('chair') || norm.includes('furnit') || norm.includes('table') || norm.includes('sofa')) {
    return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('pipe') || norm.includes('iron') || norm.includes('rebar') || norm.includes('steel') || norm.includes('metal')) {
    return 'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('barrel') || norm.includes('tank') || norm.includes('plastic') || norm.includes('polymer')) {
    return 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('drill') || norm.includes('motor') || norm.includes('battery') || norm.includes('tool') || norm.includes('machine')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('brick') || norm.includes('block') || norm.includes('masonry') || norm.includes('stone') || norm.includes('sand')) {
    return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('laptop') || norm.includes('computer') || norm.includes('monitor') || norm.includes('electronic')) {
    return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80';
}
