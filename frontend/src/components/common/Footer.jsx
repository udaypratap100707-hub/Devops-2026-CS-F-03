import React from "react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
    >
      {/* BRAND */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        <motion.h3
          whileHover={{
            scale: 1.05,
          }}
          transition={{ duration: 0.2 }}
        >
          PlaceMate
        </motion.h3>

        <p>
          A modern platform connecting students, colleges and companies.
        </p>
      </motion.div>

      {/* PLATFORM */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <motion.h4
          whileHover={{
            x: 5,
          }}
          transition={{ duration: 0.2 }}
        >
          Platform
        </motion.h4>

        <motion.p
          whileHover={{
            x: 5,
          }}
          transition={{ duration: 0.2 }}
        >
          Jobs · Applications · Placements · Analytics
        </motion.p>
      </motion.div>

      {/* COPYRIGHT */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <motion.h4
          whileHover={{
            scale: 1.03,
          }}
        >
          © 2026 PlaceMate
        </motion.h4>

        <p>
          Student Placement Management System
        </p>
      </motion.div>
    </motion.footer>
  );
}