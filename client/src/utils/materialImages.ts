/**
 * Helper to ensure material-accurate, non-food fallback images
 */
export function getMaterialFallbackImage(name?: string, category?: string): string {
  const norm = `${name || ''} ${category || ''}`.toLowerCase();

  if (norm.includes('pallet') || norm.includes('timber') || norm.includes('wood') || norm.includes('lumber')) {
    return 'https://images.unsplash.com/photo-1742203900461-d822f8e7fd30?w=600&auto=format&fit=crop&q=60';
  }
  if (norm.includes('desk') || norm.includes('chair') || norm.includes('furnit') || norm.includes('table') || norm.includes('sofa')) {
    return 'https://images.unsplash.com/photo-1646705193406-8083b661ee9d?w=600&auto=format&fit=crop&q=60';
  }
  if (norm.includes('pipe') || norm.includes('iron') || norm.includes('rebar') || norm.includes('steel') || norm.includes('metal')) {
    return 'https://images.unsplash.com/photo-1763771420746-c75fefab51b5?w=600&auto=format&fit=crop&q=60';
  }
  if (norm.includes('barrel') || norm.includes('tank') || norm.includes('plastic') || norm.includes('polymer')) {
    return 'https://media.istockphoto.com/id/808824306/photo/blue-barrels-storage-drums.jpg?s=612x612&w=0&k=20&c=5JVi-CYiBdDz5fLc75QXIdIj3xqcDOi-XyyIBiv9br8=';
  }
  if (norm.includes('drill') || norm.includes('motor') || norm.includes('battery') || norm.includes('tool') || norm.includes('machine')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('brick') || norm.includes('block') || norm.includes('masonry') || norm.includes('stone') || norm.includes('sand')) {
    return 'https://images.unsplash.com/photo-1559322575-2f4e66131d55?w=600&auto=format&fit=crop&q=60';
  }
  if (norm.includes('laptop') || norm.includes('computer') || norm.includes('monitor') || norm.includes('electronic')) {
    return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80';
}
