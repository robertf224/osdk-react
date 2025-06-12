import { Users } from "@osdk/foundry.admin";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UseSuspenseQueryResult } from "@tanstack/react-query";
import { useOsdkContext } from "../OsdkContext";

export function useUserProfilePicture(
    userId: string
): [string | null, Omit<UseSuspenseQueryResult<string | null>, "data">] {
    const { client } = useOsdkContext();
    const { data, ...rest } = useSuspenseQuery({
        queryFn: async () => {
            const result = await Users.profilePicture(client, userId);
            // Typing is wrong here.
            if (result) {
                const blob = await result.blob();
                return URL.createObjectURL(blob);
            }
            return null;
        },
        queryKey: ["osdk", "user-profile-picture", userId],
    });
    return [data, rest];
}
