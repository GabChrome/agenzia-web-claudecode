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
        /* gap ridotto a 14px: separati ma non distanti */
        style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "14px" }}
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={i}
                style={{
                  /* bg #050505 → leggermente più scuro del bg principale (#080808) */
                  background: "#050505",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "12px",
                  padding: "20px",
                  maxWidth: "300px",
                  width: "100%",
                  /* Nessuna ombra tra i blocchi, solo una shadow diffusa neutra */
                  boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Virgoletta decorativa */}
                <div style={{
                  position: "absolute", top: "8px", right: "14px",
                  fontFamily: "var(--font-serif)", fontSize: "48px", lineHeight: 1,
                  color: "var(--accent)", opacity: 0.14, userSelect: "none",
                  pointerEvents: "none",
                }}>
                  &quot;
                </div>

                {/* Testo citazione: colore chiaro per massima leggibilità */}
                <p style={{
                  color: "#C8C8C8",
                  fontSize: "13.5px",
                  lineHeight: 1.75,
                  fontStyle: "italic",
                  position: "relative",
                  zIndex: 1,
                  margin: 0,
                }}>
                  {text}
                </p>

                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
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
                    width={32}
                    height={32}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.12)",
                      width: "32px",
                      height: "32px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    {/* Nome: bianco pieno, ben visibile */}
                    <div style={{
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {name}
                    </div>
                    {/* Ruolo: grigio medio leggibile */}
                    <div style={{
                      color: "#666",
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
