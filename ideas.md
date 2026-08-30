# Baseline Pickle Club — Design Direction

## Chosen approach: Baseline Pickle Club

### Design Movement
Contemporary sports-club editorial: the utility of a court operations system presented with the confidence of a premium racket-sport club. The visual language borrows from painted court geometry, clubhouse wayfinding, and sports magazine pacing rather than generic SaaS.

### Core Principles
1. **Court geometry is the interface.** Availability lanes, net lines, service-box angles, and court labels make the product legible at a glance.
2. **Energy is reserved for intent.** Ball yellow is used for bookable/selected actions; green and chalk form a calm operational canvas.
3. **Editorial hierarchy over dashboard sameness.** Large, opinionated headlines and asymmetric compositions create a recognizable club identity.
4. **Operational clarity stays premium.** Dense booking data gets generous spacing, crisp type, and accessible contrast.

### Color Philosophy
Court Green `#1C5B4F` is the grounded base: it feels like painted flooring and communicates trust. Chalk White `#F7F9F5` keeps the experience bright without a generic white SaaS feel. Graphite `#17211F` gives text and navigation a durable, equipment-like quality. Ball Yellow `#D7F45B` is the signature action color: rare, high-contrast, and reserved for “play now” moments. Line Blue `#8DC7D9` references court markings and cool indoor light. Soft Mint `#E4F0E9` provides a low-noise secondary surface.

### Layout Paradigm
A public shell moves from editorial hero to court-first availability lanes. The board is intentionally asymmetric: court identity sits to the left while time runs horizontally across the page. Admin screens use a persistent rail and resource lanes instead of table-first layouts.

### Signature Elements
- Court-diagram booking lanes with a visible net marker and selected ball-yellow time blocks.
- A small “ball mark” brand icon that repeats in the header, active states, and favicon.
- Directional angled geometry used sparingly in cards and the hero overlay to evoke court boundaries.

### Interaction Philosophy
Every interaction should explain the state of a booking: hover previews the slot, selection updates the summary rail, and step transitions keep the chosen court visible. Buttons have tactile press feedback and visible keyboard focus. Placeholder admin actions disclose their demo nature via toast.

### Animation
Use 180–260ms ease-out entrances, stagger grouped court lanes by 50ms, and transition availability selection through opacity/transform only. Booking steps slide/fade as a single deliberate state change. Under `prefers-reduced-motion`, keep layout static and only preserve color/state changes.

### Typography System
Display: Space Grotesk, 700–800 for expressive headings and court labels. Body/UI: DM Sans, 400–700 for booking data, labels, and admin navigation. Headings use tight tracking; metadata uses uppercase, letter-spaced microcopy.

### Brand Essence
**A court-first booking engine for modern pickleball clubs that makes finding your next game feel as good as playing it.** Personality: precise, spirited, generous.

### Brand Voice
Headlines are direct, kinetic, and a little knowing. CTAs describe the real action instead of generic conversion language. Example lines: “Your court is waiting.” and “Show me the open lanes.”

### Wordmark & Logo
The wordmark uses a heavy geometric lowercase treatment for “baseline” paired with a tiny overline court mark. The standalone mark is a lime ball intersected by a clean net line, designed to remain recognizable at small sizes.

### Signature Brand Color
Ball Yellow `#D7F45B` — ownable because it appears only at moments of availability, selection, and action.

## System vs. vertical-specific skin

**Core system:** public navigation, availability board pattern, booking stepper, account shell, admin sidebar, KPI cards, filters, focus states, responsive breakpoints, toast feedback, and reduced-motion behavior.

**Pickleball skin:** court lane geometry, court and session vocabulary, racket rental add-on, club imagery, court-green/line-blue palette, ball-yellow selection state, and pickleball-specific copy. A gym skin can swap in class/studio vocabulary and a capacity bar; a café skin can swap in table/party-size vocabulary and seating diagrams while preserving the same system components.
