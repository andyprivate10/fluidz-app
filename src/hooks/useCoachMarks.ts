const COACH_MARKS = ['home_create', 'explore_grid', 'contacts_section_empty', 'session_votes'] as const
type CoachMarkId = typeof COACH_MARKS[number]

export function useCoachMarks() {
  function isSeen(id: CoachMarkId): boolean {
    return localStorage.getItem('cm_' + id) === '1'
  }
  function markSeen(id: CoachMarkId) {
    localStorage.setItem('cm_' + id, '1')
  }
  function shouldShow(id: CoachMarkId): boolean {
    return !isSeen(id)
  }
  return { isSeen, markSeen, shouldShow }
}
