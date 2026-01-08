import { cn } from '@/lib/utils';

export function Modal({ className, children, onClose, ...props }) {
  return (
    <div 
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={cn(
          'bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100',
          'flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ className, title, description, onClose, children, ...props }) {
  return (
    <div className={cn('px-6 pt-6 pb-4 flex justify-between items-start border-b border-gray-100', className)} {...props}>
      <div>
        {title && <h2 className="text-xl font-bold text-foreground">{title}</h2>}
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-foreground transition-colors p-1 hover:bg-gray-100 rounded-lg"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </div>
  );
}

export function ModalContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6 overflow-y-auto flex-1', className)} {...props}>
      {children}
    </div>
  );
}

export function ModalFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50', className)} {...props}>
      {children}
    </div>
  );
}
