import React, { useEffect, useRef, useState } from 'react';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

export interface SplitTextProperties {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProperties> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onLetterAnimationComplete
}) => {
  const reference = useRef<HTMLParagraphElement>(null);
  const animationCompletedReference = useRef(false);
  const onCompleteReference = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteReference.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!reference.current || !text || !fontsLoaded) return;
      // Prevent re-animation if already completed
      if (animationCompletedReference.current) return;
      const element = reference.current as HTMLElement & {
        _rbsplitInstance?: GSAPSplitText;
      };

      if (element._rbsplitInstance) {
        try {
          element._rbsplitInstance.revert();
        } catch {}
        element._rbsplitInstance = undefined;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? Number.parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;
      let targets: Element[] = [];
      const assignTargets = (self: GSAPSplitText) => {
        if (splitType.includes('chars') && self.chars?.length) targets = self.chars;
        if (targets.length === 0 && splitType.includes('words') && self.words.length > 0)
          targets = self.words;
        if (targets.length === 0 && splitType.includes('lines') && self.lines.length > 0)
          targets = self.lines;
        if (targets.length === 0) targets = self.chars || self.words || self.lines;
      };
      const splitInstance = new GSAPSplitText(element, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self: GSAPSplitText) => {
          assignTargets(self);
          return gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: element,
                start,
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4
              },
              onComplete: () => {
                animationCompletedReference.current = true;
                onCompleteReference.current?.();
              },
              willChange: 'transform, opacity',
              force3D: true
            }
          );
        }
      });
      element._rbsplitInstance = splitInstance;
      return () => {
        for (const st of ScrollTrigger.getAll()) {
          if (st.trigger === element) st.kill();
        }
        try {
          splitInstance.revert();
        } catch {}
        element._rbsplitInstance = undefined;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded
      ],
      scope: reference
    }
  );

  const renderTag = () => {
    const style: React.CSSProperties = {
      textAlign,
      wordWrap: 'break-word',
      willChange: 'transform, opacity'
    };
    const classes = `split-parent overflow-hidden inline-block whitespace-normal ${className}`;
    switch (tag) {
      case 'h1': {
        return (
          <h1 ref={reference} style={style} className={classes}>
            {text}
          </h1>
        );
      }
      case 'h2': {
        return (
          <h2 ref={reference} style={style} className={classes}>
            {text}
          </h2>
        );
      }
      case 'h3': {
        return (
          <h3 ref={reference} style={style} className={classes}>
            {text}
          </h3>
        );
      }
      case 'h4': {
        return (
          <h4 ref={reference} style={style} className={classes}>
            {text}
          </h4>
        );
      }
      case 'h5': {
        return (
          <h5 ref={reference} style={style} className={classes}>
            {text}
          </h5>
        );
      }
      case 'h6': {
        return (
          <h6 ref={reference} style={style} className={classes}>
            {text}
          </h6>
        );
      }
      default: {
        return (
          <p ref={reference} style={style} className={classes}>
            {text}
          </p>
        );
      }
    }
  };

  return renderTag();
};

export default SplitText;
