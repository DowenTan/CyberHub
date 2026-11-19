import { useState, useRef, useCallback, useMemo } from 'react';

/**
 * VirtualList component for high-performance rendering of datasets > 200 items (C15).
 * Only renders DOM nodes visible within the viewport (+ overscan buffer).
 */
export default function VirtualList({
  items = [],
  itemHeight = 48,
  containerHeight = 400,
  overscan = 5,
  renderItem,
  className = '',
  emptyMessage = 'No records to display.',
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight = items.length * itemHeight;

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleItems, startIndex, offsetY } = useMemo(() => {
    if (items.length === 0) {
      return { visibleItems: [], startIndex: 0, offsetY: 0 };
    }

    const calculatedStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const calculatedEnd = Math.min(items.length, calculatedStart + visibleCount);

    const slice = items.slice(calculatedStart, calculatedEnd);
    return {
      visibleItems: slice,
      startIndex: calculatedStart,
      offsetY: calculatedStart * itemHeight,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  if (items.length === 0) {
    return (
      <div
        className={`ch-virtual-list-empty ${className}`}
        style={{ height: containerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={`ch-virtual-list-container ${className}`}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid #374151',
        borderRadius: '8px',
        backgroundColor: '#111827',
      }}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, idx) => (
            <div
              key={item.id || startIndex + idx}
              style={{
                height: itemHeight,
                boxSizing: 'border-box',
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
              }}
            >
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
