import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function MainLayout() {
  return (
    <>
      <Navbar />

      <motion.main
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <Outlet />
      </motion.main>

      <Footer />
    </>
  );
}