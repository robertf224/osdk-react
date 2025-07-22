import { Attachment } from "@osdk/api";
import { Attachments } from "@osdk/foundry.ontologies";
import { useSuspenseQuery, UseSuspenseQueryResult } from "@tanstack/react-query";
import { useOsdkContext } from "../OsdkContext";
import { blobToDataUrl } from "../utils";

export function useAttachment(attachment: Attachment | string): UseSuspenseQueryResult<string> {
    const { client } = useOsdkContext();
    const rid = typeof attachment === "string" ? attachment : attachment.rid;
    return useSuspenseQuery({
        queryKey: ["osdk", "attachment", rid],
        queryFn: async () => {
            const contents = await Attachments.read(client, rid);
            const blob = await contents.blob();
            return blobToDataUrl(blob);
        },
        staleTime: Infinity,
    });
}
