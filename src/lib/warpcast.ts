interface SendMessageParams {
  conversationId?: string;
  groupId?: string;
  recipientFid?: string;
  message: string;
  inReplyToMessageId?: string;
  idempotencyKey?: string;
}

interface SendMessageResponse {
  result: {
    messageId: string;
    conversationId?: string;
  };
}

export async function sendMessage(
  params: SendMessageParams,
  authToken: string
): Promise<SendMessageResponse> {
  console.log("Sending message", params);

  // Validate that exactly one target is specified
  const targets = [
    params.conversationId,
    params.groupId,
    params.recipientFid,
  ].filter(Boolean);
  if (targets.length !== 1) {
    throw new Error(
      "Exactly one of conversationId, groupId, or recipientFid must be specified"
    );
  }

  // Validate message length
  if (params.message.length > 1024) {
    throw new Error("Message length cannot exceed 1024 characters");
  }

  try {
    const response = await fetch("https://api.warpcast.com/fc/message", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        "idempotency-key": params.idempotencyKey || crypto.randomUUID(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${
          response.status
        } (${await response.text()})`
      );
    }

    return (await response.json()) as SendMessageResponse;
  } catch (error) {
    throw new Error(
      `Failed to send message: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
