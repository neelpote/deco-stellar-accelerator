import toast, { Toaster } from 'react-hot-toast';

export interface TransactionToastOptions {
  message: string;
  txHash?: string;
  explorerUrl?: string;
}

export class TransactionToast {
  /**
   * Show pending transaction toast
   * Returns toast ID for later updates
   */
  static pending(message: string): string {
    return toast.loading(
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyber-primary"></div>
        <span className="font-medium">{message}</span>
      </div>,
      {
        duration: Infinity,
        style: {
          background: '#1a1a2e',
          color: '#e0e0e0',
          border: '1px solid #16213e',
        },
      }
    );
  }

  /**
   * Update toast to success state
   */
  static success(toastId: string, options: TransactionToastOptions): void {
    const { message, txHash, explorerUrl } = options;
    
    toast.success(
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">✓</span>
          <span className="font-medium">{message}</span>
        </div>
        {txHash && (
          <a
            href={explorerUrl || `https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyber-primary hover:text-cyber-secondary underline flex items-center space-x-1"
          >
            <span>View on Explorer</span>
            <span>→</span>
          </a>
        )}
      </div>,
      {
        id: toastId,
        duration: 5000,
        style: {
          background: '#1a1a2e',
          color: '#e0e0e0',
          border: '1px solid #16213e',
        },
      }
    );
  }

  /**
   * Update toast to error state
   */
  static error(toastId: string, error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    
    toast.error(
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-red-400">✗</span>
          <span className="font-medium">Transaction Failed</span>
        </div>
        <p className="text-sm text-gray-400">{errorMessage}</p>
      </div>,
      {
        id: toastId,
        duration: 7000,
        style: {
          background: '#1a1a2e',
          color: '#e0e0e0',
          border: '1px solid #ff4444',
        },
      }
    );
  }

  /**
   * Show info toast
   */
  static info(message: string): void {
    toast(message, {
      icon: 'ℹ️',
      duration: 4000,
      style: {
        background: '#1a1a2e',
        color: '#e0e0e0',
        border: '1px solid #16213e',
      },
    });
  }

  /**
   * Show warning toast
   */
  static warning(message: string): void {
    toast(message, {
      icon: '⚠️',
      duration: 5000,
      style: {
        background: '#1a1a2e',
        color: '#e0e0e0',
        border: '1px solid #ffa500',
      },
    });
  }

  /**
   * Dismiss a specific toast
   */
  static dismiss(toastId: string): void {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  static dismissAll(): void {
    toast.dismiss();
  }
}

/**
 * Toast container component - add to App.tsx
 */
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'cyber-toast',
        style: {
          background: '#1a1a2e',
          color: '#e0e0e0',
          border: '1px solid #16213e',
          borderRadius: '8px',
          padding: '16px',
        },
      }}
    />
  );
};

/**
 * Example usage:
 * 
 * const handleStake = async () => {
 *   const toastId = TransactionToast.pending('Staking 1000 XLM...');
 *   
 *   try {
 *     const result = await stakeTransaction();
 *     TransactionToast.success(toastId, {
 *       message: 'Successfully staked!',
 *       txHash: result.hash,
 *     });
 *   } catch (error) {
 *     TransactionToast.error(toastId, error);
 *   }
 * };
 */
