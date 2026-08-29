export function computeActiveStudents(users, studentLogs) {
  const lastActivity = {}
  for (const log of studentLogs) {
    const ts = log.timestamp ? new Date(log.timestamp).getTime() : 0
    if (!lastActivity[log.studentId] || ts > lastActivity[log.studentId]) {
      lastActivity[log.studentId] = ts
    }
  }
  return [...users]
    .filter(u => (u.role ?? 'student') === 'student')
    .map(u => ({
      ...u,
      lastActivity: lastActivity[u.studentId] || (u.lastVisit ? new Date(u.lastVisit).getTime() : 0)
    }))
    .sort((a, b) => b.lastActivity - a.lastActivity)
    .slice(0, 5)
}

export function computeNewStudents(users) {
  return [...users]
    .filter(u => (u.role ?? 'student') === 'student')
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)
}
