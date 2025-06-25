import { Attachment } from "@osdk/api";
import { useSuspenseQuery, UseSuspenseQueryResult } from "@tanstack/react-query";

export function useAttachment(attachment: Attachment): UseSuspenseQueryResult<string> {
    return useSuspenseQuery({
        queryKey: ["osdk", "attachment-url", attachment.rid],
        queryFn: async () => {
            const contents = await attachment.fetchContents();
            const blob = await contents.blob();
            return URL.createObjectURL(blob);
        },
        staleTime: Infinity,
    });
}
