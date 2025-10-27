export const getInitials = (name?: string | null): string => {
  if (!name?.trim()) {
    return "AC";
  }

  const names = name.trim().split(/\s+/).filter(Boolean);

  if (names.length === 0) {
    return "AC";
  }

  if (names.length === 1) {
    const firstName = names[0];
    if (!firstName) return "AC";
    return firstName.length >= 2
      ? firstName.substring(0, 2).toUpperCase()
      : (firstName[0] ?? "A").toUpperCase() + "C";
  }

  const firstInitial = names[0]?.[0];
  const lastInitial = names[names.length - 1]?.[0];

  if (!firstInitial || !lastInitial) {
    return "AC";
  }

  return (firstInitial + lastInitial).toUpperCase();
};
