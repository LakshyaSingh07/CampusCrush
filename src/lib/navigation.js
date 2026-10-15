// Opens a conversation. Name/photo are passed along so the chat header can
// render immediately without another request.
export const openChat = (router, matchId, profile) =>
  router.push({
    pathname: "/chat/[matchId]",
    params: {
      matchId,
      name: profile.first_name,
      photo: profile.photos?.[0] ?? "",
      otherUserId: profile.user_id,
    },
  });
