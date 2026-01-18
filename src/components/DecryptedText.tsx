import { useEffect, useRef, useState } from 'react';

import type { HTMLMotionProps } from 'motion/react';

import { motion } from 'motion/react';

interface DecryptedTextProperties extends HTMLMotionProps<'span'> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: 'view' | 'hover' | 'both';
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  ...properties
}: DecryptedTextProperties) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const containerReference = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let currentIteration = 0;

    const getNextIndex = (revealedSet: Set<number>): number => {
      const textLength = text.length;
      switch (revealDirection) {
        case 'start': {
          return revealedSet.size;
        }
        case 'end': {
          return textLength - 1 - revealedSet.size;
        }
        case 'center': {
          const middle = Math.floor(textLength / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;

          if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
            return nextIndex;
          }
          for (let index = 0; index < textLength; index++) {
            if (!revealedSet.has(index)) return index;
          }
          return 0;
        }
        default: {
          return revealedSet.size;
        }
      }
    };

    const availableChars = useOriginalCharsOnly
      ? [...new Set(text.split(''))].filter((char) => char !== ' ')
      : characters.split('');

    const shuffleText = (originalText: string, currentRevealed: Set<number>): string => {
      if (useOriginalCharsOnly) {
        const positions = originalText.split('').map((char, index) => ({
          char,
          isSpace: char === ' ',
          index: index,
          isRevealed: currentRevealed.has(index)
        }));

        const nonSpaceChars = positions
          .filter((p) => !p.isSpace && !p.isRevealed)
          .map((p) => p.char);

        for (let index = nonSpaceChars.length - 1; index > 0; index--) {
          const index_ = Math.floor(Math.random() * (index + 1));
          [nonSpaceChars[index], nonSpaceChars[index_]] = [
            nonSpaceChars[index_],
            nonSpaceChars[index]
          ];
        }

        let charIndex = 0;
        return positions
          .map((p) => {
            if (p.isSpace) return ' ';
            if (p.isRevealed) return originalText[p.index];
            return nonSpaceChars[charIndex++];
          })
          .join('');
      } else {
        return originalText
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (currentRevealed.has(index)) return originalText[index];
            return availableChars[Math.floor(Math.random() * availableChars.length)];
          })
          .join('');
      }
    };

    if (isHovering) {
      setIsScrambling(true);
      interval = setInterval(() => {
        setRevealedIndices((previousRevealed) => {
          if (sequential) {
            if (previousRevealed.size < text.length) {
              const nextIndex = getNextIndex(previousRevealed);
              const newRevealed = new Set(previousRevealed);
              newRevealed.add(nextIndex);
              setDisplayText(shuffleText(text, newRevealed));
              return newRevealed;
            } else {
              clearInterval(interval);
              setIsScrambling(false);
              return previousRevealed;
            }
          } else {
            setDisplayText(shuffleText(text, previousRevealed));
            currentIteration++;
            if (currentIteration >= maxIterations) {
              clearInterval(interval);
              setIsScrambling(false);
              setDisplayText(text);
            }
            return previousRevealed;
          }
        });
      }, speed);
    } else {
      setDisplayText(text);
      setRevealedIndices(new Set());
      setIsScrambling(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isHovering,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    characters,
    useOriginalCharsOnly
  ]);

  useEffect(() => {
    if (animateOn !== 'view' && animateOn !== 'both') return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !hasAnimated) {
          setIsHovering(true);
          setHasAnimated(true);
        }
      }
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const currentReference = containerReference.current;
    if (currentReference) {
      observer.observe(currentReference);
    }

    return () => {
      if (currentReference) observer.unobserve(currentReference);
    };
  }, [animateOn, hasAnimated]);

  const hoverProperties =
    animateOn === 'hover' || animateOn === 'both'
      ? {
        onMouseEnter: () => setIsHovering(true),
        onMouseLeave: () => setIsHovering(false)
      }
      : {};

  return (
    <motion.span
      ref={containerReference}
      className={`inline-block whitespace-pre-wrap ${parentClassName}`}
      {...hoverProperties}
      {...properties}
    >
      <span className='sr-only'>{displayText}</span>

      <span aria-hidden='true'>
        {displayText.split('').map((char, index) => {
          const isRevealedOrDone = revealedIndices.has(index) || !isScrambling || !isHovering;

          return (
            <span key={index} className={isRevealedOrDone ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
