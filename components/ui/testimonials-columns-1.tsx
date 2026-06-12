'use client';
import React from 'react';

export type TestimonialItem = {
  text: string;
  image: string;
  name: string;
  role: string;
};

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 10,
}: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={className} style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          paddingBottom: '14px',
          willChange: 'transform',
          animationName: 'testimonials-scroll',
          animationDuration: `${duration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }}
      >
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${copy}-${i}`}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px',
                  maxWidth: '300px',
                  width: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: '8px', right: '14px',
                  fontFamily: 'var(--font-serif)', fontSize: '48px', lineHeight: 1,
                  color: 'var(--accent)', opacity: 0.12, userSelect: 'none',
                  pointerEvents: 'none',
                }}>
                  &quot;
                </div>

                <p style={{
                  color: 'var(--text-2)',
                  fontSize: '13.5px',
                  lineHeight: 1.75,
                  fontStyle: 'italic',
                  position: 'relative',
                  zIndex: 1,
                  margin: 0,
                }}>
                  {text}
                </p>

                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={name}
                    width={32}
                    height={32}
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--border-default)',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      color: 'var(--text-1)',
                      fontSize: '13px',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {name}
                    </div>
                    <div style={{
                      color: 'var(--text-3)',
                      fontSize: '11.5px',
                      lineHeight: 1.4,
                    }}>
                      {role}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: 'auto',
                    color: 'var(--accent)',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    flexShrink: 0,
                  }}>
                    ★★★★★
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
