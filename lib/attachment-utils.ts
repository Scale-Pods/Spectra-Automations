import { MessageAttachment, getAttachmentCategory } from "@/components/chat/chat-attachment-preview";

/**
 * Links message_attachments to messages by:
 * 1. Exact message_id match
 * 2. Inbound AI summary text match ([Customer sent an image...], [Customer sent an audio...], etc.)
 * 3. Proximity of created_at / date
 */
export function linkAttachmentsToMessages<T extends { id?: string; content?: string; date?: string | null; type?: string; attachments?: MessageAttachment[]; raw?: any }>(
    messages: T[],
    attachments: MessageAttachment[]
): { messagesWithAttachments: T[]; unlinkedAttachments: MessageAttachment[] } {
    if (!attachments || attachments.length === 0) {
        return {
            messagesWithAttachments: messages.map(m => ({ ...m, attachments: m.attachments || [] })),
            unlinkedAttachments: []
        };
    }

    // Clone messages with fresh attachments array
    const messageList: T[] = messages.map(m => ({
        ...m,
        attachments: [...(m.attachments || [])]
    }));

    const unassigned: MessageAttachment[] = [];

    // Pass 1: Direct message_id match
    for (const att of attachments) {
        if (att.message_id) {
            const matchedMsg = messageList.find(
                m => (m.id && m.id === att.message_id) || (m.raw?.id && m.raw.id === att.message_id)
            );
            if (matchedMsg) {
                if (!matchedMsg.attachments!.some(a => a.id === att.id)) {
                    matchedMsg.attachments!.push(att);
                }
                continue;
            }
        }
        unassigned.push(att);
    }

    if (unassigned.length === 0) {
        return { messagesWithAttachments: messageList, unlinkedAttachments: [] };
    }

    // Pass 2: Match by AI summary content keywords
    const stillUnassigned: MessageAttachment[] = [];

    for (const att of unassigned) {
        const cat = getAttachmentCategory(att);
        let candidate: T | null = null;

        if (cat === "image") {
            // Find message containing image summary: "[Customer sent an image", "What the image shows"
            candidate = messageList.find(m =>
                (m.content && (/\[Customer sent an image/i.test(m.content) || /What the image shows/i.test(m.content))) &&
                !m.attachments!.some(a => a.id === att.id)
            ) || null;
        } else if (cat === "audio") {
            // Find message containing audio summary: "[Customer sent an audio", "Transcript:"
            candidate = messageList.find(m =>
                (m.content && (/\[Customer sent an audio/i.test(m.content) || /audio message/i.test(m.content) || /Transcript:/i.test(m.content))) &&
                !m.attachments!.some(a => a.id === att.id)
            ) || null;
        } else if (cat === "video") {
            candidate = messageList.find(m =>
                (m.content && (/\[Customer sent a video/i.test(m.content) || /video/i.test(m.content))) &&
                !m.attachments!.some(a => a.id === att.id)
            ) || null;
        } else if (cat === "document") {
            candidate = messageList.find(m =>
                (m.content && (/\[Customer sent a document/i.test(m.content) || /\[Customer sent a file/i.test(m.content) || /document/i.test(m.content))) &&
                !m.attachments!.some(a => a.id === att.id)
            ) || null;
        }

        if (candidate) {
            candidate.attachments!.push(att);
        } else {
            stillUnassigned.push(att);
        }
    }

    // Pass 3: If still unassigned and there's a close timestamp match with an inbound user message
    const remainingUnassigned: MessageAttachment[] = [];
    for (const att of stillUnassigned) {
        if (att.created_at && messageList.length > 0) {
            const attTime = new Date(att.created_at).getTime();
            let closestMsg: T | null = null;
            let minDiff = 15 * 60 * 1000; // within 15 minutes

            for (const m of messageList) {
                if (m.date) {
                    const msgTime = new Date(m.date).getTime();
                    const diff = Math.abs(attTime - msgTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestMsg = m;
                    }
                }
            }

            if (closestMsg) {
                closestMsg.attachments!.push(att);
                continue;
            }
        }
        remainingUnassigned.push(att);
    }

    return {
        messagesWithAttachments: messageList,
        unlinkedAttachments: remainingUnassigned
    };
}
