"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AppDialogContext = createContext(null);

export function AppDialogProvider({ children }) {
  const [request, setRequest] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const resolverRef = useRef(null);

  const finish = useCallback((value) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setRequest(null);
    resolve?.(value);
  }, []);

  const confirmAction = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setRequest({
        kind: "confirm",
        title: options.title ?? "Confirm action",
        description: options.description,
        actionLabel: options.actionLabel ?? "Continue",
        cancelLabel: options.cancelLabel ?? "Cancel",
      });
    });
  }, []);

  const requestText = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setInputValue(options.defaultValue ?? "");
      setRequest({
        kind: "prompt",
        title: options.title ?? "Additional information",
        description: options.description,
        label: options.label ?? "Details",
        placeholder: options.placeholder ?? "",
        actionLabel: options.actionLabel ?? "Continue",
        cancelLabel: options.cancelLabel ?? "Cancel",
        minLength: options.minLength ?? 1,
        validationMessage: options.validationMessage,
      });
    });
  }, []);

  const promptOpen = request?.kind === "prompt";
  const confirmOpen = request?.kind === "confirm";
  const trimmedInput = inputValue.trim();
  const promptIsValid = promptOpen && trimmedInput.length >= request.minLength;

  return (
    <AppDialogContext.Provider value={{ confirmAction, requestText }}>
      {children}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && confirmOpen) finish(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmOpen ? request.title : "Confirm action"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOpen ? request.description : "Please confirm this action."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finish(false)}>
              {confirmOpen ? request.cancelLabel : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => finish(true)}>
              {confirmOpen ? request.actionLabel : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={promptOpen}
        onOpenChange={(open) => {
          if (!open && promptOpen) finish(null);
        }}
      >
        <DialogContent showCloseButton={false} className="sk-feedback rounded-2xl p-6 shadow-2xl sm:max-w-[480px]">
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (promptIsValid) finish(trimmedInput);
            }}
          >
            <DialogHeader>
              <DialogTitle>{promptOpen ? request.title : "Additional information"}</DialogTitle>
              <DialogDescription>
                {promptOpen ? request.description : "Enter the required information."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="app-dialog-input">
                {promptOpen ? request.label : "Details"}
              </Label>
              <Textarea
                id="app-dialog-input"
                autoFocus
                value={inputValue}
                placeholder={promptOpen ? request.placeholder : ""}
                aria-invalid={promptOpen && inputValue.length > 0 && !promptIsValid}
                onChange={(event) => setInputValue(event.target.value)}
              />
              {promptOpen && inputValue.length > 0 && !promptIsValid ? (
                <p className="text-sm text-destructive">
                  {request.validationMessage ?? `Enter at least ${request.minLength} characters.`}
                </p>
              ) : null}
            </div>

            <DialogFooter className="-mx-6 -mb-6 rounded-b-2xl p-6">
              <Button type="button" variant="outline" onClick={() => finish(null)}>
                {promptOpen ? request.cancelLabel : "Cancel"}
              </Button>
              <Button type="submit" disabled={!promptIsValid}>
                {promptOpen ? request.actionLabel : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(AppDialogContext);

  if (!context) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }

  return context;
}
