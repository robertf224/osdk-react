import { Attachment } from "@osdk/api";
import { useSuspenseQuery, UseSuspenseQueryResult } from "@tanstack/react-query";
import { blobToDataUrl } from "../utils";

export function useAttachment(attachment: Attachment): UseSuspenseQueryResult<string> {
    return useSuspenseQuery({
        queryKey: ["osdk", "attachment", attachment.rid],
        queryFn: async () => {
            const contents = await attachment.fetchContents();
            const blob = await contents.blob();
            return blobToDataUrl(blob);
        },
        staleTime: Infinity,
    });
}
