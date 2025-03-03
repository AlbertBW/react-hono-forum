export const handleRateLimitError = (response: Response) => {
  if (response.status !== 429) {
    return null;
  }

  const resetSeconds = response.headers.get("x-ratelimit-reset");
  const resetTime = resetSeconds ? parseInt(resetSeconds, 10) : 60;

  return {
    error: "RATE_LIMITED",
    message: "Too many requests, please try again later",
    resetAfter: resetTime,
  };
};
