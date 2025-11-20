import { useEffect, useRef } from 'react';
import { playBellSound } from '../utils/sound';

export const useNewItemsDetector = (currentItems, enabled = true) => {
  const previousItemsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      if (currentItems && currentItems.length > 0) {
        currentItems.forEach(item => {
          const key = `${item.orderId}-${item.item.id}`;
          previousItemsRef.current.add(key);
        });
      }
      return;
    }

    if (!enabled) {
      const currentKeys = new Set();
      if (currentItems && currentItems.length > 0) {
        currentItems.forEach(item => {
          const key = `${item.orderId}-${item.item.id}`;
          currentKeys.add(key);
        });
      }
      previousItemsRef.current = currentKeys;
      return;
    }

    if (currentItems && currentItems.length > 0) {
      const newItems = [];
      const currentKeys = new Set();

      currentItems.forEach(item => {
        const key = `${item.orderId}-${item.item.id}`;
        currentKeys.add(key);
        if (!previousItemsRef.current.has(key)) {
          newItems.push(item);
        }
      });

      if (newItems.length > 0) {
        playBellSound();
      }

      previousItemsRef.current = currentKeys;
    } else {
      previousItemsRef.current.clear();
    }
  }, [currentItems, enabled]);
};

