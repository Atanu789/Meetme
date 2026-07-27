# Key Page Dependency Trees

## `/` (Landing)
Entry: `app/page.tsx`
Dependencies:
- `components/ui/footer.tsx`
- `lucide-react` icon set

## `/lms/instructor` (Instructor workspace)
Entry: `app/lms/instructor/page.tsx`
Dependencies:
- `components/lms/LmsGate.tsx`
- `components/lms/InstructorLmsDashboard.tsx`
  - `components/lms/LmsShell.tsx`
  - `components/lms/LmsMeetingActions.tsx`
  - `components/lms/AIMeetingNotesPanel.tsx`
  - `components/FileShare.tsx`
  - `components/ui/glow-card.tsx`
  - `components/ui/gradient-border-button.tsx`

## `/lms/student` (Student workspace)
Entry: `app/lms/student/page.tsx`
Dependencies:
- `components/lms/LmsGate.tsx`
- `components/lms/StudentLmsDashboard.tsx`
  - `components/lms/LmsShell.tsx`
  - `components/lms/LmsMeetingActions.tsx`
  - `components/lms/AIMeetingNotesPanel.tsx`
  - `components/ui/glow-card.tsx`
  - `components/ui/gradient-border-button.tsx`

## `/room/[id]` (Meeting)
Entry: `app/room/[id]/page.tsx`
Dependencies:
- `components/JitsiMeetingContainer.tsx`
- `components/AIResultsDisplay.tsx`
- `components/CaptionOverlay.tsx`
- `components/FileShare.tsx`
- `components/TaskList.tsx`
- `components/Polls.tsx`
- `components/Whiteboard.tsx`

## `/recordings/[id]` (Recording detail)
Entry: `app/recordings/[id]/page.tsx`
Dependencies:
- `components/AIResultsDisplay.tsx`
- `components/ParticipationAnalytics.tsx`
