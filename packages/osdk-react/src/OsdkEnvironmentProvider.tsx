"use client";

import { Client } from "@osdk/client";
import React from "react";
import { OsdkContext } from "./OsdkContext";
import { OntologyStore } from "./ontology-store";

export interface OsdkEnvironmentProviderProps {
    client: Client;
    children: React.ReactNode;
}

export const OsdkEnvironmentProvider: React.FC<OsdkEnvironmentProviderProps> = ({ client, children }) => {
    const osdkContext: OsdkContext = React.useMemo(() => {
        return { store: OntologyStore(client) };
    }, [client]);
    return <OsdkContext.Provider value={osdkContext}>{children}</OsdkContext.Provider>;
};
