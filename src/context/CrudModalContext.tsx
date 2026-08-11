"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  PlusCircle,
  Edit3,
  Trash2,
  FileText,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export type ModalType = "success" | "error" | "warning" | "info";
export type ActionType = "CREATE" | "READ" | "UPDATE" | "DELETE" | "DOCUMENT" | "CONFIRM";

export interface CrudModalConfig {
  title: string;
  message: string;
  type?: ModalType;
  actionType?: ActionType;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface CrudModalContextType {
  showModal: (config: CrudModalConfig) => void;
  showSuccess: (title: string, message: string, actionType?: ActionType, details?: string) => void;
  showError: (title: string, message: string, details?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    actionType?: ActionType,
    confirmText?: string
  ) => void;
  closeModal: () => void;
}

const CrudModalContext = createContext<CrudModalContextType | undefined>(undefined);

export function CrudModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<CrudModalConfig>({
    title: "",
    message: "",
    type: "info",
    actionType: "READ",
  });

  const showModal = (newConfig: CrudModalConfig) => {
    setConfig({
      type: "info",
      actionType: "READ",
      confirmText: "Tutup",
      cancelText: "Batal",
      ...newConfig,
    });
    setIsOpen(true);
  };

  const showSuccess = (
    title: string,
    message: string,
    actionType: ActionType = "CREATE",
    details?: string
  ) => {
    showModal({
      title,
      message,
      type: "success",
      actionType,
      details,
      confirmText: "Siap, Mengerti",
    });
  };

  const showError = (title: string, message: string, details?: string) => {
    showModal({
      title,
      message,
      type: "error",
      actionType: "READ",
      details,
      confirmText: "Tutup",
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    actionType: ActionType = "DELETE",
    confirmText: string = "Ya, Lanjutkan"
  ) => {
    showModal({
      title,
      message,
      type: "warning",
      actionType,
      confirmText,
      cancelText: "Batal",
      onConfirm,
    });
  };

  const closeModal = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const handleConfirmAction = async () => {
    if (config.onConfirm) {
      try {
        setLoading(true);
        await config.onConfirm();
      } catch (err: any) {
        console.error("Modal action error:", err);
      } finally {
        setLoading(false);
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const getActionBadge = () => {
    switch (config.actionType) {
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            TAMBAH DATA
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            UBAH DATA
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            HAPUS DATA
          </span>
        );
      case "DOCUMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            DOKUMEN
          </span>
        );
      case "CONFIRM":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            KONFIRMASI
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Info className="w-3.5 h-3.5 text-slate-600" />
            INFORMASI DATA
          </span>
        );
    }
  };

  const getTypeIcon = () => {
    switch (config.type) {
      case "success":
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        );
      case "error":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-100/80 flex items-center justify-center text-rose-600 shadow-inner">
            <XCircle className="w-7 h-7" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-600 shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-600 shadow-inner">
            <Info className="w-7 h-7" />
          </div>
        );
    }
  };

  return (
    <CrudModalContext.Provider
      value={{ showModal, showSuccess, showError, showConfirm, closeModal }}
    >
      {children}

      {isOpen && (
        <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
          <ModalBackdrop className="bg-slate-900/40 backdrop-blur-sm fixed inset-0 z-[100]" />
          <ModalContainer className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <ModalDialog className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200 scale-100">
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon()}
                    <div>
                      {getActionBadge()}
                      <ModalHeading className="text-lg font-bold text-slate-900 mt-1">
                        {config.title}
                      </ModalHeading>
                    </div>
                  </div>
                </div>

                <ModalBody className="py-2 text-sm text-slate-600 leading-relaxed">
                  <p className="font-medium text-slate-700">{config.message}</p>
                  {config.details && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200/70 rounded-xl font-mono text-xs text-slate-600 break-words">
                      {config.details}
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="flex items-center justify-end gap-2 pt-6">
                  {config.onConfirm && (
                    <Button
                      type="button"
                      isDisabled={loading}
                      onClick={() => {
                        if (config.onCancel) config.onCancel();
                        closeModal();
                      }}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {config.cancelText || "Batal"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    isDisabled={loading}
                    onClick={handleConfirmAction}
                    className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                      config.type === "error"
                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                        : config.type === "warning"
                        ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                        : config.actionType === "DELETE"
                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                    } disabled:opacity-50`}
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {config.confirmText || "Tutup"}
                  </Button>
                </ModalFooter>
              </div>
            </ModalDialog>
          </ModalContainer>
        </Modal>
      )}
    </CrudModalContext.Provider>
  );
}

export function useCrudModal() {
  const context = useContext(CrudModalContext);
  if (!context) {
    throw new Error("useCrudModal must be used within a CrudModalProvider");
  }
  return context;
}
