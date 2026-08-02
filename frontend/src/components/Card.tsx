import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', glass = false, onClick, hover = true }) => (
  <motion.div
    onClick={onClick}
    whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className={`${glass ? 'glass' : 'card-solid'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </motion.div>
);

export default Card;
