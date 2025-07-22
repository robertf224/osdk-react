import { Attachment } from "@osdk/api";
import { Attachments } from "@osdk/foundry.ontologies";
import { useSuspenseQuery, UseSuspenseQueryResult } from "@tanstack/react-query";
import { useOsdkContext } from "../OsdkContext";

export interface AttachmentMetadata {
    rid: string;
    filename: string;
    sizeBytes: number;
    mediaType: string;
}

export function useAttachmentMetadata(
    attachment: Attachment | string
): UseSuspenseQueryResult<AttachmentMetadata> {
    const { client } = useOsdkContext();
    const rid = typeof attachment === "string" ? attachment : attachment.rid;
    return useSuspenseQuery({
        queryKey: ["osdk", "attachment-metadata", rid],
        queryFn: async (): Promise<AttachmentMetadata> => {
            const attachment = await Attachments.get(client, rid);
            return {
                ...attachment,
                sizeBytes: Number(attachment.sizeBytes),
            };
        },
        staleTime: Infinity,
    });
}
