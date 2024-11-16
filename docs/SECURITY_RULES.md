# Security Rules for Net40k

## 1. Username Security Policy

### Core Rule
The username field is a privileged field that must be treated with special security considerations. It should only be accessible in specific security-related contexts.

### Allowed Usage of Username
- Login operations
- Logout operations
- Administrative/security operations (when explicitly required)

### Restricted Usage
Username must NEVER be:
- Passed to any service layer methods (except auth/security services)
- Used in game logic
- Used in chat systems
- Exposed in any API responses (except auth endpoints)
- Stored in any collection other than the user collection

### Permitted User Identifiers
For all other operations, only these identifiers should be used:
1. userUuid - For database relations and internal operations
2. nickname - For display purposes in UI, chat, and game interfaces

## 2. UUID Naming Convention

### Core Rule
All unique identifiers in the system must use the suffix "Uuid" in their naming. The terms "id" or "_id" are strictly forbidden at service layer and above.

### Implementation Requirements
- All service layer methods must use `Uuid` suffix for identifiers
- Test data must use `Uuid` in field names
- Database queries at service layer must reference fields with `Uuid` suffix
- API requests and responses must use `Uuid` naming convention
- Client-side code must maintain `Uuid` naming convention

### Restricted Terms
The following terms are forbidden in service layers and above:
- `id`
- `_id`
- Any camelCase or snake_case variations of 'id'

### Database Layer Exception
- Only the lowest database layer may interact with MongoDB's native `_id` field
- Any transformation between `_id` and `[entity]Uuid` must happen at the database adapter layer

### Validation Requirements
- Code reviews must verify proper UUID naming convention
- Tests must use correct UUID field names
- Linting rules should enforce UUID naming convention
- Integration tests should verify proper UUID field names in API responses
