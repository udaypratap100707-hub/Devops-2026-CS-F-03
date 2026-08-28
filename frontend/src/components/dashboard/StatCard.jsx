import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, change }) {
  return (
    <motion.div
      className="stat-card"
      initial={{
        opacity: 0,
        y: 25,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      whileHover={{
        y: -7,
        scale: 1.03,
      }}
    >
      {/* ICON */}
      <motion.div
        className="stat-icon"
        initial={{
          opacity: 0,
          scale: 0.5,
          rotate: -10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.15,
          type: "spring",
          stiffness: 200,
        }}
        whileHover={{
          scale: 1.15,
          rotate: 5,
        }}
      >
        <Icon size={22} />
      </motion.div>

      {/* CONTENT */}
      <div>
        <motion.span
          initial={{
            opacity: 0,
            x: -10,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay: 0.2,
          }}
        >
          {label}
        </motion.span>

        {/* VALUE */}
        <motion.h2
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.25,
            duration: 0.4,
          }}
        >
          {value}
        </motion.h2>

        {/* CHANGE */}
        <motion.small
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.35,
          }}
        >
          {change}
        </motion.small>
      </div>
    </motion.div>
  );
}