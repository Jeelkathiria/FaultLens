# FaultLens Project Rules & Multi-Tenant Architecture

## IMPORTANT MULTI-TENANT RULE:

FaultLens is a multi-developer system.

There is exactly one ADMIN role/account and multiple DEVELOPER accounts.

Each DEVELOPER can own multiple Websites/Applications.
Each Website can contain multiple APIs.

The ownership chain is:

User → Website → API → Metrics/Logs/Anomalies/Incidents/Deployments

Every backend query involving developer-owned resources MUST enforce ownership through this chain.

Never trust IDs supplied by the frontend.

Never return another developer's records.

For resource lookups, prefer returning 404 when the resource is outside the authenticated developer's accessible scope, so the API does not reveal whether another tenant's resource exists.

Use 403 for authenticated users attempting actions they are explicitly forbidden from performing, such as a DEVELOPER accessing ADMIN-only endpoints.

Test this with at least two developer accounts:

Developer 1:
developer@faultlens.dev

Developer 2:
dev2@faultlens.dev

Developer 1 must see only:
ShopSphere + FoodRush

Developer 2 must see only:
TaskFlow

Admin must see all three.

This isolation must apply to:
- Websites
- APIs
- Request metrics
- Metric aggregates
- Logs
- Anomalies
- Incidents
- Incident events
- Deployments
- API keys
- WebSocket subscriptions
- Dashboard statistics

### Telemetry Security:
The telemetry endpoint (`POST /api/v1/telemetry`) must strictly verify the API Key → User → Website → API ownership chain, rather than accepting an `apiId` and trusting it. If the API does not belong to the authenticated key holder, reject with 404 (Resource Not Found) to avoid leaking the existence of other tenants' APIs.
