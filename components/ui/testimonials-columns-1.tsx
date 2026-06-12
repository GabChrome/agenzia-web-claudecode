"use client";
import React from "react";
import { motion } from "framer-motion";

export type TestimonialItem = {
  text: string;
  image: string;
  name: string;
  role: string;
};

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className} style={{ overflow: "hidden" }}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "16px" }}
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={i}
                style={{
                  /* Usa surface-2 (#161616) come sfondo card:
                     più chiaro del bg (#080808) e di surface-1 (#0F0F0F),
                     quindi si stacca visivamente senza sembrare "nero puro" */
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "14px",
                  padding: "22px",
                  maxWidth: "300px",
                  width: "100%",
                  /* Glow accent sottile sul bordo inferiore */
                  boxShadow: "0 2px 0 rgba(124,110,248,0.18), 0 8px 32px rgba(0,0,0,0.4)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Virgoletta decorativa accent */}
                <div style={{
                  position: "absolute", top: "10px", right: "14px",
                  fontFamily: "var(--font-serif)", fontSize: "52px", lineHeight: 1,
                  color: "var(--accent)", opacity: 0.14, userSelect: "none",
                  pointerEvents: "none",
                }}>
                  &quot;
                </div>

                <p style={{
                  color: "var(--text-2)",
                  fontSize: "13.5px",
                  lineHeight: 1.72,
                  fontStyle: "italic",
                  position: "relative",
                  zIndex: 1,
                }}>
                  {text}
                </p>

                <div style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "14px",
                  marginTop: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={name}
                    width={34}
                    height={34}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid var(--border-default)",
                      width: "34px",
                      height: "34px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      color: "var(--text-1)",
                      fontSize: "13px",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {name}
                    </div>
                    <div style={{
                      color: "var(--text-3)",
                      fontSize: "11.5px",
                      lineHeight: 1.4,
                    }}>
                      {role}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: "auto",
                    color: "var(--accent)",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    flexShrink: 0,
                  }}>
                    ★★★★★
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))]}
      </motion.div>
    </div>
  );
};
