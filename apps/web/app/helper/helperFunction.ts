export const getStatus = (
  startTime: Date,
  endTime: Date
): "UPCOMING" | "ACTIVE" | "ENDED" => {

  const currentTime = new Date();

  if (currentTime >= endTime) {
    return "ENDED";
  }

  if (currentTime < startTime) {
    return "UPCOMING";
  }

  return "ACTIVE";
};