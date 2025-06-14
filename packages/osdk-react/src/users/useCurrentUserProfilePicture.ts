"use client";

import { getUserIdFromToken } from "@bobbyfidz/osdk-utils";
import { invariant } from "@bobbyfidz/panic";
import { UseSuspenseQueryResult } from "@tanstack/react-query";
import React from "react";
import { useOsdkContext } from "../OsdkContext";
import { useUserProfilePicture } from "./useUserProfilePicture";

export function useCurrentUserProfilePicture(): UseSuspenseQueryResult<string> {
    const { client } = useOsdkContext();
    const token = React.use(client.__osdkClientContext.tokenProvider());
    const result = useUserProfilePicture(getUserIdFromToken(token));
    invariant(result.data, "Current user not found, this should never happen.");
    return result as UseSuspenseQueryResult<string>;
}
