import React from "react";
import { motion } from "framer-motion";
import { MapPin, IndianRupee, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function JobCard({ job }) {
  return (
    <motion.article
      className="job-card"
      initial={{
        opacity: 0,
        y: 30,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.45,
        ease: "easeOut",
      }}
      whileHover={{
        y: -8,
        scale: 1.015,
      }}
    >
      {/* COMPANY LOGO */}
      <motion.div
        className="company-logo"
        initial={{
          opacity: 0,
          scale: 0.5,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.4,
          delay: 0.15,
          type: "spring",
          stiffness: 200,
        }}
        whileHover={{
          scale: 1.12,
          rotate: 5,
        }}
      >
        {job.company?.charAt(0) || "C"}
      </motion.div>

      {/* JOB CONTENT */}
      <div className="job-body">
        {/* JOB TYPE */}
        <motion.span
          className="job-type"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {job.type || "Full Time"}
        </motion.span>

        {/* JOB TITLE */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {job.title}
        </motion.h3>

        {/* COMPANY */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {job.company || "Company"}
        </motion.p>

        {/* JOB INFORMATION */}
        <motion.div
          className="job-meta"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <motion.span whileHover={{ x: 3 }}>
            <MapPin size={15} />
            {job.location || "India"}
          </motion.span>

          <motion.span whileHover={{ x: 3 }}>
            <IndianRupee size={15} />
            {job.salary || "6 LPA"}
          </motion.span>

          <motion.span whileHover={{ x: 3 }}>
            <Clock size={15} />
            {job.deadline || "Open"}
          </motion.span>
        </motion.div>

        {/* VIEW DETAILS BUTTON */}
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.4,
          }}
          whileHover={{
            scale: 1.03,
          }}
          whileTap={{
            scale: 0.97,
          }}
        >
          <Link
            className="btn btn-primary"
            to={`/student/jobs/${job.id || "demo"}`}
          >
            View Details
            <motion.span
              whileHover={{ x: 4 }}
              style={{
                display: "inline-flex",
                marginLeft: "5px",
              }}
            >
              <ArrowRight size={16} />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </motion.article>
  );
}