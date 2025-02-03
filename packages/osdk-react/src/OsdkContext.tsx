"use client";

import React from "react";
import { OntologyStore } from "./ontology-store";

export interface OsdkContext {
    store: OntologyStore;
}

export const OsdkContext = React.createContext<OsdkContext | undefined>(undefined);

export function useOsdkContext(): OsdkContext {
    const context = React.useContext(OsdkContext);
    if (!context) {
        throw new Error("OsdkContext is missing, did you forget to add OsdkProvider as a parent?");
    }
    return context;
}
