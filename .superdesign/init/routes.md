# Route Map

| Route | Entry | Layout | Purpose |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | root | Product landing page |
| `/lms` | `app/lms/page.tsx` | root | Role-aware LMS redirect |
| `/lms/instructor` | `app/lms/instructor/page.tsx` | root | Instructor workspace |
| `/lms/student` | `app/lms/student/page.tsx` | root | Student workspace |
| `/lms/admin` | `app/lms/admin/page.tsx` | root | Admin console bridge |
| `/room/[id]` | `app/room/[id]/page.tsx` | root | Meeting room |
| `/recordings/[id]` | `app/recordings/[id]/page.tsx` | root | Recording detail |
| `/pricing` | `app/pricing/page.tsx` | pricing layout | Subscription and credits |
| `/admin` | `app/admin/page.tsx` | admin layout | System administration |
| `/documentation` | `app/documentation/page.tsx` | root | Product documentation |

The proposed Studio is a new target route and will use the root layout and the LMS visual language.
