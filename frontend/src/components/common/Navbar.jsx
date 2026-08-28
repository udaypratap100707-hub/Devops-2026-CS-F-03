import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, BriefcaseBusiness } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const nav = [
    ["/", "Home"],
    ["/about", "About"],
    ["/companies", "Companies"],
    ["/contact", "Contact"],
  ];

  return (
    <motion.header
      className="navbar"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      {/* LOGO */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          className="brand"
          to="/"
          onClick={() => setOpen(false)}
        >
          <motion.span
            className="brand-icon"
            whileHover={{
              rotate: 8,
              scale: 1.1,
            }}
            transition={{ duration: 0.2 }}
          >
            <BriefcaseBusiness size={21} />
          </motion.span>

          <span>
            Place<span>Mate</span>
          </span>
        </Link>
      </motion.div>

      {/* MOBILE MENU BUTTON */}
      <motion.button
        className="menu-btn"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Toggle menu"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* NAVIGATION */}
      <AnimatePresence>
        <motion.nav
          className={`nav-links ${open ? "show" : ""}`}
          initial={false}
          animate={{
            opacity: 1,
          }}
        >
          {nav.map(([path, label], index) => (
            <motion.div
              key={path}
              initial={{ opacity: 0, y: -15 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1 + index * 0.08,
                duration: 0.3,
              }}
              whileHover={{
                y: -2,
              }}
            >
              <NavLink
                to={path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {label}
              </NavLink>
            </motion.div>
          ))}

          {/* USER LOGGED IN */}
          {user ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <NavLink
                to={`/${user.role}`}
                className="nav-cta"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </NavLink>
            </motion.div>
          ) : (
            <>
              {/* LOGIN */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -2 }}
              >
                <NavLink
                  to="/login"
                  onClick={() => setOpen(false)}
                >
                  Login
                </NavLink>
              </motion.div>

              {/* GET STARTED */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <NavLink
                  to="/register"
                  className="nav-cta"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </NavLink>
              </motion.div>
            </>
          )}
        </motion.nav>
      </AnimatePresence>
    </motion.header>
  );
}