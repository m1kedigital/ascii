"use client";

interface ConfirmationDialogProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmationDialog({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmationDialogProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] rounded-lg z-50 w-[90vw] max-w-sm"
        style={{
          padding: "24px",
        }}
      >
        <h2 className="text-base font-medium mb-2">{title}</h2>
        <p className="text-sm text-[#707070]" style={{ marginBottom: "24px" }}>{message}</p>

        {/* Buttons */}
        <div className="flex gap-2 flex-col-reverse">
          <button
            onClick={onCancel}
            className="w-full text-xs font-medium tracking-wider uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#707070]"
            style={{
              padding: "12px",
              minHeight: "44px",
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "transparent",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`w-full text-xs font-medium tracking-wider uppercase transition-colors ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-white text-black hover:bg-[#d0d0d0]"
            }`}
            style={{
              padding: "12px",
              minHeight: "44px",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
