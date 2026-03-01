/**
 * @file hooks
 * @module hooks
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDelayedLoad — Triggers a smooth entrance animation after mount.
 * @param {number} delay – Milliseconds to wait (default 100)
 * @returns {boolean} isLoaded
 */
export function useDelayedLoad(delay = 100) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return isLoaded;
}

/**
 * useScrollReveal — IntersectionObserver-based scroll reveal.
 * Returns a ref to attach to the element and a boolean for visibility.
 * Once visible, it stays visible (fires once).
 *
 * @param {object}  [options]
 * @param {number}  [options.threshold=0.15]  – Visibility threshold (0–1)
 * @param {string}  [options.rootMargin='0px 0px -60px 0px'] – Observer root margin
 * @returns {[React.RefObject, boolean]}
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: options.threshold ?? 0.15,
        rootMargin: options.rootMargin ?? '0px 0px -60px 0px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
}

/**
 * useStaggerReveal — Scroll reveal with stagger support for lists/grids.
 * Returns ref, isVisible, and a function to get per-item delay.
 *
 * @param {object}  [options]
 * @param {number}  [options.staggerMs=100] – Delay between each item
 * @param {number}  [options.threshold=0.1]
 * @returns {{ ref: React.RefObject, isVisible: boolean, getDelay: (index: number) => number }}
 */
export function useStaggerReveal(options = {}) {
  const staggerMs = options.staggerMs ?? 100;
  const [ref, isVisible] = useScrollReveal({
    threshold: options.threshold ?? 0.1,
    rootMargin: options.rootMargin,
  });

  const getDelay = useCallback((index) => index * staggerMs, [staggerMs]);

  return { ref, isVisible, getDelay };
}
