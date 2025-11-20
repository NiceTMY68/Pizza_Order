export const formatDuration = (start) => {
  if (!start) return '-- --';
  const diffMs = Date.now() - new Date(start).getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

export const formatClock = (date = new Date()) => {
  return date
    .toLocaleTimeString('en-US', { hour12: false })
    .split(':')
    .slice(0, 3)
    .join(':');
};

