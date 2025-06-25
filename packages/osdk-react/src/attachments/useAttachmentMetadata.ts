import { Attachment } from "@osdk/api";
import { useSuspenseQuery, UseSuspenseQueryResult } from "@tanstack/react-query";

export interface AttachmentMetadata {
    rid: string;
    filename: string;
    sizeBytes: number;
    mediaType: string;
}

export function useAttachmentMetadata(attachment: Attachment): UseSuspenseQueryResult<AttachmentMetadata> {
    return useSuspenseQuery({
        queryKey: ["osdk", "attachment-metadata", attachment.rid],
        queryFn: () => attachment.fetchMetadata(),
        staleTime: Infinity,
    });
}
