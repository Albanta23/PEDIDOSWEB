import React from 'react';
import { XMarkIcon } from '../icons/HeroIcons';
import Button from './Button'; // Import Button for confirm/cancel

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' ; // Added more sizes
  footer?: React.ReactNode; // Optional footer for custom buttons
  showConfirmButtons?: boolean; // To show standard confirm/cancel
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'danger';
  isConfirmLoading?: boolean;
  isPrintingCurrently?: boolean; // New prop for print styling
  id?: string; // Optional ID for the modal wrapper
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  showConfirmButtons,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonVariant = 'primary',
  isConfirmLoading = false,
  isPrintingCurrently = false, // Default to false
  id,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    'full': 'max-w-full w-screen h-screen',
  };

  const wrapperClasses = `fixed inset-0 bg-neutral-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto ${isPrintingCurrently ? 'modal-currently-printing' : ''}`;

  return (
    <div 
        id={id}
        className={wrapperClasses}
        // Removed role/aria when printing as it might not be relevant for the print output itself
        role={!isPrintingCurrently ? "dialog" : undefined}
        aria-modal={!isPrintingCurrently ? "true" : undefined}
        aria-labelledby={!isPrintingCurrently ? "modal-title" : undefined}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all flex flex-col max-h-[90vh]`}
        // Removed role/aria here as well for printing
      >
        <div className={`flex items-center justify-between p-4 border-b border-neutral-200 sticky top-0 bg-white z-10 modal-header-print-hide`}>
          <h3 id="modal-title" className="text-xl font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        {(footer || showConfirmButtons) && (
          <div className={`p-4 border-t border-neutral-200 sticky bottom-0 bg-white z-10 modal-footer-print-hide`}>
            {footer ? footer : (
              showConfirmButtons && onConfirm && (
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={onClose} disabled={isConfirmLoading}>
                    {cancelText}
                  </Button>
                  <Button variant={confirmButtonVariant} onClick={onConfirm} isLoading={isConfirmLoading}>
                    {confirmText}
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;