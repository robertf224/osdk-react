"use client";

import { getUserIdFromToken } from "@bobbyfidz/osdk-utils";
import { invariant } from "@bobbyfidz/panic";
import { User } from "@osdk/foundry.admin";
import { UseSuspenseQueryResult } from "@tanstack/react-query";
import React from "react";
import { useOsdkContext } from "../OsdkContext";
import { useUser } from "./useUser";

export function useCurrentUser(): UseSuspenseQueryResult<User> {
    const { client } = useOsdkContext();
    const token = React.use(client.__osdkClientContext.tokenProvider());
    const result = useUser(getUserIdFromToken(token));
    invariant(result.data, "Current user not found, this should never happen.");
    return result as UseSuspenseQueryResult<User>;
}
