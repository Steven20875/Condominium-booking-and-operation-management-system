import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
  className?: string;
}

interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

interface ModalBodyProps {
  children?: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center' | 'between';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  className = '',
}: ModalProps) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`bg-white rounded-3xl border border-slate-200 shadow-2xl w-full ${sizeStyles[size]} overflow-hidden backdrop-blur-sm ${className}`}
          >
            {(title || subtitle) && (
              <ModalHeader title={title} subtitle={subtitle} onClose={onClose} />
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ModalHeader = ({ title, subtitle, onClose }: ModalHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4 p-6 sm:p-8 pb-4 border-b border-slate-200">
      <div>
        {subtitle && (
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {subtitle}
          </span>
        )}
        {title && (
          <h2 className="font-serif font-black text-slate-950 text-lg leading-none">
            {title}
          </h2>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export const ModalBody = ({ children, className = '' }: ModalBodyProps) => {
  return (
    <div className={`p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
};

export const ModalFooter = ({ children, align = 'between' }: ModalFooterProps) => {
  const alignClass = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
  }[align];

  return (
    <div className={`p-6 bg-slate-50 border-t border-slate-200 flex items-center gap-3 ${alignClass}`}>
      {children}
    </div>
  );
};

/**
 * Simple confirmation dialog
 */
export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalBody className="text-center pt-8">
        <h3 className="font-serif font-bold text-slate-950 text-lg mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          {message}
        </p>
      </ModalBody>
      <ModalFooter align="center">
        <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={isDangerous ? 'danger' : 'primary'}
          size="md"
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Processing..."
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
