export function getPortionText(weightMaxG: number): string {
  if (weightMaxG < 30) return "约一小口";
  if (weightMaxG < 80) return "约一小份";
  if (weightMaxG < 150) return "约一小盘";
  if (weightMaxG < 250) return "约一小碗";
  if (weightMaxG < 400) return "约一大盘";
  return "约一大碗";
}
