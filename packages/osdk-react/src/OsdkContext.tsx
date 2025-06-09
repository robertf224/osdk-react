"use client";

import React from "react";
import { Client } from "@osdk/client";

export interface OsdkContext {
    client: Client;
}

export const OsdkContext = React.createContext<OsdkContext | undefined>(undefined);

export function useOsdkContext(): OsdkContext {
    const context = React.useContext(OsdkContext);
    if (!context) {
        throw new Error("OsdkContext is missing, did you forget to add OsdkProvider as a parent?");
    }
    return context;
}
