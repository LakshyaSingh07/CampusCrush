// Bumble-style "first move" rules. The server decides (matches.first_mover,
// expires_at) and enforces them; these helpers only describe the state.

// Who sends the first message in a new match between these two genders
export const firstMoveRole = (myGender, theirGender) => {
  if (myGender === "Woman" && theirGender === "Man") return "me";
  if (myGender === "Man" && theirGender === "Woman") return "them";
  return "either";
};

// State of a get_my_matches() row from my point of view
export const matchStatus = (match, myId) => {
  if (!match.first_message_at) {
    if (!match.first_mover) return { kind: "say_hi", canSend: true };
    if (match.first_mover === myId) return { kind: "your_move", canSend: true };
    return { kind: "their_move", canSend: false };
  }
  if (match.expires_at && match.first_sender !== myId) return { kind: "your_turn", canSend: true };
  if (match.expires_at) return { kind: "waiting_reply", canSend: true };
  return { kind: "chatting", canSend: true };
};

export const STATUS_LABELS = {
  say_hi: "Say hi",
  your_move: "Your move",
  their_move: "Their move",
  your_turn: "Your turn",
  waiting_reply: "Waiting for reply",
};

export const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, Math.floor(ms / 60000))}m left`;
};
