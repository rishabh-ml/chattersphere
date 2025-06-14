"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import CreatePostModal from "../components/create-post-modal";

interface CreatePostModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const CreatePostModalContext = createContext<CreatePostModalContextType | undefined>(undefined);

export function CreatePostModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <CreatePostModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      <CreatePostModal isOpen={isOpen} onClose={closeModal} />
    </CreatePostModalContext.Provider>
  );
}

export function useCreatePostModal() {
  const context = useContext(CreatePostModalContext);
  if (context === undefined) {
    throw new Error("useCreatePostModal must be used within a CreatePostModalProvider");
  }
  return context;
}
