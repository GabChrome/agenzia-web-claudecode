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
        style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "20px" }}
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={i}
                style={{
                  background: "#0F0F0F",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  padding: "24px",
                  maxWidth: "300px",
                  width: "100%",
                  boxShadow: "0 4px 32px rgba(124,110,248,0.06)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Virgoletta decorativa */}
                <div style={{
                  position: "absolute", top: "12px", right: "16px",
                  fontFamily: "var(--font-serif)", fontSize: "56px", lineHeight: 1,
                  color: "var(--accent)", opacity: 0.12, userSelect: "none",
                  pointerEvents: "none",
                }}>
                  &quot;
                </div>

                <p style={{
                  color: "#888",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                  position: "relative",
                  zIndex: 1,
                }}>
                  {text}
                </p>

                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: "16px",
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={name}
                    width={36}
                    height={36}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.10)",
                      width: "36px",
                      height: "36px",
                    }}
                  />
                  <div>
                    <div style={{ color: "#EDEDED", fontSize: "13px", fontWeight: 600, lineHeight: 1.3 }}>
                      {name}
                    </div>
                    <div style={{ color: "#555", fontSize: "12px", lineHeight: 1.4 }}>
                      {role}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", color: "var(--accent)", fontSize: "11px", letterSpacing: "1px" }}>
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
